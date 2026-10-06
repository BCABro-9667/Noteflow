import { Note, Tag, User, FilterType, SortOption } from '../types';

const TOKEN_KEY = 'noteflow_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(res.token);
      return res;
    },
    register: async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setStoredToken(res.token);
      return res;
    },
    demoLogin: async (): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/auth/demo-login', {
        method: 'POST',
      });
      setStoredToken(res.token);
      return res;
    },
    logout: async (): Promise<void> => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setStoredToken(null);
      }
    },
    logoutAll: async (): Promise<void> => {
      try {
        await request('/auth/logout-all', { method: 'POST' });
      } finally {
        setStoredToken(null);
      }
    },
    me: async (): Promise<{ user: User }> => {
      return request<{ user: User }>('/auth/me');
    },
    forgotPassword: async (email: string): Promise<{ message: string; resetCode?: string }> => {
      return request<{ message: string; resetCode?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    resetPassword: async (email: string, code: string, newPassword: string): Promise<{ message: string }> => {
      return request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      });
    },
    updateProfile: async (payload: {
      name?: string;
      avatar?: string;
      phone?: string;
      dob?: string;
      address?: string;
      bio?: string;
      currentPassword?: string;
      newPassword?: string;
    }): Promise<{ user: User; message: string }> => {
      return request<{ user: User; message: string }>('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getPinStatus: async (): Promise<{ hasPin: boolean }> => {
      return request<{ hasPin: boolean }>('/auth/pin/status');
    },
    setupPin: async (pin: string): Promise<{ success: boolean; hasPin: boolean; message: string }> => {
      return request<{ success: boolean; hasPin: boolean; message: string }>('/auth/pin/setup', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
    },
    verifyPin: async (pin: string): Promise<{ valid: boolean; message?: string }> => {
      return request<{ valid: boolean; message?: string }>('/auth/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
    },
    changePin: async (currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>('/auth/pin/change', {
        method: 'POST',
        body: JSON.stringify({ currentPin, newPin }),
      });
    },
    removePin: async (currentPin: string): Promise<{ success: boolean; hasPin: boolean; message: string }> => {
      return request<{ success: boolean; hasPin: boolean; message: string }>('/auth/pin/remove', {
        method: 'POST',
        body: JSON.stringify({ currentPin }),
      });
    },
  },
  notes: {
    list: async (params: {
      filter?: FilterType;
      tag?: string;
      search?: string;
      sort?: SortOption;
    } = {}): Promise<{ notes: Note[]; count: number }> => {
      const query = new URLSearchParams();
      if (params.filter) query.set('filter', params.filter);
      if (params.tag) query.set('tag', params.tag);
      if (params.search) query.set('search', params.search);
      if (params.sort) query.set('sort', params.sort);
      return request<{ notes: Note[]; count: number }>(`/notes?${query.toString()}`);
    },
    get: async (id: string): Promise<{ note: Note }> => {
      return request<{ note: Note }>(`/notes/${id}`);
    },
    create: async (data: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      isFavorite?: boolean;
      isArchived?: boolean;
      isLocked?: boolean;
      tags?: string[];
    }): Promise<{ note: Note }> => {
      return request<{ note: Note }>('/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (
      id: string,
      data: {
        title?: string;
        content?: string;
        isPinned?: boolean;
        isFavorite?: boolean;
        isArchived?: boolean;
        isLocked?: boolean;
        tags?: string[];
      }
    ): Promise<{ note: Note }> => {
      return request<{ note: Note }>(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    lock: async (id: string): Promise<{ note: Note }> => {
      return request<{ note: Note }>(`/notes/${id}/lock`, {
        method: 'POST',
      });
    },
    unlock: async (id: string, pin: string): Promise<{ note: Note }> => {
      return request<{ note: Note }>(`/notes/${id}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
    },
    verifyPin: async (id: string, pin: string): Promise<{ valid: boolean; note: Note }> => {
      return request<{ valid: boolean; note: Note }>(`/notes/${id}/verify-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
    },
    delete: async (id: string): Promise<{ message: string; id: string }> => {
      return request<{ message: string; id: string }>(`/notes/${id}`, {
        method: 'DELETE',
      });
    },
    restore: async (id: string): Promise<{ message: string; id: string }> => {
      return request<{ message: string; id: string }>(`/notes/${id}/restore`, {
        method: 'POST',
      });
    },
    permanentDelete: async (id: string): Promise<{ message: string; id: string }> => {
      return request<{ message: string; id: string }>(`/notes/${id}/permanent`, {
        method: 'DELETE',
      });
    },
    duplicate: async (id: string): Promise<{ note: Note }> => {
      return request<{ note: Note }>(`/notes/${id}/duplicate`, {
        method: 'POST',
      });
    },
    emptyTrash: async (): Promise<{ message: string; count: number }> => {
      return request<{ message: string; count: number }>('/notes/empty-trash', {
        method: 'POST',
      });
    },
  },
  tags: {
    list: async (): Promise<{ tags: Tag[] }> => {
      return request<{ tags: Tag[] }>('/tags');
    },
    create: async (data: { name: string; color?: string }): Promise<{ tag: Tag }> => {
      return request<{ tag: Tag }>('/tags', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: { name?: string; color?: string }): Promise<{ tag: Tag }> => {
      return request<{ tag: Tag }>(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<{ message: string; id: string }> => {
      return request<{ message: string; id: string }>(`/tags/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
