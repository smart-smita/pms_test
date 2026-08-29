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
      // Clear token on 401 auth failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
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
