import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Table, Tag, Typography, Spin, Space, Popconfirm, Modal, Form, Input, DatePicker, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Quotation, QuotationItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph } = Typography;

const QuotationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const fetchQuotationDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/quotations/${id}`);
      setQuotation(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch quotation details');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationDetails();
  }, [id]);

  const handleApprovalAction = async (status: 'APPROVED' | 'REJECTED') => {
    setSubmittingApproval(true);
    try {
      await api.post('/approvals', {
        quotationId: id,
        status,
        remarks: remarks.trim() || undefined,
      });
      message.success(`Quotation ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      setRemarks('');
      fetchQuotationDetails();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit approval decision');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const isOwner = user?.role === 'VENDOR' && quotation?.vendorId === user?.vendorId;
  const isRfqOpen = quotation?.rfq?.status === 'OPEN';
  const canEditOrDelete = isOwner && isRfqOpen;

  const handleEdit = () => {
    if (!quotation) return;
    form.setFieldsValue({
      validityDate: dayjs(quotation.validityDate),
      items: quotation.items?.map(item => ({
        rfqItemId: item.rfqItemId,
        productName: item.rfqItem?.productName || 'Line Item',
        quantity: item.rfqItem?.quantity || 1,
        uom: item.rfqItem?.uom || 'pcs',
        unitPrice: item.unitPrice,
        deliveryTimeline: item.deliveryTimeline || '',
      })) || [],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/quotations/${id}`);
      message.success('Quotation deleted successfully');
      navigate('/quotations');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete quotation');
    }
  };

  const onFinish = async (values: any) => {
    const payload = {
      validityDate: values.validityDate.toISOString(),
      items: values.items.map((item: any) => ({
        rfqItemId: item.rfqItemId,
        unitPrice: parseFloat(item.unitPrice),
        deliveryTimeline: item.deliveryTimeline,
      })),
    };

    try {
      await api.put(`/quotations/${id}`, payload);
      message.success('Quotation updated successfully');
      setIsEditModalOpen(false);
      fetchQuotationDetails();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update quotation');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 24 }}>
        <Paragraph>Quotation not found or access denied.</Paragraph>
        <Button type="primary" onClick={() => navigate('/quotations')}>Back to Quotations</Button>
      </Card>
    );
  }

  const columns = [
    {
      title: 'Product Name',
      dataIndex: ['rfqItem', 'productName'],
      key: 'productName',
      render: (val: string, record: QuotationItem) => val || record.rfqItem?.productName || 'Line Item',
    },
    {
      title: 'Description',
      dataIndex: ['rfqItem', 'description'],
      key: 'description',
      render: (val: string) => val || '-',
    },
    {
      title: 'Quantity',
      dataIndex: ['rfqItem', 'quantity'],
      key: 'quantity',
    },
    {
      title: 'UOM',
      dataIndex: ['rfqItem', 'uom'],
      key: 'uom',
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
    {
      title: 'Delivery Timeline',
      dataIndex: 'deliveryTimeline',
      key: 'deliveryTimeline',
      render: (val: string) => val || '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginRight: 16 }} />
          <Title level={2} style={{ margin: 0 }}>Quotation Details</Title>
        </div>
        {canEditOrDelete && (
          <Space>
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              Edit Quotation
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this quotation?"
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Descriptions title={`Quotation Reference: ${quotation.id.substring(0, 8).toUpperCase()}`} bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Quotation UUID">
            <span style={{ fontFamily: 'monospace' }}>{quotation.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusTagColor(quotation.status)}>{quotation.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Associated RFQ">
            <Button type="link" onClick={() => navigate(`/rfqs/${quotation.rfqId}`)} style={{ padding: 0, height: 'auto' }}>
              {quotation.rfq?.title || 'View RFQ'}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Vendor">
            {quotation.vendor?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Validity Date">
            {formatDate(quotation.validityDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1677ff' }}>
              {formatCurrency(Number(quotation.totalAmount))}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Quotation Items" className="card-shadow">
        <Table
          columns={columns}
          dataSource={(quotation.items || []).map(item => ({ ...item, key: item.id }))}
          pagination={false}
        />
      </Card>

      {/* Manager Action Panel */}
      {user?.role === 'MANAGER' && quotation.status === 'SUBMITTED' && (
        <Card title="Quotation Approval Review" className="card-shadow" style={{ marginTop: 24 }}>
          <Paragraph>As a Manager, you can review and decide on this quotation proposal.</Paragraph>
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>Review Comments / Remarks:</Typography.Text>
            <Input.TextArea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide reasons, approval conditions, or feedback..."
              style={{ marginTop: 8 }}
            />
          </div>
          <Space>
            <Button
              type="primary"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleApprovalAction('APPROVED')}
              loading={submittingApproval}
            >
              Approve Quotation
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => handleApprovalAction('REJECTED')}
              loading={submittingApproval}
            >
              Reject Quotation
            </Button>
          </Space>
        </Card>
      )}

      {/* Approval History Logs */}
      {quotation.approvals && quotation.approvals.length > 0 && (
        <Card title="Approval Log History" className="card-shadow" style={{ marginTop: 24 }}>
          <Table
            pagination={false}
            dataSource={quotation.approvals.map((app: any) => ({ ...app, key: app.id }))}
            columns={[
              {
                title: 'Reviewer',
                dataIndex: 'approvedBy',
                key: 'reviewer',
                render: (approvedBy: any) => approvedBy ? `${approvedBy.firstName} ${approvedBy.lastName}` : 'System',
              },
              {
                title: 'Decision',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => <Tag color={getStatusTagColor(status)}>{status}</Tag>,
              },
              {
                title: 'Remarks / Comments',
                dataIndex: 'remarks',
                key: 'remarks',
                render: (val: string) => val || <span style={{ color: '#bfbfbf' }}>No remarks provided.</span>,
              },
              {
                title: 'Date Processed',
                dataIndex: 'createdAt',
                key: 'date',
                render: (date: string) => formatDate(date) + ' ' + new Date(date).toLocaleTimeString(),
              },
            ]}
          />
        </Card>
      )}

      {/* Edit Quotation Modal */}
      <Modal
        title="Edit Quotation Details"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ marginTop: 16 }}
          preserve={false}
        >
          <Form.Item
            name="validityDate"
            label="Quotation Validity Date"
            rules={[{ required: true, message: 'Please pick a validity date!' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
          </Form.Item>

          <Title level={5}>Quotation Prices & Timelines</Title>
          <Form.List name="items">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  const item = form.getFieldValue(['items', name]);
                  return (
                    <div key={key} style={{ padding: '12px', border: '1px solid #f0f0f0', borderRadius: '4px', marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 'bold' }}>{item?.productName}</span>
                        <span style={{ color: '#8c8c8c' }}>
                          Qty: {item?.quantity} {item?.uom}
                        </span>
                      </div>
                      <Form.Item
                        {...restField}
                        name={[name, 'rfqItemId']}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitPrice']}
                          label="Unit Price"
                          style={{ flex: 1, marginBottom: 0 }}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input type="number" min={0.01} step={0.01} placeholder="Unit Price ($)" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'deliveryTimeline']}
                          label="Delivery Timeline"
                          style={{ flex: 1, marginBottom: 0 }}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input placeholder="e.g. 5 days, 1 week" />
                        </Form.Item>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </Form.List>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuotationDetails;
