import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { approvalApi } from '../../api/approvalApi';
import { Approval } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function ApprovalQueuePage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    approvalApi.getAll().then(data => {
      setApprovals(data);
      setLoading(false);
    });
  }, []);

  const columns: ColumnDef<Approval>[] = [
    {
      accessorKey: 'id',
      header: 'Ref ID',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{String(row.getValue('id')).substring(0,8)}</span>,
    },
    {
      accessorKey: 'quotation.quoteNumber',
      header: 'Quotation Ref',
      cell: ({ row }) => <span className="font-medium">{row.original.quotation?.quoteNumber || '-'}</span>,
    },
    {
      accessorKey: 'quotation.totalAmount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-bold text-primary">{formatCurrency(row.original.quotation?.totalAmount || 0)}</span>,
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested On',
      cell: ({ row }) => new Date(row.getValue('requestedAt')).toLocaleDateString(),
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
        title="Approval Queue" 
        description="Review and action pending procurement requests."
      />
      
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading approvals...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={approvals} 
          onRowClick={(row) => navigate(`/approvals/${row.id}`)}
        />
      )}
    </div>
  );
}
