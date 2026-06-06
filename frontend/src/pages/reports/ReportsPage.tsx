import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DownloadCloud, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import { formatCurrency } from '../../lib/utils';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

// Mock monthly data for the chart
const monthlyTrend = [
  { name: 'Jan', spend: 4000, pos: 24 },
  { name: 'Feb', spend: 3000, pos: 13 },
  { name: 'Mar', spend: 2000, pos: 98 },
  { name: 'Apr', spend: 2780, pos: 39 },
  { name: 'May', spend: 1890, pos: 48 },
  { name: 'Jun', spend: 2390, pos: 38 },
];

const vendorPerformance = [
  { name: 'TechSupply Inc.', score: 98 },
  { name: 'Global Logistics', score: 92 },
  { name: 'Office Essentials', score: 85 },
  { name: 'CloudNet Systems', score: 95 },
  { name: 'Acme Corp', score: 78 },
];

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    dashboardApi.getSummary().then(setStats);
  }, []);

  const handleExport = () => {
    alert('Mock: Exporting Analytics to CSV...');
  };

  const statCards = [
    { title: 'Total Spend (YTD)', value: formatCurrency(124500), icon: DollarSign, trend: '+14%' },
    { title: 'Active POs', value: stats?.activePOs || 0, icon: FileText, trend: '+2' },
    { title: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: Activity, trend: '-5' },
    { title: 'Active Vendors', value: stats?.activeVendors || 0, icon: TrendingUp, trend: '+1' },
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
                <span className={stat.trend.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {stat.trend}
                </span>
                <span className="text-muted-foreground ml-2">from last month</span>
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
