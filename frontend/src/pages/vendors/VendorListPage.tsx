import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { vendorApi } from '../../api/vendorApi';
import { Vendor } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2 } from 'lucide-react';

export default function VendorListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const { register, handleSubmit, reset } = useForm<Partial<Vendor>>();

  useEffect(() => {
    vendorApi.getAll().then(data => {
      setVendors(data);
      setLoading(false);
    });
  }, []);

  const handleEditClick = (vendor: Vendor) => {
    setEditingVendor(vendor);
    reset(vendor);
    setIsEditModalOpen(true);
  };

  const onEditSubmit = async (data: Partial<Vendor>) => {
    if (!editingVendor) return;
    
    // Clean up data for Zod validation: convert empty strings to undefined
    const cleanedData = { ...data };
    if (cleanedData.email === "") cleanedData.email = undefined;
    if (cleanedData.phone === "") cleanedData.phone = undefined;
    if (cleanedData.gstNumber === "") cleanedData.gstNumber = undefined;
    if (cleanedData.category === "") cleanedData.category = undefined;
    
    try {
      // Update basic details
      const updatedVendor = await vendorApi.update(editingVendor.id, cleanedData);
      
      // If status changed, update status separately
      let finalVendor = updatedVendor;
      if (data.status && data.status !== editingVendor.status) {
        finalVendor = await vendorApi.updateStatus(editingVendor.id, data.status);
      }
      
      const updated = vendors.map(v => v.id === editingVendor.id ? { ...v, ...finalVendor } : v);
      setVendors(updated);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Failed to update vendor', error);
      alert(error.message || 'Failed to update vendor. Please check all fields.');
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'companyName',
      header: 'Company Name',
      cell: ({ row }) => <span className="font-medium text-primary">{row.getValue('companyName')}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'gstNumber',
      header: 'GST Number',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.gstNumber || '-'}</span>,
    },
    {
      accessorKey: 'contactName',
      header: 'Contact',
      cell: ({ row }) => (
        <div>
          <p>{row.original.contactName}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            handleEditClick(row.original);
          }}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendors Registry" 
        description="Manage your approved suppliers, categories, and contact details."
        actions={
          <Button onClick={() => navigate('/vendors/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
        }
      />
      
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-border shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by company or contact name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="w-full sm:w-48">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading vendors...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredVendors} 
          onRowClick={(row) => navigate(`/vendors/${row.id}`)}
        />
      )}

      {/* Edit Vendor Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Vendor Details"
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 py-2">
          <Input label="Company Name" {...register('companyName')} />
          <Input label="Business Address" {...register('address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" {...register('category')} />
            <Input label="GST Number" {...register('gstNumber')} />
          </div>
          <Input label="Contact Name" {...register('contactName')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register('email')} />
            <Input label="Phone" {...register('phone')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select 
              {...register('status')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
