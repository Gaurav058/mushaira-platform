const TOKEN_KEY = 'mushaira_admin_token';
const REFRESH_KEY = 'mushaira_admin_refresh';
const COOKIE_NAME = 'mushaira_admin_auth';

export const auth = {
  setTokens(access: string, refresh: string): void {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    // Readable cookie for middleware (not httpOnly for simplicity)
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
