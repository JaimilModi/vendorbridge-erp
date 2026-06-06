import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { rfqApi } from '../../api/rfqApi';
import { vendorApi } from '../../api/vendorApi';
import { useAuthStore } from '../../store/authStore';
import { Vendor } from '../../types';
import { UploadCloud, Trash2 } from 'lucide-react';

export default function RFQFormPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeVendors, setActiveVendors] = useState<Vendor[]>([]);
  
  // Using simple state for MVP instead of useFieldArray for complexity
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [deadline, setDeadline] = useState('');
  const [items, setItems] = useState([{ itemName: '', quantity: 1, unit: 'pcs', estimatedPrice: 0 }]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    vendorApi.getAll().then(data => {
      setActiveVendors(data.filter(v => v.status === 'active'));
    });
  }, []);

  const handleAddItem = () => {
    setItems([...items, { itemName: '', quantity: 1, unit: 'pcs', estimatedPrice: 0 }]);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
  };

  const onSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await rfqApi.create({
        title,
        description,
        department,
        deadline: new Date(deadline).toISOString(),
        createdBy: user?.id,
        status,
        vendorIds: selectedVendors,
        items: items.map((item, idx) => ({ ...item, id: `temp-${idx}`, rfqId: 'temp' })) as any
      });
      navigate('/rfqs');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader 
        title="Create Request for Quotation" 
        description="Draft a new RFQ to invite vendor bids."
      />

      <form className="space-y-6">
        <Card className="shadow-soft">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium text-lg border-b border-border pb-2">General Details</h3>
            <Input label="RFQ Title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Q3 Office Equipment" />
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Description & Specifications</label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detailed explanation of the requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g., IT" />
              <Input label="Submission Deadline" type="date" required value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-sm font-medium leading-none">Attachments</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors relative">
                <input 
                  type="file" 
                  multiple 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <div className="space-y-1 text-center pointer-events-none">
                  <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground justify-center">
                    <span className="font-medium text-primary">
                      Upload files
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX up to 10MB</p>
                </div>
              </div>
              {attachments.length > 0 && (
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  {attachments.map((file, i) => (
                    <li key={i} className="flex justify-between border-b border-border pb-1">
                      <span>{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newAtt = [...attachments];
                          newAtt.splice(i, 1);
                          setAttachments(newAtt);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
              <h3 className="font-medium text-lg">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>+ Add Item</Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-secondary/30 p-3 rounded-md border border-border">
                  <div className="flex-1">
                    <Input placeholder="Item Name / Part Number" required value={item.itemName} onChange={e => handleItemChange(idx, 'itemName', e.target.value)} />
                  </div>
                  <div className="w-24">
                    <Input type="number" min="1" placeholder="Qty" required value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="w-24">
                    <Input placeholder="Unit" value={item.unit} onChange={e => handleItemChange(idx, 'unit', e.target.value)} />
                  </div>
                  <div className="w-32">
                    <Input type="number" placeholder="Est. Price" value={item.estimatedPrice} onChange={e => handleItemChange(idx, 'estimatedPrice', Number(e.target.value))} />
                  </div>
                  <div className="w-10 flex justify-center mt-[24px]">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <h3 className="font-medium text-lg border-b border-border pb-2 mb-4">Vendor Assignment</h3>
            <p className="text-sm text-muted-foreground mb-4">Select the verified vendors you want to explicitly invite to this RFQ.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-2 border border-border rounded-md bg-secondary/10">
              {activeVendors.map(vendor => (
                <label key={vendor.id} className="flex items-center space-x-3 p-2 hover:bg-secondary rounded-md cursor-pointer border border-transparent hover:border-border transition-all">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    checked={selectedVendors.includes(vendor.id)}
                    onChange={() => handleVendorToggle(vendor.id)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{vendor.companyName}</span>
                    <span className="text-xs text-muted-foreground">{vendor.category} • {vendor.contactName}</span>
                  </div>
                </label>
              ))}
              {activeVendors.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No active vendors found. <a href="/vendors/new" className="text-primary hover:underline">Add one</a>.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/rfqs')}>Cancel</Button>
          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={(e) => onSubmit(e, 'draft')}
              isLoading={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button 
              type="button" 
              onClick={(e) => onSubmit(e, 'published')}
              isLoading={isSubmitting}
            >
              Publish RFQ
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
