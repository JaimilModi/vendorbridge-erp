import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, Empty, Tag } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils';

const { Title, Paragraph, Text } = Typography;

interface AnalyticsData {
  role: string;
  metrics: {
    totalVendors: number;
    activeVendors: number;
    totalRfqs: number;
    openRfqs: number;
    closedRfqs: number;
    totalQuotations: number;
    submittedQuotations: number;
    acceptedQuotations: number;
    rejectedQuotations: number;
    pendingApprovals: number;
    purchaseOrders: number;
    invoices: number;
    paidInvoices: number;
    outstandingInvoices: number;
    totalProcurementSpend: number;
  };
  charts: {
    rfqsPerMonth: { name: string; value: number }[];
    quotationsPerMonth: { name: string; value: number }[];
    purchaseOrdersPerMonth: { name: string; value: number }[];
    invoicesPerMonth: { name: string; value: number }[];
    invoiceStatusDistribution: { name: string; value: number }[];
    purchaseOrderStatusDistribution: { name: string; value: number }[];
  };
}

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

const STATUS_COLOR_MAP: Record<string, string> = {
  PAID: '#52c41a',
  ACCEPTED: '#52c41a',
  COMPLETED: '#52c41a',
  APPROVED: '#52c41a',
  SENT: '#1677ff',
  SUBMITTED: '#1677ff',
  ISSUED: '#1677ff',
  OPEN: '#13c2c2',
  PENDING: '#faad14',
  DRAFT: '#8c8c8c',
  OVERDUE: '#f5222d',
  CANCELLED: '#f5222d',
  REJECTED: '#f5222d',
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const role = user?.role;

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/analytics');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Loading real-time analytics data...</Text>
      </div>
    );
  }

  if (!data) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 24, borderRadius: 12 }} className="card-shadow">
        <Empty description="No analytics data could be retrieved. Check backend connection." />
      </Card>
    );
  }

  const { metrics, charts } = data;

  // Custom styled cards
  const metricCard = (title: string, value: string | number, prefixIcon: React.ReactNode, subtext?: string) => (
    <Card 
      className="card-shadow" 
      style={{ 
        borderRadius: 12, 
        border: '1px solid #f0f0f0', 
        height: '100%',
        background: 'linear-gradient(180deg, #ffffff 0%, #fdfdfd 100%)'
      }}
    >
      <Statistic 
        title={<span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500, color: '#8c8c8c' }}>{title}</span>} 
        value={value} 
        prefix={prefixIcon} 
        valueStyle={{ fontWeight: 700, fontSize: 24, color: '#1f1f1f' }}
      />
      {subtext && <Paragraph style={{ margin: '8px 0 0 0', fontSize: 12, color: '#8c8c8c' }}>{subtext}</Paragraph>}
    </Card>
  );

  // Group chart series
  const volumeChartData = charts.rfqsPerMonth.map((item, idx) => ({
    name: item.name,
    rfqs: item.value,
    quotations: charts.quotationsPerMonth[idx]?.value || 0,
    pos: charts.purchaseOrdersPerMonth[idx]?.value || 0,
    invoices: charts.invoicesPerMonth[idx]?.value || 0,
  }));

  const isAllEmpty = (arr: { value: number }[]) => arr.every(item => item.value === 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            {role === 'ADMIN' && 'System Administration Dashboard'}
            {role === 'PROCUREMENT_OFFICER' && 'Procurement Operations KPIs'}
            {role === 'VENDOR' && 'Vendor Portal Sales Overview'}
            {role === 'MANAGER' && 'Management Review & Approvals'}
          </Title>
          <Text type="secondary">
            Logged in as <Tag color="blue" style={{ marginLeft: 4 }}>{role?.replace('_', ' ')}</Tag>
          </Text>
        </div>
      </div>

      {/* Dynamic metric grids depending on user role */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Admin and Procurement Officer Cards */}
        {(role === 'ADMIN' || role === 'PROCUREMENT_OFFICER') && (
          <>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Total Spend', formatCurrency(metrics.totalProcurementSpend), <DollarOutlined style={{ color: '#52c41a' }} />, `PO Spend final totals`)}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Vendors Network', `${metrics.activeVendors} / ${metrics.totalVendors}`, <TeamOutlined style={{ color: '#1677ff' }} />, 'Active vs Total registered')}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Open RFQs', `${metrics.openRfqs} / ${metrics.totalRfqs}`, <FileTextOutlined style={{ color: '#faad14' }} />, 'Open vs Total requests')}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Purchase Orders', metrics.purchaseOrders, <ShoppingCartOutlined style={{ color: '#722ed1' }} />, 'Total orders generated')}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Total Quotations', metrics.totalQuotations, <FileOutlined style={{ color: '#13c2c2' }} />, `${metrics.submittedQuotations} submitted bid(s)`)}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Quotation Statuses', `${metrics.acceptedQuotations} Acc / ${metrics.rejectedQuotations} Rej`, <CheckCircleOutlined style={{ color: '#52c41a' }} />, 'Accepted vs Rejected')}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Pending Approvals', metrics.pendingApprovals, <ClockCircleOutlined style={{ color: '#faad14' }} />, 'Quotations awaiting review')}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {metricCard('Invoice Tracking', `${metrics.paidInvoices} Paid / ${metrics.outstandingInvoices} Out`, <DollarOutlined style={{ color: '#f5222d' }} />, `Outstanding invoices`)}
            </Col>
          </>
        )}

        {/* Manager Cards */}
        {role === 'MANAGER' && (
          <>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Total Spend Sum', formatCurrency(metrics.totalProcurementSpend), <DollarOutlined style={{ color: '#52c41a' }} />, 'Spend in ISSUED/COMPLETED POs')}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Pending Approvals', metrics.pendingApprovals, <ClockCircleOutlined style={{ color: '#faad14' }} />, 'Approvals awaiting your sign-off')}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('RFQ In Market', metrics.openRfqs, <FileTextOutlined style={{ color: '#1677ff' }} />, `Out of ${metrics.totalRfqs} total RFQs`)}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Received Quotations', metrics.totalQuotations, <FileOutlined style={{ color: '#13c2c2' }} />, `${metrics.acceptedQuotations} Accepted / ${metrics.rejectedQuotations} Rejected`)}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Total Orders', metrics.purchaseOrders, <ShoppingCartOutlined style={{ color: '#722ed1' }} />, 'Total purchase orders')}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Invoices Count', metrics.invoices, <DollarOutlined style={{ color: '#f5222d' }} />, `${metrics.paidInvoices} paid invoices`)}
            </Col>
          </>
        )}

        {/* Vendor Cards */}
        {role === 'VENDOR' && (
          <>
            <Col xs={24} sm={12} md={8}>
              {metricCard('My Sales Revenue', formatCurrency(metrics.totalProcurementSpend), <DollarOutlined style={{ color: '#52c41a' }} />, 'From issued and completed POs')}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('My Bid Quotations', metrics.totalQuotations, <FileOutlined style={{ color: '#1677ff' }} />, `${metrics.submittedQuotations} Submitted / ${metrics.acceptedQuotations} Accepted`)}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Quotation Rejections', metrics.rejectedQuotations, <CloseCircleOutlined style={{ color: '#f5222d' }} />, 'Rejected quotation bids')}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Pending Approvals', metrics.pendingApprovals, <ClockCircleOutlined style={{ color: '#faad14' }} />, 'Quotation bids undergoing approval')}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('Purchase Orders Received', metrics.purchaseOrders, <ShoppingCartOutlined style={{ color: '#722ed1' }} />, 'Total orders received')}
            </Col>
            <Col xs={24} sm={12} md={8}>
              {metricCard('My Invoices', `${metrics.paidInvoices} Paid / ${metrics.outstandingInvoices} Out`, <DollarOutlined style={{ color: '#13c2c2' }} />, 'Paid vs Outstanding invoices')}
            </Col>
          </>
        )}
      </Row>

      {/* Time-Series charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Monthly Volume Analytics</span>} 
            className="card-shadow" 
            style={{ borderRadius: 12 }}
          >
            {isAllEmpty(charts.rfqsPerMonth) && isAllEmpty(charts.quotationsPerMonth) && isAllEmpty(charts.purchaseOrdersPerMonth) && isAllEmpty(charts.invoicesPerMonth) ? (
              <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description="No transaction data available for the last 6 months" />
              </div>
            ) : (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <AreaChart data={volumeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRfqs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#13c2c2" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#13c2c2" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1677ff" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#722ed1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#722ed1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52c41a" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#8c8c8c', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }} />
                    <Legend verticalAlign="top" height={36} />
                    {(role === 'ADMIN' || role === 'PROCUREMENT_OFFICER' || role === 'MANAGER') && (
                      <Area name="RFQs" type="monotone" dataKey="rfqs" stroke="#13c2c2" fillOpacity={1} fill="url(#colorRfqs)" strokeWidth={2} />
                    )}
                    <Area name="Quotations" type="monotone" dataKey="quotations" stroke="#1677ff" fillOpacity={1} fill="url(#colorQuotes)" strokeWidth={2} />
                    <Area name="Purchase Orders" type="monotone" dataKey="pos" stroke="#722ed1" fillOpacity={1} fill="url(#colorPos)" strokeWidth={2} />
                    <Area name="Invoices" type="monotone" dataKey="invoices" stroke="#52c41a" fillOpacity={1} fill="url(#colorInvoices)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Purchase Order Distribution</span>} 
            className="card-shadow" 
            style={{ borderRadius: 12, height: '100%' }}
          >
            {charts.purchaseOrderStatusDistribution.length === 0 || charts.purchaseOrderStatusDistribution.every(item => item.value === 0) ? (
              <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description="No PO status data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={charts.purchaseOrderStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts.purchaseOrderStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLOR_MAP[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Invoice status distribution */}
      {role !== 'MANAGER' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card 
              title={<span style={{ fontWeight: 600 }}>Invoice Status Distribution</span>} 
              className="card-shadow" 
              style={{ borderRadius: 12 }}
            >
              {charts.invoiceStatusDistribution.length === 0 || charts.invoiceStatusDistribution.every(item => item.value === 0) ? (
                <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Empty description="No Invoice status data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={charts.invoiceStatusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8 }} />
                      <Bar dataKey="value" name="Invoices Count" radius={[4, 4, 0, 0]}>
                        {charts.invoiceStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLOR_MAP[entry.name] || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card 
              title={<span style={{ fontWeight: 600 }}>Analytics Overview Summary</span>} 
              className="card-shadow" 
              style={{ borderRadius: 12, height: '100%' }}
            >
              <div style={{ padding: '8px 0' }}>
                <Paragraph style={{ fontSize: 14, color: '#595959', lineHeight: '22px' }}>
                  This dashboard shows live transaction metrics directly pulled from your production <strong>Neon PostgreSQL</strong> database.
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <Text type="secondary">System Status</Text>
                    <Tag color="success">ONLINE</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <Text type="secondary">Database Node</Text>
                    <Text strong>Neon Serverless Postgres</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <Text type="secondary">Metrics Sync Interval</Text>
                    <Tag color="blue">REALTIME</Tag>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
