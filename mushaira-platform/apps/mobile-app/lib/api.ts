import axios from 'axios';
import Constants from 'expo-constants';
import { storage } from './storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await api.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token } = data.data;
        await storage.saveTokens(access_token, refresh_token);
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch {
        await storage.clearTokens();
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile_number: string) =>
    api.post<{ data: { message: string } }>('/auth/send-otp', {
      mobile_number,
    }),

  verifyOtp: (mobile_number: string, otp: string) =>
    api.post<{ data: { access_token: string; refresh_token: string } }>(
      '/auth/verify-otp',
      { mobile_number, otp },
    ),
};

// ─── Events ──────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: any[]; total: number; totalPages: number } }>(
      '/events',
      { params },
    ),

  getById: (id: string) => api.get<{ data: any }>(`/events/${id}`),

  getCategories: () =>
    api.get<{ data: any[] }>('/events/categories'),
};

// ─── Registrations ───────────────────────────────────────────────────────────
export const registrationsApi = {
  register: (eventId: string, body: Record<string, unknown>) =>
    api.post<{ data: any }>(`/registrations/events/${eventId}`, body),

  getMy: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: any[]; total: number; totalPages: number } }>(
      '/registrations/my',
      { params },
    ),

  getById: (id: string) => api.get<{ data: any }>(`/registrations/${id}`),

  getQrPass: (registrationId: string) =>
    api.get<{ data: any }>(`/registrations/${registrationId}/qr-pass`),
};

// ─── User ────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get<{ data: any }>('/users/me'),

  updateProfile: (body: Record<string, unknown>) =>
    api.patch<{ data: any }>('/users/me', body),

  getFamilyMembers: () =>
    api.get<{ data: any[] }>('/users/me/family-members'),

  addFamilyMember: (body: Record<string, unknown>) =>
    api.post<{ data: any }>('/users/me/family-members', body),

  updateFamilyMember: (id: string, body: Record<string, unknown>) =>
    api.patch<{ data: any }>(`/users/me/family-members/${id}`, body),

  removeFamilyMember: (id: string) =>
    api.delete<{ data: any }>(`/users/me/family-members/${id}`),
};
