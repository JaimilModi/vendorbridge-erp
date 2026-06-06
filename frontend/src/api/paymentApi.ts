import { apiClient } from './apiClient';
import { Payment } from '../types';

export const paymentApi = {
  getAll: async (): Promise<Payment[]> => {
    const userStr = localStorage.getItem('auth-storage');
    if (userStr && userStr.includes('"role":"vendor"')) {
      return await apiClient.get('/payments/my');
    }
    return await apiClient.get('/payments');
  },

  getById: async (id: string): Promise<Payment> => {
    return await apiClient.get(`/payments/${id}`);
  },

  create: async (data: Partial<Payment>): Promise<Payment> => {
    return await apiClient.post('/payments', data);
  },

  updateStatus: async (id: string, status: 'completed' | 'failed'): Promise<void> => {
    return await apiClient.patch(`/payments/${id}/status`, { status });
  }
};
