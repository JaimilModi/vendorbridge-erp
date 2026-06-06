import { Role, VendorStatus, RfqStatus, QuotationStatus, ApprovalStatus, PoStatus, InvoiceStatus } from '../constants';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  gstNumber?: string;
  address: string;
  status: VendorStatus;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RfqItem {
  id: string;
  rfqId: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  estimatedPrice?: number;
}

export interface Rfq {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  department: string;
  status: RfqStatus;
  deadline: string;
  budgetLimit?: number;
  items?: RfqItem[];
  invitedVendors?: Vendor[];
  vendorIds?: string[];
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  deliveryDays?: number;
  notes?: string;
}

export interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  quoteNumber: string;
  status: QuotationStatus;
  totalAmount: number;
  validityDays: number;
  deliveryTimeline?: string;
  notes?: string;
  items?: QuotationItem[];
  vendor?: Vendor;
  submittedAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  quotationId: string;
  requestedBy: string;
  approverId: string;
  status: ApprovalStatus;
  notes?: string;
  requestedAt: string;
  decidedAt?: string;
  quotation?: Quotation; // For display purposes
}

export interface PoItem {
  id: string;
  poId: string;
  rfqItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  vendorId: string;
  rfqId: string;
  status: PoStatus;
  totalAmount: number;
  issuedBy: string;
  deliveryDate?: string;
  terms?: string;
  issuedAt: string;
  updatedAt: string;
  items?: PoItem[];
  vendor?: Vendor; // For display purposes
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  poItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  vendorId: string;
  status: InvoiceStatus;
  totalAmount: number;
  dueDate?: string;
  submittedAt: string;
  processedAt?: string;
  notes?: string;
  items?: InvoiceItem[];
  vendor?: Vendor; // For display purposes
  po?: PurchaseOrder; // For display purposes
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: any;
  createdAt: string;
  user?: User; // For display purposes
}
