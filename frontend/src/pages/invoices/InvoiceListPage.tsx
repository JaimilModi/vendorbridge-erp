import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { invoiceApi } from '../../api/invoiceApi';
import { Invoice } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    invoiceApi.getAll().then(data => {
      setInvoices(data);
      setLoading(false);
    });
  }, [user]);

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice Number',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue('invoiceNumber')}</span>,
    },
    {
      accessorKey: 'po.poNumber',
      header: 'PO Ref',
      cell: ({ row }) => row.original.po?.poNumber || '-',
    },
    {
      accessorKey: 'vendor.companyName',
      header: 'Vendor',
      cell: ({ row }) => row.original.vendor?.companyName || 'Unknown',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => <span className="font-medium text-primary">{formatCurrency(row.getValue('totalAmount'))}</span>,
    },
    {
      accessorKey: 'submittedAt',
      header: 'Submitted',
      cell: ({ row }) => new Date(row.getValue('submittedAt')).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Invoices" 
        description="Manage vendor invoices and payments."
      />
      
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={invoices} 
          onRowClick={(row) => navigate(`/invoices/${row.id}`)}
        />
      )}
    </div>
  );
}
