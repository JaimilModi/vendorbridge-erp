import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { rfqApi } from '../../api/rfqApi';
import { Rfq } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../constants';

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    rfqApi.getAll().then(data => {
      setRfqs(data);
      setLoading(false);
    });
  }, []);

  const columns: ColumnDef<Rfq>[] = [
    {
      accessorKey: 'rfqNumber',
      header: 'RFQ Reference',
      cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue('rfqNumber')}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'department',
      header: 'Department',
    },
    {
      accessorKey: 'deadline',
      header: 'Deadline',
      cell: ({ row }) => new Date(row.getValue('deadline')).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
  ];

  const canCreate = user?.role === ROLES.ADMIN || user?.role === ROLES.PROCUREMENT_OFFICER;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Request for Quotations" 
        description="Manage your procurement requests."
        actions={
          canCreate && (
            <Button onClick={() => navigate('/rfqs/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create RFQ
            </Button>
          )
        }
      />
      
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading RFQs...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={rfqs} 
          onRowClick={(row) => navigate(`/rfqs/${row.id}`)}
        />
      )}
    </div>
  );
}
