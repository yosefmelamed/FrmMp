// All API calls to the Express backend
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include', // send cookies (refresh_token)
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

function authRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register:           (data: { firstName: string; lastName: string; email: string; password: string }) =>
    request<{ message: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  verifyEmail:        (token: string) =>
    request<{ message: string }>('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  resendVerification: (email: string) =>
    request<{ message: string }>('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),

  login:              (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  refresh:            () =>
    request<AuthResponse>('/api/auth/refresh', { method: 'POST' }),

  logout:             (token: string) =>
    authRequest<{ message: string }>('/api/auth/logout', token, { method: 'POST' }),

  me:                 (token: string) =>
    authRequest<AuthUser>('/api/auth/me', token),

  forgotPassword:     (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword:      (token: string, password: string) =>
    request<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

// ── Amenities ─────────────────────────────────────────────────
export const amenitiesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ items: any[]; total: number }>(`/api/amenities${qs}`);
  },
  get:    (id: string) => request<any>(`/api/amenities/${id}`),
  create: (token: string, data: any) => authRequest<any>('/api/amenities', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (token: string, id: string, data: any) => authRequest<any>(`/api/amenities/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (token: string, id: string) => authRequest<any>(`/api/amenities/${id}`, token, { method: 'DELETE' }),
};

// ── Events ────────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ items: any[]; total: number }>(`/api/events${qs}`);
  },
  get:    (id: string) => request<any>(`/api/events/${id}`),
  create: (token: string, data: any) => authRequest<any>('/api/events', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (token: string, id: string, data: any) => authRequest<any>(`/api/events/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (token: string, id: string) => authRequest<any>(`/api/events/${id}`, token, { method: 'DELETE' }),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  users: {
    list:       (token: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return authRequest<{ users: any[]; total: number }>(`/api/admin/users${qs}`, token);
    },
    get:        (token: string, id: string) => authRequest<any>(`/api/admin/users/${id}`, token),
    update:     (token: string, id: string, data: any) => authRequest<any>(`/api/admin/users/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),
    delete:     (token: string, id: string) => authRequest<any>(`/api/admin/users/${id}`, token, { method: 'DELETE' }),
    deactivate: (token: string, id: string) => authRequest<any>(`/api/admin/users/${id}/deactivate`, token, { method: 'POST' }),
    activate:   (token: string, id: string) => authRequest<any>(`/api/admin/users/${id}/activate`,   token, { method: 'POST' }),
    stats:      (token: string) => authRequest<any>('/api/admin/users/stats/summary', token),
  },

  upload: {
    presign: (token: string, folder: string, mimeType: string) =>
      authRequest<{ uploadUrl: string; key: string; publicUrl: string }>(
        '/api/upload/presign', token, { method: 'POST', body: JSON.stringify({ folder, mimeType }) }
      ),
  },
};

// ── Saved items ───────────────────────────────────────────────
export const savedApi = {
  list:   (token: string) =>
    authRequest<{ amenityIds: string[]; total: number }>('/api/saved', token),
  save:   (token: string, amenityId: string) =>
    authRequest<{ saved: boolean; amenityId: string }>(`/api/saved/${amenityId}`, token, { method: 'POST' }),
  unsave: (token: string, amenityId: string) =>
    authRequest<{ saved: boolean; amenityId: string }>(`/api/saved/${amenityId}`, token, { method: 'DELETE' }),
};

// ── Itineraries ───────────────────────────────────────────────
export interface SavedItineraryStop {
  amenityId:   string;
  position:    number;
  notes?:      string;
  arrivalTime?: string;
  duration?:   number;
}
export interface SavedItinerary {
  id:        string;
  name:      string;
  stops:     SavedItineraryStop[];
  createdAt: string;
  updatedAt: string;
}

export const itineraryApi = {
  list:   (token: string) =>
    authRequest<SavedItinerary[]>('/api/itineraries', token),
  get:    (token: string, id: string) =>
    authRequest<SavedItinerary>(`/api/itineraries/${id}`, token),
  create: (token: string, data: { name: string; stops: SavedItineraryStop[] }) =>
    authRequest<SavedItinerary>('/api/itineraries', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (token: string, id: string, data: { name?: string; stops?: SavedItineraryStop[] }) =>
    authRequest<SavedItinerary>(`/api/itineraries/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (token: string, id: string) =>
    authRequest<{ message: string }>(`/api/itineraries/${id}`, token, { method: 'DELETE' }),
};

// ── Search history ────────────────────────────────────────────
export interface SearchHistoryEntry {
  id:          string;
  query:       string;
  category?:   string;
  resultCount?: number;
  createdAt:   string;
}

export const historyApi = {
  list:        (token: string) =>
    authRequest<SearchHistoryEntry[]>('/api/history', token),
  record:      (token: string, query: string, category?: string, resultCount?: number) =>
    authRequest<{ ok: boolean }>('/api/history', token, {
      method: 'POST',
      body: JSON.stringify({ query, category, resultCount }),
    }),
  remove:      (token: string, id: string) =>
    authRequest<{ message: string }>(`/api/history/${id}`, token, { method: 'DELETE' }),
  clearAll:    (token: string) =>
    authRequest<{ message: string }>('/api/history', token, { method: 'DELETE' }),
};
