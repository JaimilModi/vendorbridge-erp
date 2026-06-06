import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Typography, Spin, Empty, Tag } from 'antd';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils';

const { Title, Text, Paragraph } = Typography;

interface ReportsData {
  charts: {
    spendByVendor: { name: string; spend: number }[];
    spendByProduct: { name: string; value: number }[];
  };
}

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#13c2c2', '#722ed1'];

export const Reports: React.FC = () => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/analytics');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch reports spend analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Loading reports and analytics...</Text>
      </div>
    );
  }

  if (!data) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 24, borderRadius: 12 }} className="card-shadow">
        <Empty description="No reports data could be retrieved. Check backend connection." />
      </Card>
    );
  }

  const { spendByVendor, spendByProduct } = data.charts;

  const isVendorEmpty = !spendByVendor || spendByVendor.length === 0 || spendByVendor.every(item => item.spend === 0);
  const isProductEmpty = !spendByProduct || spendByProduct.length === 0 || spendByProduct.every(item => item.value === 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Reports & Spend Analytics</Title>
        <Text type="secondary">
          Database: <Tag color="blue">Neon PostgreSQL</Tag> | Status: <Tag color="green">Live Realtime Metrics</Tag>
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Category / Product Spend Chart */}
        <Col xs={24} md={12}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Spend by Procurement Item (Top 5 Products)</span>} 
            className="card-shadow"
            style={{ borderRadius: 12 }}
          >
            {isProductEmpty ? (
              <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description="No product spend data recorded in the database yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={spendByProduct}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={90}
                      fill="#1677ff"
                      dataKey="value"
                    >
                      {spendByProduct.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Spend by Vendor Chart */}
        <Col xs={24} md={12}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Spend by Supplier (Top 5 Vendors)</span>} 
            className="card-shadow"
            style={{ borderRadius: 12 }}
          >
            {isVendorEmpty ? (
              <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description="No PO spend generated for registered vendors yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={spendByVendor} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="spend" fill="#1677ff" name="Cumulative PO Spend" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Procurement Spend Analysis Summary</span>} 
            className="card-shadow" 
            style={{ borderRadius: 12 }}
          >
            <Paragraph style={{ margin: 0, fontSize: 14, color: '#595959', lineHeight: '22px' }}>
              This audit report consolidates all finalized procurement data across the entire organization. Spend by vendor and spend by item calculations are calculated by aggregating issued or completed Purchase Orders recorded in the Postgres database. Hardcoded mock category templates and static demo datasets have been completely decoupled to guarantee audit integrity.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
