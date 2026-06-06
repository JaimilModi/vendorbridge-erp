import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Table, Tag, Typography, Modal, Form, Input, Select, DatePicker, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';
import { RFQ } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStatusTagColor, formatDate } from '../utils';

const { Title } = Typography;
const { Option } = Select;

export const RFQs: React.FC = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRfq, setEditingRfq] = useState<RFQ | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const isOfficer = user?.role === 'PROCUREMENT_OFFICER';

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rfqs');
      setRfqs(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch RFQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleAdd = () => {
    setEditingRfq(null);
    form.resetFields();
    form.setFieldsValue({ items: [{ productName: '', quantity: 1, uom: 'Pcs' }] });
    setIsModalOpen(true);
  };

  const handleEdit = (record: RFQ) => {
    setEditingRfq(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      status: record.status,
      deadline: dayjs(record.deadline),
      items: record.items || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/rfqs/${id}`);
      message.success('RFQ deleted successfully');
      fetchRfqs();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete RFQ');
    }
  };

  const onFinish = async (values: any) => {
    const payload = {
      ...values,
      deadline: values.deadline.toISOString(),
      items: values.items.map((item: any) => ({
        ...item,
        quantity: parseInt(item.quantity, 10),
      })),
    };

    try {
      if (editingRfq) {
        await api.put(`/rfqs/${editingRfq.id}`, payload);
        message.success('RFQ updated successfully');
      } else {
        await api.post('/rfqs', payload);
        message.success('RFQ created successfully');
      }
      setIsModalOpen(false);
      fetchRfqs();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save RFQ');
    }
  };

  const columns = [
    {
      title: 'RFQ Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: RFQ, b: RFQ) => a.title.localeCompare(b.title),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy: any) => createdBy ? `${createdBy.firstName} ${createdBy.lastName}` : '-',
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => formatDate(deadline),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusTagColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: RFQ) => (
        <Space size="middle">
          <Button type="link" icon={<InfoCircleOutlined />} onClick={() => navigate(`/rfqs/${record.id}`)}>
            Details
          </Button>
          {isOfficer && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Edit
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this RFQ?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Request for Quotations (RFQs)</Title>
        {isOfficer && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Create RFQ
          </Button>
        )}
      </div>

      <Card className="card-shadow">
        <Table
          columns={columns}
          dataSource={rfqs.map(r => ({ ...r, key: r.id }))}
          loading={loading}
        />
      </Card>

      <Modal
        title={editingRfq ? 'Edit RFQ Specifications' : 'Issue New RFQ'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: 'DRAFT' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="RFQ Title"
            rules={[{ required: true, message: 'Please input RFQ title!' }]}
          >
            <Input placeholder="High Performance Laptops Procurement" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Specifications / Requirements Description"
          >
            <Input.TextArea placeholder="Enter any extra details or terms here..." autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="deadline"
              label="Submission Deadline"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Please pick a deadline!' }]}
            >
              <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Please select status!' }]}
            >
              <Select>
                <Option value="DRAFT">Draft</Option>
                <Option value="OPEN">Open</Option>
                <Option value="CLOSED">Closed</Option>
                <Option value="AWARDED">Awarded</Option>
              </Select>
            </Form.Item>
          </div>

          <Title level={5} style={{ marginTop: 16 }}>RFQ Line Items</Title>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, width: '100%' }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'productName']}
                      style={{ width: 180, marginBottom: 0 }}
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="Product Name" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      style={{ width: 200, marginBottom: 0 }}
                    >
                      <Input placeholder="Description" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      style={{ width: 100, marginBottom: 0 }}
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input type="number" placeholder="Qty" min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'uom']}
                      style={{ width: 100, marginBottom: 0 }}
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="UOM" />
                    </Form.Item>

                    {fields.length > 1 && (
                      <Button type="link" danger onClick={() => remove(name)}>
                        Remove
                      </Button>
                    )}
                  </Space>
                ))}
                <Form.Item style={{ marginTop: 12 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Line Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingRfq ? 'Save Changes' : 'Issue RFQ'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RFQs;
