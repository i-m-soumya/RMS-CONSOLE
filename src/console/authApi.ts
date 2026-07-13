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
}

export const authApiClient = new AuthApiClient();
