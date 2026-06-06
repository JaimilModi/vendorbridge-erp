import { apiClient } from './apiClient';
import { Quotation } from '../types';

export const quotationApi = {
  getAll: async (): Promise<Quotation[]> => {
    const userStr = localStorage.getItem('auth-storage');
    if (userStr && userStr.includes('"role":"vendor"')) {
      return await apiClient.get('/quotations/my');
    }
    return await apiClient.get('/quotations');
  },

  getById: async (id: string): Promise<Quotation> => {
    return await apiClient.get(`/quotations/${id}`);
  },
  
  getByRfqId: async (rfqId: string): Promise<Quotation[]> => {
    return await apiClient.get(`/quotations/rfq/${rfqId}`);
  },

  submit: async (data: Partial<Quotation>): Promise<Quotation> => {
    return await apiClient.post('/quotations', data);
  },

  submitQuotation: async (id: string): Promise<Quotation> => {
    return await apiClient.post(`/quotations/${id}/submit`, {});
  },

  selectWinner: async (id: string, rfqId: string, userId: string): Promise<void> => {
    return await apiClient.patch(`/quotations/${id}/select`, {});
  }
};
