import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { poApi } from '../../api/poApi';
import { PurchaseOrder } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function POListPage() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    poApi.getAll().then(data => {
      // In real app, filter for vendor here
      setPOs(data);
      setLoading(false);
    });
  }, [user]);

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: 'poNumber',
      header: 'PO Number',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue('poNumber')}</span>,
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
      accessorKey: 'issuedAt',
      header: 'Issued Date',
      cell: ({ row }) => new Date(row.getValue('issuedAt')).toLocaleDateString(),
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
        title="Purchase Orders" 
        description="View generated purchase orders."
      />
      
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading purchase orders...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={pos} 
          onRowClick={(row) => navigate(`/purchase-orders/${row.id}`)}
        />
      )}
    </div>
  );
}
