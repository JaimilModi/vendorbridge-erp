import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DownloadCloud, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import { formatCurrency } from '../../lib/utils';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);

  useEffect(() => {
    dashboardApi.getSummary().then(setStats);
    dashboardApi.getMonthlyTrend().then(res => {
      // Map to expected format
      const mapped = res.data?.map((m: any) => ({
        name: m.month,
        spend: m.totalSpend,
        pos: m.poCount
      })) || [];
      setMonthlyTrend(mapped);
    });
    dashboardApi.getVendorPerformance().then(res => {
      // Top 5 vendors
      const mapped = res.data?.slice(0, 5).map((v: any) => ({
        name: v.name,
        score: v.winRate || 0 // Assuming winRate is a good proxy for score
      })) || [];
      setVendorPerformance(mapped);
    });
  }, []);

  const handleExport = () => {
    // Generate simple CSV from vendor performance and monthly trend
    let csv = "--- Monthly Trend ---\nMonth,Spend,POs\n";
    monthlyTrend.forEach(row => {
      csv += `${row.name},${row.spend},${row.pos}\n`;
    });
    
    csv += "\n--- Vendor Performance ---\nVendor,Score\n";
    vendorPerformance.forEach(row => {
      csv += `${row.name},${row.score}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vendorbridge_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statCards = [
    { title: 'Total Spend', value: formatCurrency(stats?.invoices?.totalPaid || 0), icon: DollarSign, trend: '' },
    { title: 'Active POs', value: stats?.purchaseOrders?.issued || 0, icon: FileText, trend: '' },
    { title: 'Pending Approvals', value: stats?.approvals?.pending || 0, icon: Activity, trend: '' },
    { title: 'Active Vendors', value: stats?.vendors?.active || 0, icon: TrendingUp, trend: '' },
  ];

  // Helper icon for missing import
  function FileText(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Reports & Analytics" 
        description="Enterprise procurement insights, spending summaries, and vendor performance."
        actions={
          <Button onClick={handleExport}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-muted-foreground ml-2">Currently</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Monthly Spend Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value) => [`$${value}`, 'Spend']}
                  />
                  <Line type="monotone" dataKey="spend" stroke="#0f172a" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Vendor Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#334155" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
