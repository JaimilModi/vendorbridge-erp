import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfqApi } from '../../api/rfqApi';
import { Rfq } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../constants';

export default function RFQDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      rfqApi.getById(id).then(data => {
        setRfq(data);
        setLoading(false);
      }).catch(() => {
        navigate('/rfqs');
      });
    }
  }, [id, navigate]);

  if (loading || !rfq) return <div className="p-8">Loading RFQ details...</div>;

  const canCompare = (user?.role === ROLES.ADMIN || user?.role === ROLES.PROCUREMENT_OFFICER || user?.role === ROLES.MANAGER) && rfq.status === 'closed';

  return (
    <div className="space-y-6">
      <PageHeader 
        title={rfq.title} 
        description={`Reference: ${rfq.rfqNumber}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/rfqs')}>Back</Button>
            {canCompare && (
              <Button onClick={() => navigate(`/quotations/compare/${rfq.id}`)}>Compare Quotations</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{rfq.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border rounded-md">
                  <thead className="bg-secondary text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item Name</th>
                      <th className="px-4 py-3 font-medium">Quantity</th>
                      <th className="px-4 py-3 font-medium">Est. Price</th>
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
                          {item.estimatedPrice ? formatCurrency(item.estimatedPrice * item.quantity) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1"><StatusBadge status={rfq.status} /></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">{new Date(rfq.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{rfq.department || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget Limit</p>
                <p className="font-medium">{rfq.budgetLimit ? formatCurrency(rfq.budgetLimit) : 'None'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Invited Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              {rfq.invitedVendors?.length ? (
                <ul className="space-y-3">
                  {rfq.invitedVendors.map(vendor => (
                    <li key={vendor.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{vendor.companyName}</span>
                      <StatusBadge status="Pending Response" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Public RFQ or no vendors invited yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
