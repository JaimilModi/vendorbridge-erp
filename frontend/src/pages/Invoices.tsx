import React from 'react';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils';

const { Title } = Typography;

const mockData = [
  { key: '1', id: 'INV-55091', po: 'PO-2026-001', vendor: 'Global Tech Solutions', amount: 15400, status: 'SENT', dueDate: '2026-07-05T00:00:00Z' },
  { key: '2', id: 'INV-55092', po: 'PO-2026-002', vendor: 'Apex Industrial Supply', amount: 6200, status: 'PAID', dueDate: '2026-07-04T00:00:00Z' },
];

const Invoices: React.FC = () => {
  const columns = [
    { title: 'Invoice Number', dataIndex: 'id', key: 'id' },
    { title: 'PO Number', dataIndex: 'po', key: 'po' },
    { title: 'Vendor', dataIndex: 'vendor', key: 'vendor' },
    {
      title: 'Total Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate: string) => formatDate(dueDate),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'SENT') color = 'processing';
        if (status === 'PAID') color = 'success';
        if (status === 'OVERDUE') color = 'error';
        if (status === 'DRAFT') color = 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" icon={<FileTextOutlined />}>View</Button>
          <Button type="link">Mark Paid</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Invoices</Title>
      </div>
      <Card className="card-shadow">
        <Table columns={columns} dataSource={mockData} />
      </Card>
    </div>
  );
};

export default Invoices;
