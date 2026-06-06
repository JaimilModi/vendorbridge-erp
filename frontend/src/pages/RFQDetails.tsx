import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Table, Tag, Typography, Spin, Space, message } from 'antd';
import { ArrowLeftOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../services/api';
import { RFQ, RFQItem, Quotation } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph } = Typography;

export const RFQDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOfficer = user?.role === 'PROCUREMENT_OFFICER';

  useEffect(() => {
    const fetchRFQDetails = async () => {
      try {
        const response = await api.get(`/rfqs/${id}`);
        setRfq(response.data);
      } catch (error: any) {
        message.error(error.response?.data?.message || 'Failed to fetch RFQ details');
        navigate('/rfqs');
      } finally {
        setLoading(false);
      }
    };

    fetchRFQDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 24 }}>
        <Paragraph>RFQ not found or access denied.</Paragraph>
        <Button type="primary" onClick={() => navigate('/rfqs')}>Back to RFQs</Button>
      </Card>
    );
  }

  const itemColumns = [
    { title: 'Product Name', dataIndex: 'productName', key: 'productName' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (desc: string) => desc || '-' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'UOM', dataIndex: 'uom', key: 'uom' },
  ];

  const quotationColumns = [
    { title: 'Quotation ID', dataIndex: 'id', key: 'id', render: (val: string) => val.substring(0, 8).toUpperCase() },
    { title: 'Vendor', dataIndex: ['vendor', 'name'], key: 'vendor' },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt: number) => formatCurrency(Number(amt)),
    },
    {
      title: 'Validity Date',
      dataIndex: 'validityDate',
      key: 'validityDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusTagColor(status)}>{status}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Quotation) => (
        <Space size="middle">
          <Button type="link" onClick={() => navigate(`/quotations/${record.id}`)}>View Bid</Button>
        </Space>
      ),
    },
  ];

  const getFilteredQuotations = () => {
    if (!rfq.quotations) return [];
    if (user?.role === 'VENDOR') {
      return rfq.quotations.filter((q: any) => q.vendorId === user.vendorId);
    }
    return rfq.quotations;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rfqs')} style={{ marginRight: 16 }} />
        <Title level={2} style={{ margin: 0 }}>RFQ Specifications</Title>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Descriptions title={rfq.title} bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="RFQ Reference ID">
            <span style={{ fontFamily: 'monospace' }}>{rfq.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusTagColor(rfq.status)}>{rfq.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Submission Deadline">
            {formatDate(rfq.deadline)}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {rfq.createdBy ? `${rfq.createdBy.firstName} ${rfq.createdBy.lastName}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {rfq.description || 'No description provided.'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Required Line Items" className="card-shadow" style={{ marginBottom: 24 }}>
        <Table
          columns={itemColumns}
          dataSource={(rfq.items || []).map((item: RFQItem) => ({ ...item, key: item.id }))}
          pagination={false}
        />
      </Card>

      {(isOfficer || user?.role === 'ADMIN' || user?.role === 'VENDOR') && (
        <Card title="Submitted Quotations / Bids" className="card-shadow">
          {getFilteredQuotations().length > 0 ? (
            <Table
              columns={quotationColumns}
              dataSource={getFilteredQuotations().map((q: any) => ({ ...q, key: q.id }))}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
              <ShopOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <Paragraph>No quotations submitted yet for this RFQ.</Paragraph>
              {user?.role === 'VENDOR' && rfq.status === 'OPEN' && (
                <Button type="primary" onClick={() => navigate('/quotations')}>Submit Quotation</Button>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default RFQDetails;
