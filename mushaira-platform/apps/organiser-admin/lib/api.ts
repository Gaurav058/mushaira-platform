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
    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = auth.getRefreshToken();
        if (!refresh) throw new Error('No refresh token');
        const { data } = await api.post('/auth/refresh', {
          refresh_token: refresh,
        });
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
    api.post<{ data: { message: string } }>('/auth/send-otp', {
      mobile_number,
    }),
  verifyOtp: (mobile_number: string, otp: string) =>
    api.post<{ data: { access_token: string; refresh_token: string } }>(
      '/auth/verify-otp',
      { mobile_number, otp },
    ),
};

// ─── Events ───────────────────────────────────────────────────────────────
export const eventsApi = {
  listManage: (params?: Record<string, unknown>) =>
    api.get<{ data: { items: any[]; total: number; totalPages: number } }>(
      '/events/manage',
      { params },
    ),
  getById: (id: string) => api.get<{ data: any }>(`/events/${id}`),
  create: (body: Record<string, unknown>) =>
    api.post<{ data: any }>('/events', body),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<{ data: any }>(`/events/${id}`, body),
  changeStatus: (id: string, status: string) =>
    api.patch<{ data: any }>(`/events/${id}/status`, { status }),
  getCategories: () => api.get<{ data: any[] }>('/events/categories'),
  getGates: (id: string) => api.get<{ data: any[] }>(`/events/${id}/gates`),
  addGate: (id: string, body: Record<string, unknown>) =>
    api.post<{ data: any }>(`/events/${id}/gates`, body),
  removeGate: (id: string, gateId: string) =>
    api.delete<{ data: any }>(`/events/${id}/gates/${gateId}`),
};

// ─── Registrations ────────────────────────────────────────────────────────
export const registrationsApi = {
  getByEvent: (eventId: string, params?: Record<string, unknown>) =>
    api.get<{ data: { items: any[]; total: number; totalPages: number } }>(
      `/registrations/events/${eventId}`,
      { params },
    ),
  approve: (id: string) =>
    api.patch<{ data: any }>(`/registrations/${id}/approve`),
  reject: (id: string, notes?: string) =>
    api.patch<{ data: any }>(`/registrations/${id}/reject`, { notes }),
};

// ─── User ─────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get<{ data: any }>('/users/me'),
};
