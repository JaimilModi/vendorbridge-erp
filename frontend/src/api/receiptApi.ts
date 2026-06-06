import { apiClient } from './apiClient';
import { Receipt } from '../types';

export const receiptApi = {
  getAll: async (): Promise<Receipt[]> => {
    const userStr = localStorage.getItem('auth-storage');
    if (userStr && userStr.includes('"role":"vendor"')) {
      return await apiClient.get('/receipts/my');
    }
    return await apiClient.get('/receipts');
  },

  getById: async (id: string): Promise<Receipt> => {
    return await apiClient.get(`/receipts/${id}`);
  }
};
