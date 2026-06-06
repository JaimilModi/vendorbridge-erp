import { mockDb, delay } from './mockDb';
import { Invoice } from '../types';

export const invoiceApi = {
  getAll: async (): Promise<Invoice[]> => {
    await delay();
    return mockDb.invoices.map(inv => ({
      ...inv,
      vendor: mockDb.vendors.find(v => v.id === inv.vendorId),
      po: mockDb.purchaseOrders.find(p => p.id === inv.poId)
    }));
  },

  getById: async (id: string): Promise<Invoice> => {
    await delay();
    const inv = mockDb.invoices.find(inv => inv.id === id);
    if (!inv) throw new Error('Invoice not found');
    return {
      ...inv,
      vendor: mockDb.vendors.find(v => v.id === inv.vendorId),
      po: mockDb.purchaseOrders.find(p => p.id === inv.poId)
    };
  },

  submit: async (data: Partial<Invoice>): Promise<Invoice> => {
    await delay();
    const newInvoice: Invoice = {
      ...data,
      id: `inv${mockDb.invoices.length + 1}`,
      invoiceNumber: `INV-2026-00${mockDb.invoices.length + 1}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    } as Invoice;
    mockDb.invoices.push(newInvoice);
    
    mockDb.activityLogs.unshift({
      id: `al${Date.now()}`,
      userId: data.vendorId!,
      action: 'INVOICE_SUBMITTED',
      entityType: 'invoice',
      entityId: newInvoice.id,
      createdAt: new Date().toISOString()
    });
    
    return newInvoice;
  },

  updateStatus: async (id: string, status: 'approved' | 'rejected' | 'paid'): Promise<void> => {
    await delay();
    const inv = mockDb.invoices.find(i => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    inv.status = status;
    inv.processedAt = new Date().toISOString();
  }
};
