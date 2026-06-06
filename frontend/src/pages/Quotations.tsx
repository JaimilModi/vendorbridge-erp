import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Table, Tag, Typography, Modal, Form, Input, DatePicker, Select, Popconfirm, message, Radio, Badge } from 'antd';
import { PlusOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';
import { Quotation, RFQ } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate, formatCurrency } from '../utils';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  
  // Comparison state
  const [compareRfqId, setCompareRfqId] = useState<string | null>(null);
  const [compareQuotations, setCompareQuotations] = useState<Quotation[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'compare'>('list');

  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const isVendor = user?.role === 'VENDOR';
  const isOfficer = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/quotations');
      setQuotations(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenRfqs = async () => {
    try {
      const response = await api.get('/rfqs');
      // Vendors only see OPEN RFQs from this endpoint
      setRfqs(response.data.filter((r: RFQ) => r.status === 'OPEN'));
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch RFQs');
    }
  };

  useEffect(() => {
    fetchQuotations();
    if (isVendor) {
      fetchOpenRfqs();
    }
  }, []);

  // Fetch quotations for comparison when rfq changes
  useEffect(() => {
    if (compareRfqId) {
      const filtered = quotations.filter(q => q.rfqId === compareRfqId);
      setCompareQuotations(filtered);
    } else {
      setCompareQuotations([]);
    }
  }, [compareRfqId, quotations]);

  const handleOpenSubmitModal = () => {
    setSelectedRfq(null);
    form.resetFields();
    setIsSubmitModalOpen(true);
  };

  const handleRfqChange = (rfqId: string) => {
    const rfq = rfqs.find(r => r.id === rfqId) || null;
    setSelectedRfq(rfq);

    // Seed the dynamic form list items
    if (rfq && rfq.items) {
      form.setFieldsValue({
        items: rfq.items.map(item => ({
          rfqItemId: item.id,
          productName: item.productName,
          quantity: item.quantity,
          uom: item.uom,
          unitPrice: 0,
          deliveryTimeline: '',
        })),
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/quotations/${id}`);
      message.success('Quotation deleted successfully');
      fetchQuotations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete quotation');
    }
  };

  const onSubmit = async (values: any) => {
    const payload = {
      rfqId: values.rfqId,
      validityDate: values.validityDate.toISOString(),
      items: values.items.map((item: any) => ({
        rfqItemId: item.rfqItemId,
        unitPrice: parseFloat(item.unitPrice),
        deliveryTimeline: item.deliveryTimeline,
      })),
    };

    try {
      await api.post('/quotations', payload);
      message.success('Quotation submitted successfully');
      setIsSubmitModalOpen(false);
      fetchQuotations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit quotation');
    }
  };

  // Watch unit prices to compute total in real time
  const [formItems, setFormItems] = useState<any[]>([]);
  const watchValues = Form.useWatch('items', form);

  useEffect(() => {
    if (watchValues) {
      setFormItems(watchValues);
    }
  }, [watchValues]);

  const calculateGrandTotal = () => {
    if (!formItems || formItems.length === 0) return 0;
    return formItems.reduce((acc, curr) => {
      const price = parseFloat(curr?.unitPrice) || 0;
      const qty = parseInt(curr?.quantity) || 0;
      return acc + price * qty;
    }, 0);
  };

  const columns = [
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
      sorter: (a: Quotation, b: Quotation) => (a.rfq?.title || '').localeCompare(b.rfq?.title || ''),
    },
    {
      title: 'Vendor Name',
      dataIndex: ['vendor', 'name'],
      key: 'vendorName',
      sorter: (a: Quotation, b: Quotation) => (a.vendor?.name || '').localeCompare(b.vendor?.name || ''),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: (a: Quotation, b: Quotation) => Number(a.totalAmount) - Number(b.totalAmount),
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
      render: (_: any, record: Quotation) => {
        const isRfqOpen = record.rfq?.status === 'OPEN';
        const canDelete = isVendor && isRfqOpen;
        return (
          <Space size="middle">
            <Button type="link" icon={<InfoCircleOutlined />} onClick={() => navigate(`/quotations/${record.id}`)}>
              Details
            </Button>
            {canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this quotation?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  // Helper to find the lowest total amount for comparison highlights
  const getLowestBidAmount = () => {
    if (compareQuotations.length === 0) return Infinity;
    return Math.min(...compareQuotations.map(q => Number(q.totalAmount)));
  };

  const lowestBidAmount = getLowestBidAmount();

  // Unique RFQs that have quotations, for the comparison filter
  const rfqsWithQuotations = Array.from(
    new Map(
      quotations
        .filter(q => q.rfq)
        .map(q => [q.rfqId, q.rfq])
    ).values()
  ) as RFQ[];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quotations & Bidding</Title>
          <Paragraph style={{ color: '#8c8c8c', margin: 0 }}>
            {isVendor 
              ? 'Submit and manage your pricing proposals for open RFQs.' 
              : 'Review, compare, and analyze vendor quotations.'}
          </Paragraph>
        </div>
        
        {isVendor && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenSubmitModal}>
            Submit Quotation
          </Button>
        )}
      </div>

      {isOfficer && (
        <Radio.Group 
          value={activeTab} 
          onChange={(e) => setActiveTab(e.target.value)} 
          style={{ marginBottom: 24 }}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="list">All Quotations</Radio.Button>
          <Radio.Button value="compare">Compare Bids</Radio.Button>
        </Radio.Group>
      )}

      {activeTab === 'list' ? (
        <Card className="card-shadow">
          <Table
            columns={columns}
            dataSource={quotations.map(q => ({ ...q, key: q.id }))}
            loading={loading}
          />
        </Card>
      ) : (
        <div>
          <Card className="card-shadow" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 'bold' }}>Select RFQ to Compare:</span>
              <Select
                placeholder="Choose an RFQ"
                style={{ width: 400 }}
                value={compareRfqId}
                onChange={setCompareRfqId}
                allowClear
              >
                {rfqsWithQuotations.map(r => (
                  <Option key={r.id} value={r.id}>
                    {r.title} ({r.status})
                  </Option>
                ))}
              </Select>
            </div>
          </Card>

          {compareRfqId && compareQuotations.length > 0 ? (
            <Card title="Quotation Comparison Grid" className="card-shadow">
              <Table
                pagination={false}
                bordered
                dataSource={compareQuotations.map(q => ({ ...q, key: q.id }))}
                columns={[
                  {
                    title: 'Vendor',
                    dataIndex: ['vendor', 'name'],
                    key: 'vendor',
                    render: (name: string, q: Quotation) => (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{name}</div>
                        <span style={{ fontSize: 12, color: '#8c8c8c', fontFamily: 'monospace' }}>
                          ID: {q.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    ),
                  },
                  {
                    title: 'Total Amount',
                    dataIndex: 'totalAmount',
                    key: 'totalAmount',
                    render: (amt: number) => {
                      const isLowest = Number(amt) === lowestBidAmount;
                      return (
                        <div style={{ padding: '4px', backgroundColor: isLowest ? '#f6ffed' : 'transparent', borderRadius: '4px' }}>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: isLowest ? '#52c41a' : '#1677ff', 
                            fontSize: 16 
                          }}>
                            {formatCurrency(Number(amt))}
                          </span>
                          {isLowest && (
                            <Badge status="success" text="Lowest Bid" style={{ marginLeft: 8 }} />
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    title: 'Delivery Timelines (Items Summary)',
                    key: 'timeline',
                    render: (_: any, q: Quotation) => {
                      const timelines = q.items?.map(i => {
                        const productName = i.rfqItem?.productName || q.rfq?.items?.find(ri => ri.id === i.rfqItemId)?.productName || 'Line Item';
                        return `${productName}: ${i.deliveryTimeline || 'N/A'}`;
                      }) || [];
                      return (
                        <ul style={{ paddingLeft: 16, margin: 0 }}>
                          {timelines.map((t, idx) => (
                            <li key={idx} style={{ fontSize: 13 }}>{t}</li>
                          ))}
                        </ul>
                      );
                    },
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => <Tag color={getStatusTagColor(status)}>{status}</Tag>,
                  },
                  {
                    title: 'Validity',
                    dataIndex: 'validityDate',
                    key: 'validity',
                    render: (date: string) => formatDate(date),
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_: any, q: Quotation) => (
                      <Button type="primary" ghost size="small" onClick={() => navigate(`/quotations/${q.id}`)}>
                        View Full Quotation
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          ) : (
            compareRfqId && (
              <Card className="card-shadow" style={{ textAlign: 'center', padding: '40px 0' }}>
                <Paragraph>No quotations submitted for this RFQ yet.</Paragraph>
              </Card>
            )
          )}
        </div>
      )}

      {/* Submit Quotation Modal */}
      <Modal
        title="Submit New Quotation"
        open={isSubmitModalOpen}
        onCancel={() => setIsSubmitModalOpen(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          style={{ marginTop: 16 }}
          preserve={false}
        >
          <Form.Item
            name="rfqId"
            label="Select RFQ"
            rules={[{ required: true, message: 'Please select an RFQ!' }]}
          >
            <Select placeholder="Choose an Open RFQ to bid on" onChange={handleRfqChange}>
              {rfqs.map(r => (
                <Option key={r.id} value={r.id}>
                  {r.title} (Deadline: {formatDate(r.deadline)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedRfq && (
            <>
              <Form.Item
                name="validityDate"
                label="Quotation Validity Date"
                rules={[{ required: true, message: 'Please pick a validity date!' }]}
              >
                <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
              </Form.Item>

              <Title level={5} style={{ marginTop: 16 }}>RFQ Line Items Bidding</Title>
              <Paragraph style={{ fontSize: 13, color: '#8c8c8c' }}>
                Provide unit prices and delivery timelines for all requested items.
              </Paragraph>

              <Form.List name="items">
                {(fields) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => {
                      const item = form.getFieldValue(['items', name]);
                      return (
                        <div key={key} style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '6px', marginBottom: 12, backgroundColor: '#fafafa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 'bold', fontSize: 14 }}>{item?.productName}</span>
                            <span style={{ color: '#8c8c8c' }}>
                              Quantity Required: {item?.quantity} {item?.uom}
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
                              label="Unit Price ($)"
                              style={{ flex: 1, marginBottom: 0 }}
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <Input type="number" min={0.01} step={0.01} placeholder="0.00" />
                            </Form.Item>
                            
                            <Form.Item
                              {...restField}
                              name={[name, 'deliveryTimeline']}
                              label="Delivery Timeline"
                              style={{ flex: 1, marginBottom: 0 }}
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <Input placeholder="e.g. 3 days, 1 week" />
                            </Form.Item>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </Form.List>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Calculated Grand Total:</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>
                  {formatCurrency(calculateGrandTotal())}
                </Text>
              </div>
            </>
          )}

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" disabled={!selectedRfq}>
                Submit Quotation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Quotations;
