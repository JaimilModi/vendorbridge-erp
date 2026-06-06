import { mockDb, delay } from './mockDb';
import { Vendor } from '../types';

export const vendorApi = {
  getAll: async (): Promise<Vendor[]> => {
    await delay();
    return mockDb.vendors;
  },

  getById: async (id: string): Promise<Vendor> => {
    await delay();
    const vendor = mockDb.vendors.find(v => v.id === id);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  }
};
