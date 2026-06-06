import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { quotationApi } from '../../api/quotationApi';
import { Quotation } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function QuotationListPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    quotationApi.getAll().then(data => {
      // Filter if vendor
      if (user?.role === 'vendor') {
        // Find vendor id for this user
        // Mock assumption: Vendor user id matches vendorId in quotations or similar
        // For hackathon, just show all or implement simple filter
      }
      setQuotations(data);
      setLoading(false);
    });
  }, [user]);

  const columns: ColumnDef<Quotation>[] = [
    {
      accessorKey: 'quoteNumber',
      header: 'Quote Reference',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue('quoteNumber')}</span>,
    },
    {
      accessorKey: 'vendor.companyName',
      header: 'Vendor',
      cell: ({ row }) => row.original.vendor?.companyName || 'Unknown',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => formatCurrency(row.getValue('totalAmount')),
    },
    {
      accessorKey: 'submittedAt',
      header: 'Submitted On',
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
        title="Quotations" 
        description="View all received bids and quotations."
      />
      
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading quotations...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={quotations} 
          onRowClick={(row) => navigate(`/quotations/${row.id}`)}
        />
      )}
    </div>
  );
}
