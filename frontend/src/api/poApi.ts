import { apiClient } from './apiClient';
import { PurchaseOrder } from '../types';

export const poApi = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    const userStr = localStorage.getItem('auth-storage');
    if (userStr && userStr.includes('"role":"vendor"')) {
      return await apiClient.get('/purchase-orders/vendor');
    }
    return await apiClient.get('/purchase-orders');
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    return await apiClient.get(`/purchase-orders/${id}`);
  }
};
