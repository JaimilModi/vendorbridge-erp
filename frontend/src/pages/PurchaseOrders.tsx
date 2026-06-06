import React from 'react';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils';

const { Title } = Typography;

const mockData = [
  { key: '1', id: 'PO-2026-001', quotation: 'QT-9871', vendor: 'Global Tech Solutions', amount: 15400, status: 'ISSUED', date: '2026-06-05T00:00:00Z' },
  { key: '2', id: 'PO-2026-002', quotation: 'QT-9869', vendor: 'Apex Industrial Supply', amount: 6200, status: 'COMPLETED', date: '2026-06-04T00:00:00Z' },
];

const PurchaseOrders: React.FC = () => {
  const columns = [
    { title: 'PO Number', dataIndex: 'id', key: 'id' },
    { title: 'Quotation ID', dataIndex: 'quotation', key: 'quotation' },
    { title: 'Vendor', dataIndex: 'vendor', key: 'vendor' },
    {
      title: 'Total Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Issue Date',
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
        if (status === 'ISSUED') color = 'processing';
        if (status === 'COMPLETED') color = 'success';
        if (status === 'CANCELLED') color = 'error';
        if (status === 'DRAFT') color = 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" icon={<FilePdfOutlined />}>PDF</Button>
          <Button type="link">View Details</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Purchase Orders (PO)</Title>
      </div>
      <Card className="card-shadow">
        <Table columns={columns} dataSource={mockData} />
      </Card>
    </div>
  );
};

export default PurchaseOrders;
