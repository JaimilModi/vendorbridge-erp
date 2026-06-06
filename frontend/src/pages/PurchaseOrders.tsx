import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Tag, Typography, Tabs, message } from 'antd';
import { PlusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph, Text } = Typography;

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState<any[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const isOfficer = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';

  const fetchPurchaseOrders = async () => {
    setPoLoading(true);
    try {
      const response = await api.get('/purchase-orders');
      setPurchaseOrders(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch Purchase Orders');
    } finally {
      setPoLoading(false);
    }
  };

  const fetchAcceptedQuotations = async () => {
    if (!isOfficer) return;
    setQuoteLoading(true);
    try {
      const response = await api.get('/quotations');
      // Filter quotations that are ACCEPTED and don't have a generated Purchase Order
      const filtered = response.data.filter(
        (q: any) => q.status === 'ACCEPTED' && (!q.purchaseOrders || q.purchaseOrders.length === 0)
      );
      setAcceptedQuotations(filtered);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch accepted quotations');
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchAcceptedQuotations();
  }, [user]);

  const handleGeneratePO = async (quotationId: string) => {
    setGeneratingId(quotationId);
    try {
      const response = await api.post(`/purchase-orders/generate/${quotationId}`);
      message.success(`Purchase Order generated successfully with number ${response.data.poNumber}`);
      fetchPurchaseOrders();
      fetchAcceptedQuotations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to generate Purchase Order');
    } finally {
      setGeneratingId(null);
    }
  };

  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Quotation ID',
      dataIndex: 'quotationId',
      key: 'quotationId',
      render: (id: string) => <Text style={{ fontFamily: 'monospace' }}>{id.substring(0, 8).toUpperCase()}</Text>,
    },
    {
      title: 'RFQ Title',
      dataIndex: ['quotation', 'rfq', 'title'],
      key: 'rfqTitle',
      render: (val: string) => val || '-',
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      key: 'vendorName',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt: number) => formatCurrency(Number(amt)),
    },
    {
      title: 'Date Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          icon={<InfoCircleOutlined />} 
          onClick={() => navigate(`/purchase-orders/${record.id}`)}
        >
          Details
        </Button>
      ),
    },
  ];

  const quotationColumns = [
    {
      title: 'Quotation ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text style={{ fontFamily: 'monospace' }}>{id.substring(0, 8).toUpperCase()}</Text>,
    },
    {
      title: 'RFQ Title',
      dataIndex: ['rfq', 'title'],
      key: 'rfqTitle',
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      key: 'vendorName',
    },
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
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          ghost
          icon={<PlusCircleOutlined />} 
          onClick={() => handleGeneratePO(record.id)}
          loading={generatingId === record.id}
        >
          Generate PO
        </Button>
      ),
    },
  ];

  const items = [];

  items.push({
    key: 'active-pos',
    label: `Active Purchase Orders (${purchaseOrders.length})`,
    children: (
      <Table
        columns={poColumns}
        dataSource={purchaseOrders.map(po => ({ ...po, key: po.id }))}
        loading={poLoading}
      />
    ),
  });

  if (isOfficer) {
    items.push({
      key: 'generate-po',
      label: `Awaiting PO Generation (${acceptedQuotations.length})`,
      children: (
        <Table
          columns={quotationColumns}
          dataSource={acceptedQuotations.map(q => ({ ...q, key: q.id }))}
          loading={quoteLoading}
        />
      ),
    });
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Purchase Orders (PO)</Title>
        <Paragraph style={{ color: '#8c8c8c', margin: 0 }}>
          {isOfficer 
            ? 'Generate, issue, and track purchase orders from accepted quotations.' 
            : 'Track status and details of issued purchase orders.'}
        </Paragraph>
      </div>

      <Card className="card-shadow">
        {isOfficer ? (
          <Tabs defaultActiveKey="active-pos" items={items} />
        ) : (
          <Table
            columns={poColumns}
            dataSource={purchaseOrders.map(po => ({ ...po, key: po.id }))}
            loading={poLoading}
          />
        )}
      </Card>
    </div>
  );
};

export default PurchaseOrders;
