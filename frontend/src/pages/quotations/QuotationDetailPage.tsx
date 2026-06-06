import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationApi } from '../../api/quotationApi';
import { rfqApi } from '../../api/rfqApi';
import { Quotation, Rfq } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const q = await quotationApi.getById(id);
          setQuote(q);
          const r = await rfqApi.getById(q.rfqId);
          setRfq(r);
        } catch {
          navigate('/quotations');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading || !quote || !rfq) return <div className="p-8">Loading quotation details...</div>;

  const canApprove = (user?.role === 'admin' || user?.role === 'procurement_officer') && quote.status === 'submitted';

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Quotation ${quote.quoteNumber}`}
        description={`From ${quote.vendor?.companyName}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/quotations')}>Back</Button>
            {canApprove && (
              <Button>Select & Request Approval</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Pricing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border rounded-md">
                  <thead className="bg-secondary text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item Name</th>
                      <th className="px-4 py-3 font-medium">Quantity</th>
                      <th className="px-4 py-3 font-medium">Unit Price</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quote.items?.map((item) => {
                      const rfqItem = rfq.items?.find(ri => ri.id === item.rfqItemId);
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3">{rfqItem?.itemName || 'Unknown Item'}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3 font-medium text-primary">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 font-bold text-primary">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-secondary/30">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Total Amount:</td>
                      <td className="px-4 py-3 font-bold text-lg text-primary">{formatCurrency(quote.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1"><StatusBadge status={quote.status} /></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Linked RFQ</p>
                <p className="font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/rfqs/${rfq.id}`)}>
                  {rfq.rfqNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">{new Date(quote.submittedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validity</p>
                <p className="font-medium">{quote.validityDays} Days</p>
              </div>
            </CardContent>
          </Card>
          
          {quote.notes && (
            <Card className="shadow-soft bg-secondary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground font-medium mb-1">Vendor Notes</p>
                <p className="text-sm">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
