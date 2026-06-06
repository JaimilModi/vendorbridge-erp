import { mockDb, delay } from './mockDb';
import { Quotation } from '../types';

export const quotationApi = {
  getAll: async (): Promise<Quotation[]> => {
    await delay();
    return mockDb.quotations.map(q => ({
      ...q,
      vendor: mockDb.vendors.find(v => v.id === q.vendorId)
    }));
  },

  getById: async (id: string): Promise<Quotation> => {
    await delay();
    const q = mockDb.quotations.find(q => q.id === id);
    if (!q) throw new Error('Quotation not found');
    return {
      ...q,
      vendor: mockDb.vendors.find(v => v.id === q.vendorId)
    };
  },
  
  getByRfqId: async (rfqId: string): Promise<Quotation[]> => {
    await delay();
    return mockDb.quotations
      .filter(q => q.rfqId === rfqId)
      .map(q => ({
        ...q,
        vendor: mockDb.vendors.find(v => v.id === q.vendorId)
      }));
  },

  submit: async (data: Partial<Quotation>): Promise<Quotation> => {
    await delay();
    const newQuote: Quotation = {
      ...data,
      id: `q${mockDb.quotations.length + 1}`,
      quoteNumber: `Q-2026-00${mockDb.quotations.length + 1}`,
      status: data.status as any || 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Quotation;
    mockDb.quotations.push(newQuote);
    
    if (newQuote.status === 'submitted') {
      mockDb.activityLogs.unshift({
        id: `al${Date.now()}`,
        userId: data.vendorId!,
        action: 'QUOTE_SUBMITTED',
        entityType: 'quotation',
        entityId: newQuote.id,
        createdAt: new Date().toISOString()
      });
    }
    
    return newQuote;
  },

  selectWinner: async (id: string, rfqId: string, userId: string): Promise<void> => {
    await delay();
    // Update winning quote
    const quote = mockDb.quotations.find(q => q.id === id);
    if (quote) quote.status = 'selected';
    
    // Update others to rejected
    mockDb.quotations.forEach(q => {
      if (q.rfqId === rfqId && q.id !== id) {
        q.status = 'rejected';
      }
    });
    
    // Update RFQ status
    const rfq = mockDb.rfqs.find(r => r.id === rfqId);
    if (rfq) rfq.status = 'awarded';

    mockDb.activityLogs.unshift({
      id: `al${Date.now()}`,
      userId: userId,
      action: 'QUOTE_SELECTED',
      entityType: 'quotation',
      entityId: id,
      createdAt: new Date().toISOString()
    });
  }
};
