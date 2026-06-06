import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Tag, Typography, message, Tabs } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined, ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph, Text } = Typography;

const Approvals: React.FC = () => {
  const [pendingQuotations, setPendingQuotations] = useState<any[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const fetchPendingQuotations = async () => {
    if (!isManager) return;
    setPendingLoading(true);
    try {
      const response = await api.get('/quotations');
      setPendingQuotations(response.data.filter((q: any) => q.status === 'SUBMITTED'));
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch pending quotations');
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get('/approvals');
      setApprovalHistory(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch approval logs');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQuotations();
    fetchApprovalHistory();
  }, [user]);

  const pendingColumns = [
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
          icon={<CheckCircleOutlined />} 
          onClick={() => navigate(`/quotations/${record.id}`)}
        >
          Review Bid
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Quotation ID',
      dataIndex: ['quotation', 'id'],
      key: 'quotationId',
      render: (id: string) => <Text style={{ fontFamily: 'monospace' }}>{id ? id.substring(0, 8).toUpperCase() : '-'}</Text>,
    },
    {
      title: 'RFQ Title',
      dataIndex: ['quotation', 'rfq', 'title'],
      key: 'rfqTitle',
      render: (val: string) => val || '-',
    },
    {
      title: 'Vendor',
      dataIndex: ['quotation', 'vendor', 'name'],
      key: 'vendorName',
      render: (val: string) => val || '-',
    },
    {
      title: 'Total Amount',
      dataIndex: ['quotation', 'totalAmount'],
      key: 'totalAmount',
      render: (amt: number) => amt ? formatCurrency(Number(amt)) : '-',
    },
    {
      title: 'Decision',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusTagColor(status)}>{status}</Tag>,
    },
    {
      title: 'Reviewer',
      dataIndex: 'approvedBy',
      key: 'reviewer',
      render: (approvedBy: any) => approvedBy ? `${approvedBy.firstName} ${approvedBy.lastName}` : 'System',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (val: string) => val || <span style={{ color: '#bfbfbf' }}>No remarks.</span>,
    },
    {
      title: 'Date Processed',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          icon={<InfoCircleOutlined />} 
          onClick={() => navigate(`/quotations/${record.quotationId}`)}
        >
          View Bid
        </Button>
      ),
    },
  ];

  const items = [];

  if (isManager) {
    items.push({
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined />
          Quotations Awaiting Approval ({pendingQuotations.length})
        </span>
      ),
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingQuotations.map(q => ({ ...q, key: q.id }))}
          loading={pendingLoading}
        />
      ),
    });
  }

  items.push({
    key: 'history',
    label: (
      <span>
        <HistoryOutlined />
        Approval History
      </span>
    ),
    children: (
      <Table
        columns={historyColumns}
        dataSource={approvalHistory.map(a => ({ ...a, key: a.id }))}
        loading={historyLoading}
      />
    ),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Approval Workflow</Title>
        <Paragraph style={{ color: '#8c8c8c', margin: 0 }}>
          {isManager 
            ? 'Review vendor bids, check guidelines compliance, and approve or reject submissions.' 
            : 'Track review outcomes, statuses, and remarks for quotations.'}
        </Paragraph>
      </div>

      <Card className="card-shadow">
        <Tabs defaultActiveKey={isManager ? 'pending' : 'history'} items={items} />
      </Card>
    </div>
  );
};

export default Approvals;
