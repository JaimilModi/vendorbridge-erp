export type Role = 'ADMIN' | 'PROCUREMENT_OFFICER' | 'VENDOR' | 'MANAGER';

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type RFQStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'AWARDED';

export type QuotationStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'COMPLETED' | 'CANCELLED';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  vendorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RFQItem {
  id: string;
  rfqId: string;
  productName: string;
  description?: string;
  quantity: number;
  uom: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFQ {
  id: string;
  title: string;
  description?: string;
  status: RFQStatus;
  deadline: string;
  createdById: string;
  createdBy?: Partial<User>;
  items?: RFQItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  rfqItemId: string;
  rfqItem?: RFQItem;
  unitPrice: number;
  totalPrice: number;
  deliveryTimeline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  rfqId: string;
  rfq?: RFQ;
  vendorId: string;
  vendor?: Vendor;
  status: QuotationStatus;
  totalAmount: number;
  validityDate: string;
  items?: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  quotationId: string;
  quotation?: Quotation;
  approvedById: string;
  approvedBy?: Partial<User>;
  status: ApprovalStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  quotation?: Quotation;
  vendorId: string;
  vendor?: Vendor;
  status: PurchaseOrderStatus;
  totalAmount: number;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  po?: PurchaseOrder;
  vendorId: string;
  vendor?: Vendor;
  status: InvoiceStatus;
  totalAmount: number;
  dueDate: string;
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}
