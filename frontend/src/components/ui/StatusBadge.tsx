import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toLowerCase();
  
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' = 'default';
  
  // Map common statuses to colors
  if (['draft', 'pending', 'submitted', 'under_review', 'issued'].includes(s)) {
    variant = 'warning';
  } else if (['approved', 'published', 'active', 'selected', 'delivered', 'paid', 'acknowledged'].includes(s)) {
    variant = 'success';
  } else if (['rejected', 'cancelled', 'blacklisted', 'inactive', 'closed'].includes(s)) {
    variant = 'destructive';
  } else {
    variant = 'secondary';
  }

  const formattedStatus = status.replace('_', ' ').toUpperCase();

  return <Badge variant={variant}>{formattedStatus}</Badge>;
}
