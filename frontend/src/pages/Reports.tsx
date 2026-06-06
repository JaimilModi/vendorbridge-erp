import React from 'react';
import { Card, Col, Row, Typography } from 'antd';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';

const { Title } = Typography;

const categoryData = [
  { name: 'Hardware', value: 45000 },
  { name: 'Software', value: 25000 },
  { name: 'Furniture', value: 15000 },
  { name: 'Services', value: 35000 },
];

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#13c2c2'];

const vendorSpendData = [
  { name: 'Global Tech', spend: 85000 },
  { name: 'Apex Supply', spend: 52000 },
  { name: 'Prime Logistics', spend: 31000 },
  { name: 'Office Depot', spend: 18000 },
];

const Reports: React.FC = () => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Reports & Analytics</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Spend by Procurement Category" className="card-shadow">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Spend by Vendor (USD)" className="card-shadow">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={vendorSpendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spend" fill="#1677ff" name="Annual Spend" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
