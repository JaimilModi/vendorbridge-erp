import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationApi } from '../../api/quotationApi';
import { rfqApi } from '../../api/rfqApi';
import { Quotation, Rfq } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { CheckCircle2, Star, Filter } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function QuotationComparePage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'delivery'>('price');

  useEffect(() => {
    const fetchCompareData = async () => {
      if (rfqId) {
        try {
          const [r, qs] = await Promise.all([
            rfqApi.getById(rfqId),
            quotationApi.getByRfqId(rfqId)
          ]);
          setRfq(r);
          // Only show submitted quotes for comparison
          setQuotes(qs.filter(q => q.status !== 'draft'));
        } catch {
          navigate('/rfqs');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCompareData();
  }, [rfqId, navigate]);

  const handleSelectWinner = async (quoteId: string) => {
    setSelectingId(quoteId);
    try {
      await quotationApi.selectWinner(quoteId, rfqId!, user?.id || 'system');
      navigate('/approvals');
    } catch (err) {
      console.error(err);
      setSelectingId(null);
    }
  };

  if (loading || !rfq) return <div className="p-8">Loading comparison data...</div>;

  if (quotes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Compare Quotations" description={`RFQ: ${rfq.title}`} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No quotations have been submitted for this RFQ yet.</p>
            <Button variant="outline" onClick={() => navigate(`/rfqs/${rfq.id}`)}>Back to RFQ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort Quotes
  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === 'price') {
      return a.totalAmount - b.totalAmount;
    } else {
      // Parse integers from strings like "14 Days", fallback to big number
      const daysA = parseInt(a.deliveryTimeline || '999');
      const daysB = parseInt(b.deliveryTimeline || '999');
      return (isNaN(daysA) ? 999 : daysA) - (isNaN(daysB) ? 999 : daysB);
    }
  });

  const lowestTotal = Math.min(...quotes.map(q => q.totalAmount));
  const fastestDelivery = Math.min(...quotes.map(q => parseInt(q.deliveryTimeline || '999') || 999));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Compare Quotations" 
          description={`RFQ: ${rfq.title} (${rfq.rfqNumber})`}
        />
        
        <div className="flex items-center space-x-4 bg-white p-2 rounded-lg border border-border shadow-soft">
          <div className="flex items-center text-sm text-muted-foreground">
            <Filter className="h-4 w-4 mr-2" /> Sort by:
          </div>
          <select 
            className="text-sm border-0 focus:ring-0 cursor-pointer font-medium"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price' | 'delivery')}
          >
            <option value="price">Price (Low to High)</option>
            <option value="delivery">Delivery (Fastest)</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => navigate(`/rfqs/${rfq.id}`)}>Back to RFQ</Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {/* RFQ Reference Column */}
          <div className="w-64 flex-shrink-0 flex flex-col">
            <div className="h-32 p-4 flex items-end">
              <h3 className="font-semibold text-lg text-muted-foreground">Line Items</h3>
            </div>
            {rfq.items?.map(item => (
               <div key={item.id} className="h-16 px-4 py-3 border-t border-border flex items-center bg-secondary/20">
                <span className="text-sm font-medium">{item.itemName} <span className="text-muted-foreground font-normal">x{item.quantity}</span></span>
              </div>
            ))}
            <div className="h-16 px-4 py-3 border-t border-border flex items-center bg-secondary/50 font-bold">
              Total Amount
            </div>
            <div className="h-16 px-4 py-3 border-t border-border flex items-center text-sm text-muted-foreground">
              Delivery Timeline
            </div>
            <div className="h-16 px-4 py-3 border-t border-border flex items-center text-sm text-muted-foreground">
              Validity
            </div>
          </div>

          {/* Quotation Columns */}
          {sortedQuotes.map(quote => {
            const isLowest = quote.totalAmount === lowestTotal;
            const quoteDeliveryInt = parseInt(quote.deliveryTimeline || '999') || 999;
            const isFastest = quoteDeliveryInt === fastestDelivery && quoteDeliveryInt !== 999;

            return (
              <Card key={quote.id} className={`w-80 flex-shrink-0 shadow-soft overflow-hidden transition-all ${isLowest ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' : ''}`}>
                <div className={`h-32 p-4 flex flex-col justify-between ${isLowest ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg truncate pr-2">{quote.vendor?.companyName}</h3>
                      {quote.vendor?.rating && (
                        <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${isLowest ? 'bg-white/20' : 'bg-secondary'}`}>
                          <Star className={`h-3 w-3 mr-1 ${isLowest ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                          {quote.vendor.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <p className={`text-sm ${isLowest ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{quote.quoteNumber}</p>
                  </div>
                  {isLowest && (
                    <div className="flex items-center text-xs font-semibold uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Lowest Overall Bid
                    </div>
                  )}
                </div>
                
                {rfq.items?.map(item => {
                  const qItem = quote.items?.find(qi => qi.rfqItemId === item.id);
                  return (
                    <div key={item.id} className="h-16 px-4 py-3 border-t border-border flex flex-col justify-center bg-white">
                      <span className="font-medium">{qItem ? formatCurrency(qItem.unitPrice) : '-'} <span className="text-xs text-muted-foreground font-normal">/ unit</span></span>
                      <span className="text-xs text-muted-foreground">Total: {qItem ? formatCurrency(qItem.totalPrice) : '-'}</span>
                    </div>
                  );
                })}
                
                <div className={`h-16 px-4 py-3 border-t border-border flex items-center ${isLowest ? 'bg-green-50' : 'bg-secondary/30'}`}>
                  <span className={`font-bold text-lg ${isLowest ? 'text-green-700' : 'text-primary'}`}>{formatCurrency(quote.totalAmount)}</span>
                </div>
                
                <div className={`h-16 px-4 py-3 border-t border-border flex justify-between items-center bg-white ${isFastest ? 'text-green-600 font-medium' : ''}`}>
                  <span>{quote.deliveryTimeline || 'Not specified'}</span>
                  {isFastest && <span className="text-xs bg-green-100 px-2 py-0.5 rounded">Fastest</span>}
                </div>

                <div className="h-16 px-4 py-3 border-t border-border flex items-center bg-white">
                  <span className="text-sm">{quote.validityDays} Days</span>
                </div>
                
                <div className="p-4 bg-secondary/10 border-t border-border">
                  <Button 
                    className="w-full" 
                    variant={isLowest ? 'default' : 'outline'}
                    onClick={() => handleSelectWinner(quote.id)}
                    isLoading={selectingId === quote.id}
                    disabled={selectingId !== null && selectingId !== quote.id}
                  >
                    Select & Request Approval
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
