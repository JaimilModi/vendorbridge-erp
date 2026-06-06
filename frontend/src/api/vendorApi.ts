import { apiClient } from './apiClient';
import { Vendor } from '../types';

export const vendorApi = {
  getAll: async (): Promise<Vendor[]> => {
    return await apiClient.get('/vendors');
  },

  getById: async (id: string): Promise<Vendor> => {
    return await apiClient.get(`/vendors/${id}`);
  },

  create: async (data: Partial<Vendor>): Promise<Vendor> => {
    return await apiClient.post('/vendors', data);
  },

  update: async (id: string, data: Partial<Vendor>): Promise<Vendor> => {
    return await apiClient.put(`/vendors/${id}`, data);
  },

  updateStatus: async (id: string, status: string): Promise<Vendor> => {
    return await apiClient.patch(`/vendors/${id}/status`, { status });
  }
};
