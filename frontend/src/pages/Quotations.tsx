import React from 'react';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import { formatCurrency, formatDate } from '../utils';

const { Title } = Typography;

const mockData = [
  { key: '1', id: 'QT-9872', rfq: 'High Performance Laptops Procurement', vendor: 'Global Tech Solutions', amount: 15400, status: 'SUBMITTED', date: '2026-06-05T00:00:00Z' },
  { key: '2', id: 'QT-9873', rfq: 'High Performance Laptops Procurement', vendor: 'Apex Industrial Supply', amount: 16100, status: 'ACCEPTED', date: '2026-06-05T00:00:00Z' },
  { key: '3', id: 'QT-9874', rfq: 'Office Furniture & Chairs', vendor: 'Prime Logistics Corp', amount: 4500, status: 'DRAFT', date: '2026-06-06T00:00:00Z' },
];

const Quotations: React.FC = () => {
  const columns = [
    { title: 'Quotation ID', dataIndex: 'id', key: 'id' },
    { title: 'RFQ', dataIndex: 'rfq', key: 'rfq' },
    { title: 'Vendor', dataIndex: 'vendor', key: 'vendor' },
    {
      title: 'Total Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Date Submitted',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'SUBMITTED') color = 'processing';
        if (status === 'ACCEPTED') color = 'success';
        if (status === 'REJECTED') color = 'error';
        if (status === 'DRAFT') color = 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">Compare</Button>
          <Button type="link">View Details</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Quotations</Title>
      </div>
      <Card className="card-shadow">
        <Table columns={columns} dataSource={mockData} />
      </Card>
    </div>
  );
};

export default Quotations;
