import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Table, Tag, Typography, Spin, Space, Select, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import api from '../services/api';
import { Invoice } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch invoice details');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const isOfficer = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.put(`/invoices/${id}/status`, { status: newStatus });
      message.success(`Invoice status updated to ${newStatus} successfully`);
      fetchInvoiceDetails();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update invoice status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 24 }}>
        <Paragraph>Invoice not found or access denied.</Paragraph>
        <Button type="primary" onClick={() => navigate('/invoices')}>Back to Invoices</Button>
      </Card>
    );
  }

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val: string) => val || '-',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (val: number) => formatCurrency(Number(val)),
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (val: number) => formatCurrency(Number(val)),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/invoices')} style={{ marginRight: 16 }} />
          <Title level={2} style={{ margin: 0 }}>Invoice Details</Title>
        </div>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Descriptions title={`Invoice: ${invoice.invoiceNumber}`} bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Invoice Reference UUID">
            <span style={{ fontFamily: 'monospace' }}>{invoice.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusTagColor(invoice.status)}>{invoice.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Associated PO">
            <Button type="link" onClick={() => navigate(`/purchase-orders/${invoice.poId}`)} style={{ padding: 0, height: 'auto' }}>
              {invoice.po?.poNumber || 'View PO'}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="RFQ Name">
            {invoice.po?.quotation?.rfq?.title || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Vendor">
            {invoice.vendor?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">
            {formatDate(invoice.dueDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1677ff' }}>
              {formatCurrency(Number(invoice.totalAmount))}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {isOfficer && (
        <Card title="Manage Invoice Status" className="card-shadow" style={{ marginBottom: 24 }}>
          <Space>
            <span>Update Status:</span>
            <Select
              value={invoice.status}
              style={{ width: 150 }}
              onChange={handleStatusChange}
              loading={updating}
            >
              <Option value="DRAFT">Draft</Option>
              <Option value="SENT">Sent</Option>
              <Option value="PAID">Paid</Option>
              <Option value="OVERDUE">Overdue</Option>
            </Select>
          </Space>
        </Card>
      )}

      <Card title="Invoice Items" className="card-shadow">
        <Table
          columns={columns}
          dataSource={(invoice.items || []).map((item, index) => ({ ...item, key: item.id || index }))}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default InvoiceDetails;
