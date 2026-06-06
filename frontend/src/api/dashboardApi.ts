import { mockDb, delay } from './mockDb';

export const dashboardApi = {
  getSummary: async () => {
    await delay();
    return {
      openRfqs: mockDb.rfqs.filter(r => r.status === 'published').length,
      activeVendors: mockDb.vendors.filter(v => v.status === 'active').length,
      pendingApprovals: mockDb.approvals.filter(a => a.status === 'pending').length,
      activePOs: mockDb.purchaseOrders.filter(p => p.status === 'issued').length,
    };
  },
  
  getActivity: async () => {
    await delay();
    return mockDb.activityLogs.slice(0, 10).map(log => {
      const user = mockDb.users.find(u => u.id === log.userId);
      return { ...log, user };
    });
  },
  
  getAllActivity: async () => {
    await delay();
    return mockDb.activityLogs.map(log => {
      const user = mockDb.users.find(u => u.id === log.userId);
      return { ...log, user };
    });
  }
};
