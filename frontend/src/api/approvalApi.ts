import { mockDb, delay } from './mockDb';
import { Approval } from '../types';

export const approvalApi = {
  getAll: async (): Promise<Approval[]> => {
    await delay();
    return mockDb.approvals.map(a => ({
      ...a,
      quotation: mockDb.quotations.find(q => q.id === a.quotationId)
    }));
  },

  getById: async (id: string): Promise<Approval> => {
    await delay();
    const a = mockDb.approvals.find(a => a.id === id);
    if (!a) throw new Error('Approval not found');
    return {
      ...a,
      quotation: mockDb.quotations.find(q => q.id === a.quotationId)
    };
  },

  decide: async (id: string, status: 'approved' | 'rejected', notes: string): Promise<void> => {
    await delay();
    const a = mockDb.approvals.find(a => a.id === id);
    if (!a) throw new Error('Approval not found');
    
    a.status = status;
    a.notes = notes;
    a.decidedAt = new Date().toISOString();
    
    // Add activity
    mockDb.activityLogs.unshift({
      id: `al${Date.now()}`,
      userId: a.approverId, // In reality, current user
      action: status === 'approved' ? 'QUOTE_APPROVED' : 'QUOTE_REJECTED',
      entityType: 'approval',
      entityId: a.id,
      createdAt: new Date().toISOString()
    });

    if (status === 'approved') {
      // Auto generate PO
      const quote = mockDb.quotations.find(q => q.id === a.quotationId);
      if (quote) {
        mockDb.purchaseOrders.push({
          id: `po${mockDb.purchaseOrders.length + 1}`,
          poNumber: `PO-2026-00${mockDb.purchaseOrders.length + 1}`,
          quotationId: quote.id,
          vendorId: quote.vendorId,
          rfqId: quote.rfqId,
          status: 'issued',
          totalAmount: quote.totalAmount,
          issuedBy: 'system', // or current user
          issuedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: quote.items?.map((qi, idx) => ({
            id: `poi${Date.now()}-${idx}`,
            poId: 'temp',
            rfqItemId: qi.rfqItemId,
            itemName: 'Mapped Item', // Needs real mapping in backend
            quantity: qi.quantity,
            unitPrice: qi.unitPrice,
            totalPrice: qi.totalPrice
          }))
        });
        
        mockDb.activityLogs.unshift({
          id: `al${Date.now()}-po`,
          userId: 'system',
          action: 'PO_GENERATED',
          entityType: 'po',
          entityId: `po${mockDb.purchaseOrders.length}`,
          createdAt: new Date().toISOString()
        });
      }
    }
  }
};
