import type { AuthResponse } from '@/types';

const TOKEN_KEY = 'clearloop_token';
const USER_KEY = 'clearloop_user';
const TENANT_KEY = 'clearloop_tenant';

export const auth = {
  setAuth(data: AuthResponse) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(TENANT_KEY, JSON.stringify(data.tenant));
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  getTenant() {
    if (typeof window !== 'undefined') {
      const tenant = localStorage.getItem(TENANT_KEY);
      return tenant ? JSON.parse(tenant) : null;
    }
    return null;
  },

  clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TENANT_KEY);
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
