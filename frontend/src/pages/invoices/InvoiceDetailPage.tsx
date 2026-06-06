import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import { Invoice } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { Printer, CheckCircle, XCircle, CreditCard, Download, Mail } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      invoiceApi.getById(id).then(data => {
        setInvoice(data);
        setLoading(false);
      }).catch(() => navigate('/invoices'));
    }
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Mock: Downloading Invoice PDF...');
  };

  const handleEmail = () => {
    alert('Mock: Emailing Invoice to VendorBridge Accounts Payable...');
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected' | 'paid') => {
    if (!invoice) return;
    setProcessing(true);
    try {
      await invoiceApi.updateStatus(invoice.id, status);
      setInvoice({ ...invoice, status });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !invoice) return <div className="p-8">Loading invoice details...</div>;

  const isInternal = user?.role === 'admin' || user?.role === 'procurement_officer';
  const isPending = invoice.status === 'pending';
  const isApproved = invoice.status === 'approved';

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader 
          title={`Invoice ${invoice.invoiceNumber}`}
          description={`From ${invoice.vendor?.companyName}`}
          actions={
            <>
              <Button variant="outline" onClick={() => navigate('/invoices')}>Back</Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" onClick={handleEmail}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              
              {isInternal && isPending && (
                <>
                  <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')} isLoading={processing}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button onClick={() => handleStatusUpdate('approved')} isLoading={processing}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                  </Button>
                </>
              )}
              
              {isInternal && isApproved && (
                <Button onClick={() => handleStatusUpdate('paid')} isLoading={processing}>
                  <CreditCard className="mr-2 h-4 w-4" /> Mark as Paid
                </Button>
              )}
            </>
          }
        />
      </div>

      <Card className="shadow-soft bg-white print:shadow-none print:border-none print:m-0 print:p-0">
        <CardContent className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between pb-8 border-b border-border">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2 uppercase tracking-wide">Invoice</h1>
              <p className="text-muted-foreground font-medium">{invoice.invoiceNumber}</p>
              <div className="mt-4">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
            <div className="mt-6 sm:mt-0 sm:text-right">
              <h2 className="text-xl font-bold text-primary">{invoice.vendor?.companyName}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{invoice.vendor?.address}</p>
              <p className="text-muted-foreground text-sm">{invoice.vendor?.phone}</p>
              <p className="text-muted-foreground text-sm">{invoice.vendor?.contactName}</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 py-8 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bill To</h3>
              <p className="font-bold text-lg">VendorBridge ERP</p>
              <p className="text-sm text-muted-foreground mt-1">123 Corporate Ave</p>
              <p className="text-sm text-muted-foreground">Business District, NY 10001</p>
            </div>
            <div>
              <div className="space-y-3 text-sm sm:text-right">
                <div className="flex justify-between sm:justify-end sm:space-x-8">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span className="font-medium">{new Date(invoice.submittedAt).toLocaleDateString()}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between sm:justify-end sm:space-x-8">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between sm:justify-end sm:space-x-8">
                  <span className="text-muted-foreground">PO Ref:</span>
                  <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/purchase-orders/${invoice.poId}`)}>
                    {invoice.po?.poNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
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
                {invoice.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-medium">{item.description}</td>
                    <td className="px-4 py-4 text-right">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-4 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4">
            <div className="w-full sm:w-1/3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Tax (10%)</span>
                <span className="font-medium">{formatCurrency(invoice.totalAmount * 0.1)}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="font-bold text-lg">Total Due</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(invoice.totalAmount * 1.1)}</span>
              </div>
            </div>
          </div>
          
          {invoice.status === 'paid' && (
            <div className="mt-8 flex justify-end">
              <div className="border-4 border-emerald-500 text-emerald-500 font-bold uppercase tracking-widest px-6 py-2 transform rotate-12 opacity-80 text-xl inline-block">
                PAID IN FULL
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
