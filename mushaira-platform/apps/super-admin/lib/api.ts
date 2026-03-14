import axios from 'axios';
import { auth } from './auth';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = auth.getRefreshToken();
        if (!refresh) throw new Error('No refresh token');
        const { data } = await api.post('/auth/refresh', { refresh_token: refresh });
        auth.setTokens(data.data.access_token, data.data.refresh_token);
        original.headers.Authorization = `Bearer ${data.data.access_token}`;
        return api(original);
      } catch {
        auth.clear();
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile_number: string) =>
    api.post<{ data: { message: string } }>('/auth/send-otp', { mobile_number }),
  verifyOtp: (mobile_number: string, otp: string) =>
    api.post<{ data: { access_token: string; refresh_token: string } }>(
      '/auth/verify-otp', { mobile_number, otp },
    ),
};

// ─── Organisers ───────────────────────────────────────────────────────────
export const organisersApi = {
  getStats: () => api.get<{ data: any }>('/organisers/stats/platform'),
  list: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: any[]; total: number; totalPages: number } }>(
      '/organisers', { params },
    ),
  getById: (id: string) => api.get<{ data: any }>(`/organisers/${id}`),
  create: (body: Record<string, unknown>) =>
    api.post<{ data: any }>('/organisers', body),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<{ data: any }>(`/organisers/${id}`, body),
  toggleStatus: (id: string) =>
    api.patch<{ data: any }>(`/organisers/${id}/status`),
};

// ─── Users ────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: any[]; total: number; totalPages: number } }>(
      '/users', { params },
    ),
  changeRole: (id: string, role: string) =>
    api.patch<{ data: any }>(`/users/${id}/role`, { role }),
  toggleStatus: (id: string) =>
    api.patch<{ data: any }>(`/users/${id}/status`),
};

// ─── Events ───────────────────────────────────────────────────────────────
export const eventsApi = {
  listManage: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: any[]; total: number; totalPages: number } }>(
      '/events/manage', { params },
    ),
  changeStatus: (id: string, status: string) =>
    api.patch<{ data: any }>(`/events/${id}/status`, { status }),
};

// ─── Categories ───────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get<{ data: any[] }>('/events/categories'),
  create: (body: Record<string, unknown>) =>
    api.post<{ data: any }>('/events/categories', body),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<{ data: any }>(`/events/categories/${id}`, body),
  remove: (id: string) =>
    api.delete<{ data: any }>(`/events/categories/${id}`),
};

// ─── User Profile ─────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get<{ data: any }>('/users/me'),
};
