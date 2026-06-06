import { apiClient } from './apiClient';

export const dashboardApi = {
  getSummary: async () => {
    try {
      return await apiClient.get('/reports/summary');
    } catch (err) {
      return {};
    }
  },
  
  getMonthlyTrend: async (year?: number) => {
    try {
      return await apiClient.get(`/reports/monthly-trend${year ? `?year=${year}` : ''}`);
    } catch (err) {
      return { data: [] };
    }
  },

  getVendorPerformance: async () => {
    try {
      return await apiClient.get('/reports/vendor-performance');
    } catch (err) {
      return { data: [] };
    }
  },
  
  getActivity: async () => {
    try {
      const res = await apiClient.get('/activity-logs?limit=10');
      return res; // apiClient.get already extracts .data
    } catch (err) {
      return [];
    }
  },
  
  getAllActivity: async () => {
    try {
      const res = await apiClient.get('/activity-logs?limit=100');
      return res; // apiClient.get already extracts .data
    } catch (err) {
      return [];
    }
  }
};
