export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getStatusTagColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'ACCEPTED':
    case 'PAID':
    case 'COMPLETED':
    case 'AWARDED':
      return 'success';

    case 'PENDING':
    case 'SUBMITTED':
    case 'SENT':
    case 'OPEN':
    case 'ISSUED':
      return 'processing';

    case 'DRAFT':
      return 'default';

    case 'INACTIVE':
    case 'CLOSED':
      return 'warning';

    case 'BLOCKED':
    case 'REJECTED':
    case 'OVERDUE':
    case 'CANCELLED':
      return 'error';

    default:
      return 'default';
  }
};
