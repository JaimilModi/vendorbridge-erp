import { apiClient } from './apiClient';
import { Rfq } from '../types';

export const rfqApi = {
  getAll: async (): Promise<Rfq[]> => {
    const userStr = localStorage.getItem('auth-storage');
    if (userStr && userStr.includes('"role":"vendor"')) {
      return await apiClient.get('/rfqs/vendor');
    }
    return await apiClient.get('/rfqs');
  },

  getById: async (id: string): Promise<Rfq> => {
    return await apiClient.get(`/rfqs/${id}`);
  },

  create: async (data: Partial<Rfq>): Promise<Rfq> => {
    return await apiClient.post('/rfqs', data);
  }
};
