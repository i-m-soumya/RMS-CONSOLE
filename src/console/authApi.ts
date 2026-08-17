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

export interface UpdateRestaurantBasicDetailsPayload {
  name?: string;
  slug?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  timezone?: string;
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

export interface AdminMenuCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  item_count: number;
}

export interface AdminMenuItemCategory {
  id: string;
  name: string;
  is_primary_category: boolean;
}

export interface AdminMenuItem {
  id: string;
  name: string;
  description: string | null;
  mrp: number;
  price: number;
  discount_amount: number;
  discount_percentage: number;
  image_url: string | null;
  item_type: 'regular' | 'scheduled' | 'combo' | 'addon_only';
  dietary_type: 'veg' | 'non_veg' | 'vegan' | 'contains_egg';
  spice_level: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot' | null;
  is_available: boolean;
  is_featured: boolean;
  categories: AdminMenuItemCategory[];
  created_at: string;
  updated_at: string;
}

export interface AdminMenuItemsResponse {
  data: AdminMenuItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListAdminMenuItemsFilters {
  search?: string;
  category_id?: string;
  dietary_type?: 'veg' | 'non_veg' | 'vegan' | 'contains_egg';
  item_type?: 'regular' | 'scheduled' | 'combo' | 'addon_only';
  is_available?: 'true' | 'false';
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'price' | 'created_at';
  sort_dir?: 'asc' | 'desc';
}

export interface AdminMenuItemPayload {
  name: string;
  description?: string | null;
  category_ids: string[];
  primary_category_id?: string;
  mrp: number;
  price: number;
  image_url?: string | null;
  item_type: 'regular' | 'scheduled' | 'combo' | 'addon_only';
  dietary_type: 'veg' | 'non_veg' | 'vegan' | 'contains_egg';
  spice_level?: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot' | null;
  is_available: boolean;
}

export interface AdminStaffListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
  role: 'waiter' | 'chef' | 'restaurant_admin' | 'brand_admin';
  access: 'active' | 'revoked';
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  is_online: boolean;
  session_status: 'online' | 'offline';
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  phone?: string | null;
  role: 'waiter' | 'chef';
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

  async updateRestaurantBasicDetails(restaurantId: string, payload: UpdateRestaurantBasicDetailsPayload) {
    const response = await this.fetch(`${API_BASE}/api/platform/restaurants/${restaurantId}/basic-details`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{ data: { id: string } }>(response);
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

  async listAdminMenuCategories() {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/categories`);
    const parsed = await this.parseJsonResponse<{ data: AdminMenuCategory[] }>(response);
    return parsed.data;
  }

  async createAdminMenuCategory(payload: {
    name: string;
    description?: string;
    image_url?: string;
    display_order?: number;
  }) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/categories`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{ data: AdminMenuCategory }>(response);
    return parsed.data;
  }

  async updateAdminMenuCategory(id: string, payload: {
    name?: string;
    description?: string | null;
    image_url?: string | null;
  }) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{ data: AdminMenuCategory }>(response);
    return parsed.data;
  }

  async reorderAdminMenuCategories(order: string[]) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/categories/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ order }),
    });
    return this.parseJsonResponse<{ success: boolean }>(response);
  }

  async deleteAdminMenuCategory(id: string) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/categories/${id}`, {
      method: 'DELETE',
    });
    return this.parseJsonResponse<{ success: boolean }>(response);
  }

  async listAdminMenuItems(filters: ListAdminMenuItemsFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.dietary_type) params.set('dietary_type', filters.dietary_type);
    if (filters.item_type) params.set('item_type', filters.item_type);
    if (filters.is_available) params.set('is_available', filters.is_available);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.sort_by) params.set('sort_by', filters.sort_by);
    if (filters.sort_dir) params.set('sort_dir', filters.sort_dir);

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch(`${API_BASE}/api/admin/menu/items${suffix}`);
    return this.parseJsonResponse<AdminMenuItemsResponse>(response);
  }

  async createAdminMenuItem(payload: AdminMenuItemPayload) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{ data: AdminMenuItem }>(response);
    return parsed.data;
  }

  async updateAdminMenuItem(id: string, payload: Partial<AdminMenuItemPayload>) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{ data: AdminMenuItem }>(response);
    return parsed.data;
  }

  async deleteAdminMenuItem(id: string) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/items/${id}`, {
      method: 'DELETE',
    });
    return this.parseJsonResponse<{ success: boolean }>(response);
  }

  async setAdminMenuItemAvailability(id: string, is_available: boolean) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/items/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available }),
    });
    return this.parseJsonResponse<{ success: boolean; is_available: boolean }>(response);
  }

  async uploadAdminMenuItemPhoto(image_data_url: string) {
    const response = await this.fetch(`${API_BASE}/api/admin/menu/items/upload-photo`, {
      method: 'POST',
      body: JSON.stringify({ image_data_url }),
    });
    const parsed = await this.parseJsonResponse<{ data: { image_url: string } }>(response);
    return parsed.data;
  }

  async listAdminStaff(filters: {
    role?: 'waiter' | 'chef';
    access?: 'active' | 'revoked';
    search?: string;
  } = {}) {
    const params = new URLSearchParams();
    if (filters.role) params.set('role', filters.role);
    if (filters.access) params.set('access', filters.access);
    if (filters.search) params.set('search', filters.search);

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch(`${API_BASE}/api/admin/staff${suffix}`);
    const parsed = await this.parseJsonResponse<{ data: AdminStaffListItem[] }>(response);
    return parsed.data;
  }

  async createAdminStaff(payload: CreateStaffPayload) {
    const response = await this.fetch(`${API_BASE}/api/admin/staff`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const parsed = await this.parseJsonResponse<{ data: { id: string; email: string; role: string; invite_sent: boolean } }>(response);
    return parsed.data;
  }

  async updateAdminStaffAccess(id: string, access: 'active' | 'revoked') {
    const response = await this.fetch(`${API_BASE}/api/admin/staff/${id}/access`, {
      method: 'PATCH',
      body: JSON.stringify({ access }),
    });
    return this.parseJsonResponse<{ success: boolean; access: 'active' | 'revoked' }>(response);
  }

  async resendAdminStaffCredentials(id: string) {
    const response = await this.fetch(`${API_BASE}/api/admin/staff/${id}/resend-credentials`, {
      method: 'POST',
    });
    return this.parseJsonResponse<{ success: boolean; invite_sent: boolean }>(response);
  }
}

export const authApiClient = new AuthApiClient();
