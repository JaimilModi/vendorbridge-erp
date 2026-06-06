import { User, Vendor, Rfq, Quotation, Approval, PurchaseOrder, Invoice, ActivityLog } from '../types';
import { ROLES, VENDOR_STATUS, RFQ_STATUS, QUOTATION_STATUS, APPROVAL_STATUS, PO_STATUS, INVOICE_STATUS } from '../constants';

// Initialize mock DB with some default data for the hackathon MVP
export const mockDb = {
  users: [
    {
      id: 'u1',
      email: 'admin@vendorbridge.com',
      fullName: 'System Admin',
      role: ROLES.ADMIN,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'u2',
      email: 'procurement@vendorbridge.com',
      fullName: 'Sarah Procurement',
      role: ROLES.PROCUREMENT_OFFICER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'u3',
      email: 'manager@vendorbridge.com',
      fullName: 'Michael Manager',
      role: ROLES.MANAGER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'u4',
      email: 'vendor1@techsupply.com',
      fullName: 'John TechVendor',
      role: ROLES.VENDOR,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ] as User[],

  vendors: [
    {
      id: 'v1',
      userId: 'u4',
      companyName: 'TechSupply Inc.',
      contactName: 'Alice Smith',
      email: 'vendor1@techsupply.com',
      phone: '+1 234 567 8900',
      category: 'IT Hardware',
      gstNumber: 'GSTIN27AABB1234C1Z5',
      address: '123 Tech Park, Silicon Valley, CA',
      status: 'active',
      rating: 4.8,
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-01-15T08:00:00Z'
    },
    {
      id: 'v2',
      userId: 'u5',
      companyName: 'Global Logistics',
      contactName: 'Bob Jones',
      email: 'contact@globallogistics.com',
      phone: '+1 987 654 3210',
      category: 'Logistics',
      gstNumber: 'GSTIN07BBAA4321D2Z8',
      address: '456 Port Road, NY',
      status: 'published',
      createdAt: '2026-05-20T10:00:00Z',
      updatedAt: '2026-05-20T10:00:00Z'
    }
  ] as Vendor[],

  rfqs: [
    {
      id: 'r1',
      rfqNumber: 'RFQ-2026-001',
      title: 'Laptops for New Hires Q3',
      description: 'Need 50 high-performance laptops for engineering team.',
      status: RFQ_STATUS.PUBLISHED,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'u2',
      department: 'Engineering',
      budgetLimit: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        { id: 'ri1', rfqId: 'r1', itemName: 'MacBook Pro 16"', quantity: 25, unit: 'pcs', estimatedPrice: 2500 },
        { id: 'ri2', rfqId: 'r1', itemName: 'Dell XPS 15', quantity: 25, unit: 'pcs', estimatedPrice: 2000 },
      ],
      invitedVendors: []
    }
  ] as Rfq[],

  quotations: [] as Quotation[],
  approvals: [] as Approval[],
  purchaseOrders: [] as PurchaseOrder[],
  invoices: [] as Invoice[],
  activityLogs: [
    {
      id: 'al1',
      userId: 'u2',
      action: 'RFQ_CREATED',
      entityType: 'rfq',
      entityId: 'r1',
      createdAt: new Date().toISOString(),
    }
  ] as ActivityLog[]
};

// Simulate network latency
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));
