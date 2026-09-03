const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string; data?: T; errors?: any[] }> {
  const token = localStorage.getItem('access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok && res.status === 401) {
      // Clear token on auth failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Dispatch global event for the app to handle logout state & UI
      window.dispatchEvent(new CustomEvent('auth-expired', { 
        detail: { message: 'Your session has expired. Please log in again.' } 
      }));
    }

    return json;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network request failed',
      errors: [error],
    };
  }
}

/**
 * Parses Zod error array from the backend into a simple key-value map for form fields.
 */
export function parseApiErrors(errors?: any[]): Record<string, string> {
  const map: Record<string, string> = {};
  if (!errors || !Array.isArray(errors)) return map;

  errors.forEach((err) => {
    if (err.path && err.path.length > 0 && err.message) {
      map[err.path[0]] = err.message;
    }
  });

  return map;
}

export const apiService = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += `${endpoint.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    return apiRequest<T>(url, { method: 'GET' });
  },
  post: <T = any>(endpoint: string, body?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  put: <T = any>(endpoint: string, body?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete: <T = any>(endpoint: string) => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },
};

