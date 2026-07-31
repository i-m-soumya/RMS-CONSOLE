/**
 * RMS Console Auth API Client
 * Centralizes all backend auth communication, token management, and HTTP header injection
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STORAGE_KEY = 'rms-console-auth-v1';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'platform_admin' | 'restaurant_admin' | 'waiter' | 'chef';
    restaurantId?: string;
    restaurantSlug?: string;
    permissions: string[];
  };
}

export interface StoredAuthSession {
  token: string;
  refreshToken: string;
  user: AuthResponse['user'];
  expiresAt: number;
}

export interface PlatformRestaurantListItem {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  tableCount: number;
  onboardedAt: string;
  city: string;
  state?: string;
  pincode?: string;
  timezone: string;
  address?: string;
}

export interface RestaurantListFilters {
  q?: string;
  status?: 'active' | 'suspended';
  city?: string;
  page?: number;
  pageSize?: number;
}

export interface OnboardBasicDetailsPayload {
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  timezone: string;
  contactEmail?: string;
}

export interface FloorTableInput {
  tableNumber: string;
  capacity: number;
}

export interface FloorInput {
  name: string;
  tables: FloorTableInput[];
}

export interface TableQrArtifact {
  tableId: string;
  tableNumber: string;
  floor: string;
  qrPayload: string;
  qrDataUrl: string;
  filename: string;
}

export interface CreateAdminCredentialsPayload {
  name: string;
  email: string;
  tempPassword?: string;
}

export interface BatchQrZipResult {
  filename: string;
  blob: Blob;
}

class AuthApiClient {
  private storedSession: StoredAuthSession | null = null;

  constructor() {
    this.loadStoredSession();
  }

  private loadStoredSession() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.storedSession = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load stored auth session:', e);
      this.storedSession = null;
    }
  }

  private saveStoredSession(session: StoredAuthSession | null) {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      this.storedSession = session;
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      this.storedSession = null;
    }
  }

  private getAuthHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.storedSession?.token) {
      headers['Authorization'] = `Bearer ${this.storedSession.token}`;
    }
    return headers;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/console-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();

    // Compute expiry from JWT (15min default for access token)
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const session: StoredAuthSession = {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
      expiresAt,
    };

    this.saveStoredSession(session);
    return data;
  }

  async refreshToken(): Promise<AuthResponse | null> {
    if (!this.storedSession?.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.storedSession.refreshToken }),
      });

      if (!response.ok) {
        this.clearSession();
        return null;
      }

      const data: AuthResponse = await response.json();
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const session: StoredAuthSession = {
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        expiresAt,
      };

      this.saveStoredSession(session);
      return data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearSession();
      return null;
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.storedSession) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > this.storedSession.expiresAt) {
      // Try to refresh
      const result = await this.refreshToken();
      return result !== null;
    }

    return true;
  }

  getSession(): StoredAuthSession | null {
    return this.storedSession;
  }

  clearSession() {
    this.saveStoredSession(null);
  }

  logout() {
    this.clearSession();
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const headers = { ...this.getAuthHeaders(), ...options?.headers };
    return fetch(url, { ...options, headers });
  }

  private async parseJsonResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json() as Promise<T>;
  }

  async listPlatformRestaurants(filters: RestaurantListFilters = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.status) params.set('status', filters.status);
    if (filters.city) params.set('city', filters.city);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants${suffix}`);
    const parsed = await this.parseJsonResponse<{ data: PlatformRestaurantListItem[] }>(response);
    return parsed.data;
  }

  async createRestaurantBasicDetails(payload: OnboardBasicDetailsPayload) {
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{ data: { id: string; slug: string; name: string } }>(response);
    return parsed.data;
  }

  async saveFloorsAndTables(restaurantId: string, floors: FloorInput[]) {
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants/${restaurantId}/floors-and-tables`, {
      method: 'PUT',
      body: JSON.stringify({ floors }),
    });
    const parsed = await this.parseJsonResponse<{ data: { floorCount: number; tableCount: number } }>(response);
    return parsed.data;
  }

  async generateRestaurantQRCodes(restaurantId: string) {
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants/${restaurantId}/qr-codes/generate`, {
      method: 'POST',
    });
    const parsed = await this.parseJsonResponse<{ data: { items: TableQrArtifact[] } }>(response);
    return parsed.data.items;
  }

  async getRestaurantQrBatch(restaurantId: string) {
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants/${restaurantId}/qr-codes/batch`);
    const parsed = await this.parseJsonResponse<{ data: { items: TableQrArtifact[] } }>(response);
    return parsed.data.items;
  }

  async downloadRestaurantQrBatchZip(restaurantId: string): Promise<BatchQrZipResult> {
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants/${restaurantId}/qr-codes/batch-download`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || 'Failed to download batch QR zip');
    }

    const contentDisposition = response.headers.get('content-disposition') || '';
    const matched = /filename="([^"]+)"/.exec(contentDisposition);
    const filename = matched?.[1] || `restaurant-${restaurantId}-qrs.zip`;

    return {
      filename,
      blob: await response.blob(),
    };
  }

  async createRestaurantAdminCredentials(restaurantId: string, payload: CreateAdminCredentialsPayload) {
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants/${restaurantId}/admin-credentials`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{
      data: {
        staffId: string;
        email: string;
        role: 'restaurant_admin';
        tempPassword: string;
        emailDelivery: { sent: boolean; messageId: string | null; transport: string };
      };
    }>(response);
    return parsed.data;
  }
}

export const authApiClient = new AuthApiClient();
