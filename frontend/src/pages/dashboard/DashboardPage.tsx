import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { poApi } from '../../api/poApi';
import { invoiceApi } from '../../api/invoiceApi';
import { PageHeader } from '../../components/layout/PageHeader';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { FileText, Users, CheckSquare, ShoppingCart, Plus, FileEdit, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Jan', spend: 4000 },
  { name: 'Feb', spend: 3000 },
  { name: 'Mar', spend: 2000 },
  { name: 'Apr', spend: 2780 },
  { name: 'May', spend: 1890 },
  { name: 'Jun', spend: 2390 },
];

const vendorPerformance = [
  { name: 'TechSupply', score: 98 },
  { name: 'Global Log.', score: 92 },
  { name: 'Office Ess.', score: 85 },
  { name: 'CloudNet', score: 95 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [recentPOs, setRecentPOs] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sum, act, pos, invs] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getActivity(),
          poApi.getAll(),
          invoiceApi.getAll()
        ]);
        setSummary(sum);
        setActivity(act.slice(0, 5));
        setRecentPOs(pos.slice(0, 3));
        setRecentInvoices(invs.slice(0, 3));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  const isVendor = user?.role === 'vendor';

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user?.fullName}. Here's what's happening today.`} 
      />

      {/* Quick Actions */}
      {!isVendor && (
        <div className="flex flex-wrap gap-4 mb-6">
          <Button onClick={() => navigate('/rfqs/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create RFQ
          </Button>
          <Button variant="outline" onClick={() => navigate('/vendors/new')}>
            <Users className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
          <Button variant="outline" onClick={() => navigate('/approvals')}>
            <CheckSquare className="mr-2 h-4 w-4" /> View Approvals
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title={isVendor ? "Invitations" : "Open RFQs"} 
          value={summary?.openRfqs || 0} 
          icon={FileText} 
          trend={{ value: 12, isPositive: true }}
        />
        {!isVendor && (
          <KPICard 
            title="Active Vendors" 
            value={summary?.activeVendors || 0} 
            icon={Users} 
            trend={{ value: 5, isPositive: true }}
          />
        )}
        {isVendor && (
          <KPICard 
            title="Submitted Quotes" 
            value={summary?.activeVendors || 0} 
            icon={FileEdit} 
            trend={{ value: 2, isPositive: true }}
          />
        )}
        <KPICard 
          title="Pending Approvals" 
          value={summary?.pendingApprovals || 0} 
          icon={CheckSquare} 
          trend={{ value: 2, isPositive: false }}
        />
        <KPICard 
          title="Active Purchase Orders" 
          value={summary?.activePOs || 0} 
          icon={ShoppingCart} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Procurement Spend Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="spend" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent POs Widget */}
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Recent Purchase Orders</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/purchase-orders')}>View All</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPOs.map(po => (
                    <div key={po.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm text-primary hover:underline cursor-pointer" onClick={() => navigate(`/purchase-orders/${po.id}`)}>{po.poNumber}</p>
                        <p className="text-xs text-muted-foreground">{po.vendor?.companyName || 'Vendor'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(po.totalAmount)}</p>
                        <div className="mt-1"><StatusBadge status={po.status} /></div>
                      </div>
                    </div>
                  ))}
                  {recentPOs.length === 0 && <p className="text-sm text-muted-foreground">No recent POs.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Recent Invoices Widget */}
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Recent Invoices</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>View All</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map(inv => (
                    <div key={inv.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm text-primary hover:underline cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{inv.vendor?.companyName || 'Vendor'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(inv.totalAmount)}</p>
                        <div className="mt-1"><StatusBadge status={inv.status} /></div>
                      </div>
                    </div>
                  ))}
                  {recentInvoices.length === 0 && <p className="text-sm text-muted-foreground">No recent invoices.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="col-span-1 space-y-6">
          {!isVendor && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Vendor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorPerformance} layout="vertical" margin={{ left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 500 }} width={80} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="score" fill="#334155" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent Activity</CardTitle>
              {!isVendor && <Button variant="outline" size="sm" onClick={() => navigate('/activity')}>View All</Button>}
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mt-2">
                {activity.map((log) => (
                  <div key={log.id} className="flex items-start space-x-4">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                      <ActivityIcon action={log.action} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {log.user?.fullName || 'System'} <span className="text-muted-foreground font-normal">{formatAction(log.action)}</span> {log.entityId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('RFQ')) return <FileText className="h-4 w-4 text-primary" />;
  if (action.includes('QUOTE')) return <FileEdit className="h-4 w-4 text-primary" />;
  if (action.includes('APPROV')) return <CheckSquare className="h-4 w-4 text-primary" />;
  if (action.includes('PO')) return <ShoppingCart className="h-4 w-4 text-primary" />;
  if (action.includes('INVOICE')) return <Receipt className="h-4 w-4 text-primary" />;
  return <Users className="h-4 w-4 text-primary" />;
}

function formatAction(action: string) {
  return action.toLowerCase().replace(/_/g, ' ');
}
