import React from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TeamOutlined, FileTextOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Procurement Dashboard</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic title="Total Vendors" value={45} prefix={<TeamOutlined style={{ color: '#1677ff', marginRight: 8 }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic title="Active RFQs" value={12} prefix={<FileTextOutlined style={{ color: '#52c41a', marginRight: 8 }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic title="Purchase Orders" value={28} prefix={<ShoppingCartOutlined style={{ color: '#faad14', marginRight: 8 }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic title="Spend Amount" value={125430} precision={2} prefix={<DollarOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Monthly Spend Analytics" className="card-shadow">
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#1677ff" fill="#e6f4ff" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
