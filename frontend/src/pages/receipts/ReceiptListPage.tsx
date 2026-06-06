import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { receiptApi } from '../../api/receiptApi';
import { Receipt } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function ReceiptListPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    receiptApi.getAll().then(data => {
      setReceipts(data);
      setLoading(false);
    });
  }, [user]);

  const columns: ColumnDef<Receipt>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Ref',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue('receiptNumber')}</span>,
    },
    {
      accessorKey: 'payment.paymentNumber',
      header: 'Payment Ref',
      cell: ({ row }) => row.original.payment?.paymentNumber || '-',
    },
    {
      accessorKey: 'vendor.companyName',
      header: 'Vendor',
      cell: ({ row }) => row.original.vendor?.companyName || 'Unknown',
    },
    {
      accessorKey: 'amountReceived',
      header: 'Amount',
      cell: ({ row }) => <span className="font-medium text-green-600">{formatCurrency(row.getValue('amountReceived'))}</span>,
    },
    {
      accessorKey: 'issuedAt',
      header: 'Issued On',
      cell: ({ row }) => new Date(row.getValue('issuedAt')).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Receipts" 
        description="View generated vendor receipts."
      />
      
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading receipts...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={receipts} 
        />
      )}
    </div>
  );
}
