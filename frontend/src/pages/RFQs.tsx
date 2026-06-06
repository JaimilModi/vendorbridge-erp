import React from 'react';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { formatDate } from '../utils';

const { Title } = Typography;

const mockData = [
  { key: '1', id: 'RFQ-2026-001', title: 'High Performance Laptops Procurement', status: 'OPEN', deadline: '2026-06-20T00:00:00Z', itemsCount: 3 },
  { key: '2', id: 'RFQ-2026-002', title: 'Office Furniture & Chairs', status: 'DRAFT', deadline: '2026-07-01T00:00:00Z', itemsCount: 12 },
  { key: '3', id: 'RFQ-2026-003', title: 'Data Center Networking Equipment', status: 'CLOSED', deadline: '2026-05-30T00:00:00Z', itemsCount: 8 },
];

const RFQs: React.FC = () => {
  const columns = [
    { title: 'RFQ ID', dataIndex: 'id', key: 'id' },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => formatDate(deadline),
    },
    { title: 'Items Count', dataIndex: 'itemsCount', key: 'itemsCount' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'OPEN') color = 'processing';
        if (status === 'DRAFT') color = 'default';
        if (status === 'CLOSED') color = 'warning';
        if (status === 'AWARDED') color = 'success';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">View Details</Button>
          <Button type="link">Quotations</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Request for Quotations (RFQs)</Title>
        <Button type="primary" icon={<PlusOutlined />}>Create RFQ</Button>
      </div>
      <Card className="card-shadow">
        <Table columns={columns} dataSource={mockData} />
      </Card>
    </div>
  );
};

export default RFQs;
