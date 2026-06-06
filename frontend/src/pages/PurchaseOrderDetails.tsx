import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Table, Tag, Typography, Spin, Space, Select, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import api from '../services/api';
import { PurchaseOrder } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const PurchaseOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPODetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/purchase-orders/${id}`);
      setPo(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch Purchase Order details');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPODetails();
  }, [id]);

  const isOfficer = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.put(`/purchase-orders/${id}/status`, { status: newStatus });
      message.success(`Status updated to ${newStatus} successfully`);
      fetchPODetails();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update status');
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

  if (!po) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 24 }}>
        <Paragraph>Purchase Order not found or access denied.</Paragraph>
        <Button type="primary" onClick={() => navigate('/purchase-orders')}>Back to Purchase Orders</Button>
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase-orders')} style={{ marginRight: 16 }} />
          <Title level={2} style={{ margin: 0 }}>Purchase Order Details</Title>
        </div>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Descriptions title={`Purchase Order: ${po.poNumber}`} bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="PO Reference UUID">
            <span style={{ fontFamily: 'monospace' }}>{po.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusTagColor(po.status)}>{po.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Associated Quotation">
            <Button type="link" onClick={() => navigate(`/quotations/${po.quotationId}`)} style={{ padding: 0, height: 'auto' }}>
              QO-{po.quotationId.substring(0, 8).toUpperCase()}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="RFQ Name">
            {po.quotation?.rfq?.title || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Vendor">
            {po.vendor?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Date Created">
            {formatDate(po.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1677ff' }}>
              {formatCurrency(Number(po.totalAmount))}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {isOfficer && (
        <Card title="Manage PO Status" className="card-shadow" style={{ marginBottom: 24 }}>
          <Space>
            <span>Update Status:</span>
            <Select
              value={po.status}
              style={{ width: 150 }}
              onChange={handleStatusChange}
              loading={updating}
            >
              <Option value="DRAFT">Draft</Option>
              <Option value="ISSUED">Issued</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
          </Space>
        </Card>
      )}

      <Card title="Line Items" className="card-shadow">
        <Table
          columns={columns}
          dataSource={(po.items || []).map((item, index) => ({ ...item, key: item.id || index }))}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default PurchaseOrderDetails;
