import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { approvalApi } from '../../api/approvalApi';
import { Approval } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { CheckCircle2, Circle, Clock, FileText, CheckSquare, XCircle } from 'lucide-react';

export default function ApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      approvalApi.getById(id).then(data => {
        setApproval(data);
        setLoading(false);
      }).catch(() => navigate('/approvals'));
    }
  }, [id, navigate]);

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!id) return;
    setSubmitting(true);
    try {
      await approvalApi.decide(id, status, notes);
      navigate('/approvals');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading || !approval) return <div className="p-8">Loading approval details...</div>;

  const isPending = approval.status === 'pending';
  const isManager = user?.role === 'manager';
  
  // Timeline steps
  const steps = [
    { title: 'RFQ Published', status: 'completed', icon: FileText, date: 'Earlier' },
    { title: 'Quotation Submitted', status: 'completed', icon: FileText, date: new Date(approval.requestedAt).toLocaleDateString() },
    { title: 'Approval Requested', status: 'completed', icon: Clock, date: new Date(approval.requestedAt).toLocaleDateString() },
    { 
      title: approval.status === 'pending' ? 'Pending Decision' : (approval.status === 'approved' ? 'Approved' : 'Rejected'), 
      status: approval.status === 'pending' ? 'current' : (approval.status === 'approved' ? 'completed' : 'rejected'), 
      icon: approval.status === 'approved' ? CheckSquare : (approval.status === 'rejected' ? XCircle : Circle),
      date: approval.decidedAt ? new Date(approval.decidedAt).toLocaleDateString() : 'Awaiting'
    },
    { 
      title: 'Purchase Order', 
      status: approval.status === 'approved' ? 'completed' : (approval.status === 'rejected' ? 'cancelled' : 'upcoming'), 
      icon: FileText,
      date: approval.status === 'approved' ? 'Auto-Generated' : '-'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader 
        title={`Approval Request: ${approval.id}`} 
        description={`Reviewing Quotation ${approval.quotation?.quoteNumber} from ${approval.quotation?.vendor?.companyName}`}
        actions={<Button variant="outline" onClick={() => navigate('/approvals')}>Back to Queue</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader className="bg-secondary/20 border-b border-border pb-4">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Formal Request Details</span>
                <StatusBadge status={approval.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/10 rounded-md border border-border">
                  <span className="text-sm text-muted-foreground block mb-1">Total Amount Requested</span>
                  <span className="font-bold text-2xl text-primary">{formatCurrency(approval.quotation?.totalAmount || 0)}</span>
                </div>
                <div className="p-4 bg-secondary/10 rounded-md border border-border">
                  <span className="text-sm text-muted-foreground block mb-1">Vendor</span>
                  <span className="font-semibold text-lg">{approval.quotation?.vendor?.companyName || 'Vendor ID: ' + approval.quotation?.vendorId}</span>
                </div>
              </div>

              <div className="py-4 border-b border-border">
                <h4 className="font-medium mb-3">Linked Entities</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RFQ ID:</span>
                    <span className="font-medium">{approval.quotation?.rfqId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quote Ref:</span>
                    <span className="font-medium">{approval.quotation?.quoteNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested By:</span>
                    <span className="font-medium">{approval.requesterId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validity:</span>
                    <span className="font-medium">{approval.quotation?.validityDays} Days</span>
                  </div>
                </div>
              </div>
              
              {approval.notes && (
                <div className="pt-2">
                  <h4 className="font-medium mb-2 text-sm">Decision Remarks</h4>
                  <div className={`p-4 rounded-md border ${approval.status === 'approved' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {approval.notes}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recorded on {new Date(approval.decidedAt!).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Action Card for Manager */}
          {isPending && isManager && (
            <Card className="shadow-soft border-primary/30">
              <CardHeader className="bg-primary/5 pb-4 border-b border-border">
                <CardTitle className="text-lg">Executive Decision</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium leading-none">Formal Remarks / Justification</label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Enter official remarks for the audit trail..."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex space-x-3 pt-2">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleDecision('rejected')}
                  isLoading={submitting}
                >
                  Reject Request
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => handleDecision('approved')}
                  isLoading={submitting}
                >
                  Approve & Auto-Generate PO
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Right Column: Workflow Timeline */}
        <div className="lg:col-span-1">
          <Card className="shadow-soft h-full">
            <CardHeader>
              <CardTitle className="text-lg">Workflow Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {steps.map((step, idx) => {
                  const isCompleted = step.status === 'completed';
                  const isCurrent = step.status === 'current';
                  const isRejected = step.status === 'rejected';
                  
                  return (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                        isCompleted ? 'bg-primary text-primary-foreground' : 
                        isCurrent ? 'bg-amber-500 text-white animate-pulse' :
                        isRejected ? 'bg-destructive text-white' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-border bg-white shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className={`font-bold text-sm ${isCurrent ? 'text-amber-600' : isRejected ? 'text-destructive' : 'text-primary'}`}>
                            {step.title}
                          </div>
                          <time className="text-xs font-medium text-muted-foreground">{step.date}</time>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
