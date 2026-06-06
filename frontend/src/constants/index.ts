export const ROLES = {
  ADMIN: 'admin',
  PROCUREMENT_OFFICER: 'procurement_officer',
  VENDOR: 'vendor',
  MANAGER: 'manager',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const VENDOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLACKLISTED: 'blacklisted',
} as const;

export type VendorStatus = typeof VENDOR_STATUS[keyof typeof VENDOR_STATUS];

export const RFQ_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export type RfqStatus = typeof RFQ_STATUS[keyof typeof RFQ_STATUS];

export const QUOTATION_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  SELECTED: 'selected',
  REJECTED: 'rejected',
} as const;

export type QuotationStatus = typeof QUOTATION_STATUS[keyof typeof QUOTATION_STATUS];

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];

export const PO_STATUS = {
  ISSUED: 'issued',
  ACKNOWLEDGED: 'acknowledged',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type PoStatus = typeof PO_STATUS[keyof typeof PO_STATUS];

export const INVOICE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
