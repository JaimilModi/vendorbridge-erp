import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationApi } from '../../api/quotationApi';
import { rfqApi } from '../../api/rfqApi';
import { vendorApi } from '../../api/vendorApi';
import { Rfq } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function QuotationSubmitPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for form
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [validityDays, setValidityDays] = useState(30);
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (rfqId) {
      rfqApi.getById(rfqId).then(data => {
        setRfq(data);
        // Initialize prices map
        const initialPrices: Record<string, number> = {};
        data.items?.forEach(item => {
          initialPrices[item.id] = 0;
        });
        setPrices(initialPrices);
        setLoading(false);
      }).catch(() => navigate('/rfqs'));
    }
  }, [rfqId, navigate]);

  const handlePriceChange = (itemId: string, value: number) => {
    setPrices(prev => ({ ...prev, [itemId]: value }));
  };

  const calculateTotal = () => {
    if (!rfq?.items) return 0;
    return rfq.items.reduce((total, item) => {
      const price = prices[item.id] || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const onSubmit = async (e: React.FormEvent, status: 'draft' | 'submitted') => {
    e.preventDefault();
    if (!rfq) return;
    
    setIsSubmitting(true);
    try {
      const vendors = await vendorApi.getAll();
      const vendor = vendors.find(v => v.userId === user?.id) || vendors[0]; // Fallback to first vendor for hackathon
      
      const items = rfq.items?.map(item => ({
        id: `qi-${Date.now()}-${item.id}`,
        quotationId: 'temp',
        rfqItemId: item.id,
        unitPrice: prices[item.id] || 0,
        quantity: item.quantity,
        totalPrice: (prices[item.id] || 0) * item.quantity
      })) || [];

      await quotationApi.submit({
        rfqId: rfq.id,
        vendorId: vendor.id,
        validityDays,
        deliveryTimeline,
        notes,
        status,
        totalAmount: calculateTotal(),
        items
      });
      
      navigate('/quotations');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !rfq) return <div className="p-8">Loading RFQ data...</div>;

  const total = calculateTotal();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader 
        title="Submit Quotation" 
        description={`Bidding for RFQ: ${rfq.title} (${rfq.rfqNumber})`}
      />

      <form className="space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Line Item Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border rounded-md">
                <thead className="bg-secondary text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item Name</th>
                    <th className="px-4 py-3 font-medium">Quantity</th>
                    <th className="px-4 py-3 font-medium">Est. Price</th>
                    <th className="px-4 py-3 font-medium w-48">Your Unit Price ($)</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rfq.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.itemName}</td>
                      <td className="px-4 py-3">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3">{item.estimatedPrice ? formatCurrency(item.estimatedPrice) : '-'}</td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          required 
                          value={prices[item.id] || ''} 
                          onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {formatCurrency((prices[item.id] || 0) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-secondary/30">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-medium">Total Quotation Value:</td>
                    <td className="px-4 py-3 font-bold text-lg text-primary">{formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Quote Validity (Days)" 
                type="number" 
                min="1" 
                required 
                value={validityDays} 
                onChange={e => setValidityDays(Number(e.target.value))} 
              />
              <Input 
                label="Delivery Timeline" 
                placeholder="e.g., 14 Days, 2 Weeks, etc." 
                required 
                value={deliveryTimeline} 
                onChange={e => setDeliveryTimeline(e.target.value)} 
              />
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium leading-none">Terms / Notes</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any conditions, exclusions, or remarks..."
                />
              </div>
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
              onClick={(e) => onSubmit(e, 'submitted')}
              isLoading={isSubmitting}
            >
              Submit Quotation
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
