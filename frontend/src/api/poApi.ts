import { mockDb, delay } from './mockDb';
import { PurchaseOrder } from '../types';

export const poApi = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    await delay();
    return mockDb.purchaseOrders.map(po => ({
      ...po,
      vendor: mockDb.vendors.find(v => v.id === po.vendorId)
    }));
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    await delay();
    const po = mockDb.purchaseOrders.find(po => po.id === id);
    if (!po) throw new Error('Purchase Order not found');
    return {
      ...po,
      vendor: mockDb.vendors.find(v => v.id === po.vendorId)
    };
  }
};
