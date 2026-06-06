import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { paymentApi } from '../../api/paymentApi';
import { Payment } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { CheckCircle } from 'lucide-react';

export default function PaymentListPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    paymentApi.getAll().then(data => {
      setPayments(data);
      setLoading(false);
    });
  }, [user]);

  const handleComplete = async (id: string) => {
    try {
      await paymentApi.updateStatus(id, 'completed');
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'completed' } : p));
    } catch (err) {
      console.error(err);
      alert('Failed to complete payment.');
    }
  };

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'paymentNumber',
      header: 'Payment Ref',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue('paymentNumber')}</span>,
    },
    {
      accessorKey: 'invoice.invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => row.original.invoice?.invoiceNumber || '-',
    },
    {
      accessorKey: 'vendor.companyName',
      header: 'Vendor',
      cell: ({ row }) => row.original.vendor?.companyName || 'Unknown',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-medium text-primary">{formatCurrency(row.getValue('amount'))}</span>,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }) => <span className="capitalize">{String(row.getValue('paymentMethod')).replace('_', ' ')}</span>,
    },
    {
      accessorKey: 'paymentDate',
      header: 'Date',
      cell: ({ row }) => new Date(row.getValue('paymentDate')).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const payment = row.original;
        const canComplete = payment.status === 'processing' && (user?.role === 'admin' || user?.role === 'manager');
        
        if (!canComplete) return null;
        return (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleComplete(payment.id); }}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Complete
          </Button>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payments" 
        description="View and manage vendor payments."
      />
      
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading payments...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={payments} 
        />
      )}
    </div>
  );
}
