import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { poApi } from '../../api/poApi';
import { invoiceApi } from '../../api/invoiceApi';
import { PurchaseOrder } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { Printer, Download, Receipt, Mail } from 'lucide-react';

export default function PODetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      poApi.getById(id).then(data => {
        setPo(data);
        setLoading(false);
      }).catch(() => navigate('/purchase-orders'));
    }
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Mock: Downloading PDF...');
  };

  const handleEmail = () => {
    alert('Mock: Email sent to vendor.');
  };

  const handleGenerateInvoice = async () => {
    if (!po) return;
    setGenerating(true);
    try {
      const invoice = await invoiceApi.submit({
        poId: po.id,
        vendorId: po.vendorId,
        totalAmount: po.totalAmount,
        items: po.items?.map(pi => ({
          id: `inv-i-${Date.now()}`,
          invoiceId: 'temp',
          poItemId: pi.id,
          description: pi.itemName,
          quantity: pi.quantity,
          unitPrice: pi.unitPrice,
          totalPrice: pi.totalPrice
        }))
      });
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      console.error(err);
      setGenerating(false);
    }
  };

  if (loading || !po) return <div className="p-8">Loading PO details...</div>;

  const isVendor = user?.role === 'vendor';
  const canInvoice = isVendor && po.status !== 'cancelled';

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader 
          title={`Purchase Order ${po.poNumber}`}
          description={`Issued to ${po.vendor?.companyName}`}
          actions={
            <>
              <Button variant="outline" onClick={() => navigate('/purchase-orders')}>Back</Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" onClick={handleEmail}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              {canInvoice && (
                <Button onClick={handleGenerateInvoice} isLoading={generating}>
                  <Receipt className="mr-2 h-4 w-4" /> Generate Invoice
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Printable Area */}
      <Card className="shadow-soft bg-white print:shadow-none print:border-none print:m-0 print:p-0">
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row justify-between pb-8 border-b border-border">
            <div>
              <div className="h-10 w-10 bg-primary rounded flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl leading-none">V</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-primary">VendorBridge ERP</h2>
              <p className="text-muted-foreground mt-1 text-sm">Enterprise Procurement System</p>
            </div>
            <div className="mt-6 sm:mt-0 sm:text-right">
              <h1 className="text-3xl font-bold text-primary mb-2 uppercase tracking-wide">Purchase Order</h1>
              <p className="text-muted-foreground font-medium">{po.poNumber}</p>
              <div className="mt-4 flex flex-col sm:items-end space-y-1">
                <StatusBadge status={po.status} />
                <p className="text-sm mt-2"><span className="text-muted-foreground">Date:</span> {new Date(po.issuedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 py-8 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Vendor Info</h3>
              <p className="font-bold text-lg">{po.vendor?.companyName}</p>
              <p className="text-sm mt-1">{po.vendor?.contactName}</p>
              <p className="text-sm text-muted-foreground mt-1">{po.vendor?.address}</p>
              <p className="text-sm text-muted-foreground mt-1">{po.vendor?.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Order Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked RFQ:</span>
                  <span className="font-medium cursor-pointer hover:underline text-primary" onClick={() => navigate(`/rfqs/${po.rfqId}`)}>{po.rfqId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quotation Ref:</span>
                  <span className="font-medium">{po.quotationId}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="py-8">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-md">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                  <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-tr-md">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {po.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-medium">{item.itemName}</td>
                    <td className="px-4 py-4 text-right">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-4 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-full sm:w-1/3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-medium">{formatCurrency(po.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Tax (10%)</span>
                <span className="font-medium">{formatCurrency(po.totalAmount * 0.1)}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(po.totalAmount * 1.1)}</span>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>This is a system generated purchase order. Signature not required.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
