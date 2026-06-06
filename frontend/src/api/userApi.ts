import { apiClient } from './apiClient';

export const userApi = {
  getAll: async () => {
    return await apiClient.get('/users');
  },
  update: async (id: string, data: { role?: string; status?: string }) => {
    return await apiClient.patch(`/users/${id}`, data);
  }
};
