import React from 'react';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import { formatCurrency, formatDate } from '../utils';

const { Title } = Typography;

const mockData = [
  { key: '1', id: 'APP-101', rfq: 'High Performance Laptops Procurement', vendor: 'Global Tech Solutions', quotationId: 'QT-9872', amount: 15400, status: 'PENDING', date: '2026-06-05T10:30:00Z' },
  { key: '2', id: 'APP-102', rfq: 'Office Furniture & Chairs', vendor: 'Apex Industrial Supply', quotationId: 'QT-9871', amount: 6200, status: 'APPROVED', date: '2026-06-04T14:20:00Z' },
];

const Approvals: React.FC = () => {
  const columns = [
    { title: 'Approval ID', dataIndex: 'id', key: 'id' },
    { title: 'Quotation ID', dataIndex: 'quotationId', key: 'quotationId' },
    { title: 'RFQ', dataIndex: 'rfq', key: 'rfq' },
    { title: 'Vendor', dataIndex: 'vendor', key: 'vendor' },
    {
      title: 'Total Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Request Date',
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
        if (status === 'PENDING') color = 'processing';
        if (status === 'APPROVED') color = 'success';
        if (status === 'REJECTED') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          {record.status === 'PENDING' ? (
            <>
              <Button type="primary" size="small" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Approve</Button>
              <Button type="primary" size="small" danger>Reject</Button>
            </>
          ) : (
            <Button type="link" size="small">View Log</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Approval Workflow</Title>
      </div>
      <Card className="card-shadow">
        <Table columns={columns} dataSource={mockData} />
      </Card>
    </div>
  );
};

export default Approvals;
