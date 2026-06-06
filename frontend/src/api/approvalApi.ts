import { apiClient } from './apiClient';
import { Approval } from '../types';

export const approvalApi = {
  getAll: async (): Promise<Approval[]> => {
    return await apiClient.get('/approvals');
  },

  getById: async (id: string): Promise<Approval> => {
    return await apiClient.get(`/approvals/${id}`);
  },

  create: async (data: { quotationId: string; approverId?: string; notes?: string }): Promise<Approval> => {
    return await apiClient.post('/approvals', data);
  },

  decide: async (id: string, status: 'approved' | 'rejected', notes: string): Promise<void> => {
    return await apiClient.patch(`/approvals/${id}/decide`, { status, notes });
  }
};
