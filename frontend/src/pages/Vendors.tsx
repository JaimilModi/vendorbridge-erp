import React from 'react';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const mockData = [
  { key: '1', id: 'V-001', name: 'Global Tech Solutions', email: 'contact@globaltech.com', status: 'ACTIVE', phone: '+1-555-0199' },
  { key: '2', id: 'V-002', name: 'Apex Industrial Supply', email: 'sales@apexsupply.com', status: 'INACTIVE', phone: '+1-555-0142' },
  { key: '3', id: 'V-003', name: 'Prime Logistics Corp', email: 'info@primelogistics.com', status: 'BLOCKED', phone: '+1-555-0177' },
];

const Vendors: React.FC = () => {
  const columns = [
    { title: 'Vendor ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'ACTIVE') color = 'success';
        if (status === 'INACTIVE') color = 'warning';
        if (status === 'BLOCKED') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">Edit</Button>
          <Button type="link" danger>Deactivate</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Vendor Management</Title>
        <Button type="primary" icon={<PlusOutlined />}>Add Vendor</Button>
      </div>
      <Card className="card-shadow">
        <Table columns={columns} dataSource={mockData} />
      </Card>
    </div>
  );
};

export default Vendors;
