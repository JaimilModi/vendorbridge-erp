import { mockDb, delay } from './mockDb';
import { Rfq } from '../types';

export const rfqApi = {
  getAll: async (): Promise<Rfq[]> => {
    await delay();
    // Attach createdBy User details for UI
    return mockDb.rfqs.map(rfq => ({
      ...rfq,
      // Just a mock addition, UI might need user names
    }));
  },

  getById: async (id: string): Promise<Rfq> => {
    await delay();
    const rfq = mockDb.rfqs.find(r => r.id === id);
    if (!rfq) throw new Error('RFQ not found');
    return rfq;
  },

  create: async (data: Partial<Rfq>): Promise<Rfq> => {
    await delay();
    const newRfq: Rfq = {
      ...data,
      id: `rfq${mockDb.rfqs.length + 1}`,
      rfqNumber: `RFQ-2026-00${mockDb.rfqs.length + 1}`,
      status: data.status as any || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Rfq;
    
    // Map vendorIds to invitedVendors
    if (data.vendorIds && data.vendorIds.length > 0) {
      newRfq.invitedVendors = mockDb.vendors.filter(v => data.vendorIds?.includes(v.id));
    }
    
    mockDb.rfqs.push(newRfq);
    if (newRfq.status === 'published') {
      mockDb.activityLogs.unshift({
        id: `al${Date.now()}`,
        userId: data.createdBy!,
        action: 'RFQ_PUBLISHED',
        entityType: 'rfq',
        entityId: newRfq.id,
        createdAt: new Date().toISOString()
      });
    }

    return newRfq;
  }
};
