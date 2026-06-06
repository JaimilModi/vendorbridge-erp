import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Tag, Typography, Tabs, message, Modal, Form, DatePicker, Segmented, Space } from 'antd';
import { PlusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph, Text } = Typography;

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [poLoading, setPoLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Invoice generation modal state
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [targetPoId, setTargetPoId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const isOfficer = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';

  const fetchInvoices = async () => {
    setInvoiceLoading(true);
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    if (!isOfficer) return;
    setPoLoading(true);
    try {
      const response = await api.get('/purchase-orders');
      // Filter POs that are ISSUED or COMPLETED, and don't have an invoice
      const filtered = response.data.filter(
        (po: any) => (po.status === 'ISSUED' || po.status === 'COMPLETED') && (!po.invoices || po.invoices.length === 0)
      );
      setPurchaseOrders(filtered);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch Purchase Orders');
    } finally {
      setPoLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPurchaseOrders();
  }, [user]);

  const handleOpenGenModal = (poId: string) => {
    setTargetPoId(poId);
    form.resetFields();
    form.setFieldsValue({ dueDate: dayjs().add(30, 'day') }); // default 30 days due
    setIsGenModalOpen(true);
  };

  const onGenerateInvoice = async (values: any) => {
    if (!targetPoId) return;
    setGenerating(true);
    try {
      const payload = {
        dueDate: values.dueDate.toISOString(),
      };
      const response = await api.post(`/invoices/generate/${targetPoId}`, payload);
      message.success(`Invoice generated successfully with number ${response.data.invoiceNumber}`);
      setIsGenModalOpen(false);
      fetchInvoices();
      fetchPurchaseOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  // Filter invoices locally by the segmented controller status
  const getFilteredInvoices = () => {
    if (selectedStatus === 'ALL') return invoices;
    return invoices.filter((inv: any) => inv.status === selectedStatus);
  };

  const invoiceColumns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'PO Number',
      dataIndex: ['po', 'poNumber'],
      key: 'poNumber',
      render: (val: string) => val || '-',
    },
    {
      title: 'RFQ Title',
      dataIndex: ['po', 'quotation', 'rfq', 'title'],
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
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
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
          onClick={() => navigate(`/invoices/${record.id}`)}
        >
          Details
        </Button>
      ),
    },
  ];

  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (val: string) => <Text strong>{val}</Text>,
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
          type="primary" 
          ghost
          icon={<PlusCircleOutlined />} 
          onClick={() => handleOpenGenModal(record.id)}
        >
          Generate Invoice
        </Button>
      ),
    },
  ];

  const items = [];

  items.push({
    key: 'invoices-list',
    label: `Invoices (${getFilteredInvoices().length})`,
    children: (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
          <Segmented
            options={[
              { label: 'All', value: 'ALL' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Sent', value: 'SENT' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Overdue', value: 'OVERDUE' },
            ]}
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val as string)}
          />
        </div>
        <Table
          columns={invoiceColumns}
          dataSource={getFilteredInvoices().map(inv => ({ ...inv, key: inv.id }))}
          loading={invoiceLoading}
        />
      </div>
    ),
  });

  if (isOfficer) {
    items.push({
      key: 'awaiting-invoice',
      label: `Awaiting Invoice Generation (${purchaseOrders.length})`,
      children: (
        <Table
          columns={poColumns}
          dataSource={purchaseOrders.map(po => ({ ...po, key: po.id }))}
          loading={poLoading}
        />
      ),
    });
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Invoices</Title>
        <Paragraph style={{ color: '#8c8c8c', margin: 0 }}>
          {isOfficer 
            ? 'Generate, issue, and manage client billings and payment statuses.' 
            : 'Review, track, and monitor billings and payment records.'}
        </Paragraph>
      </div>

      <Card className="card-shadow">
        {isOfficer ? (
          <Tabs defaultActiveKey="invoices-list" items={items} />
        ) : (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
              <Segmented
                options={[
                  { label: 'All', value: 'ALL' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Sent', value: 'SENT' },
                  { label: 'Paid', value: 'PAID' },
                  { label: 'Overdue', value: 'OVERDUE' },
                ]}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val as string)}
              />
            </div>
            <Table
              columns={invoiceColumns}
              dataSource={getFilteredInvoices().map(inv => ({ ...inv, key: inv.id }))}
              loading={invoiceLoading}
            />
          </div>
        )}
      </Card>

      {/* Generate Invoice Modal */}
      <Modal
        title="Generate Invoice"
        open={isGenModalOpen}
        onCancel={() => setIsGenModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onGenerateInvoice}
          style={{ marginTop: 16 }}
          preserve={false}
        >
          <Form.Item
            name="dueDate"
            label="Invoice Due Date"
            rules={[{ required: true, message: 'Please pick a due date!' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsGenModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={generating}>
                Generate Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Invoices;
