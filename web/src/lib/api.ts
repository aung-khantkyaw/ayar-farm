import { API_URL } from './config';

export const api = {
  async get(endpoint: string, token?: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return handleResponse(response);
  },

  async post(endpoint: string, data: any, token?: string) {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async postStream(endpoint: string, data: any, token?: string, signal?: AbortSignal) {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
      signal,
    });
  },

  async put(endpoint: string, data: any, token?: string) {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async patch(endpoint: string, data?: any, token?: string) {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(endpoint: string, token?: string, data?: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },
};

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    throw new Error(error);
  }
  return data;
}
