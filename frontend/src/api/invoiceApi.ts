import { apiClient } from './apiClient';
import { Invoice } from '../types';

export const invoiceApi = {
  getAll: async (): Promise<Invoice[]> => {
    const userStr = localStorage.getItem('auth-storage');
    if (userStr && userStr.includes('"role":"vendor"')) {
      return await apiClient.get('/invoices/my');
    }
    return await apiClient.get('/invoices');
  },

  getById: async (id: string): Promise<Invoice> => {
    return await apiClient.get(`/invoices/${id}`);
  },

  submit: async (data: Partial<Invoice>): Promise<Invoice> => {
    return await apiClient.post('/invoices', data);
  },

  updateStatus: async (id: string, status: 'approved' | 'rejected' | 'paid'): Promise<void> => {
    return await apiClient.patch(`/invoices/${id}/status`, { status });
  },

  emailInvoice: async (id: string): Promise<void> => {
    return await apiClient.post(`/invoices/${id}/email`, {});
  }
};
