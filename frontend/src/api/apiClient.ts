const API_URL = 'http://localhost:5000/api';

export const apiClient = {
  async get(endpoint: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.errors ? `${data.message} ${JSON.stringify(data.errors)}` : data.message;
      throw new Error(errorMsg || 'Request failed');
    }
    const result = data.data;
    if (result && typeof result === 'object' && result.pagination && Array.isArray(result.data)) {
      return result.data;
    }
    return result;
  },

  async post(endpoint: string, body: any) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.errors ? `${data.message} ${JSON.stringify(data.errors)}` : data.message;
      throw new Error(errorMsg || 'Request failed');
    }
    const result = data.data;
    if (result && typeof result === 'object' && result.pagination && Array.isArray(result.data)) {
      return result.data;
    }
    return result;
  },

  async put(endpoint: string, body: any) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.errors ? `${data.message} ${JSON.stringify(data.errors)}` : data.message;
      throw new Error(errorMsg || 'Request failed');
    }
    const result = data.data;
    if (result && typeof result === 'object' && result.pagination && Array.isArray(result.data)) {
      return result.data;
    }
    return result;
  },

  async patch(endpoint: string, body: any) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.errors ? `${data.message} ${JSON.stringify(data.errors)}` : data.message;
      throw new Error(errorMsg || 'Request failed');
    }
    const result = data.data;
    if (result && typeof result === 'object' && result.pagination && Array.isArray(result.data)) {
      return result.data;
    }
    return result;
  },

  async delete(endpoint: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.errors ? `${data.message} ${JSON.stringify(data.errors)}` : data.message;
      throw new Error(errorMsg || 'Request failed');
    }
    const result = data.data;
    if (result && typeof result === 'object' && result.pagination && Array.isArray(result.data)) {
      return result.data;
    }
    return result;
  },
};
