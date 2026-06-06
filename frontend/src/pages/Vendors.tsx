import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Table, Tag, Typography, Modal, Form, Input, Select, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { Vendor } from '../types';
import { getStatusTagColor } from '../utils';

const { Title } = Typography;
const { Option } = Select;

export const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form] = Form.useForm();

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendors');
      setVendors(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAdd = () => {
    setEditingVendor(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Vendor) => {
    setEditingVendor(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/vendors/${id}`);
      message.success('Vendor deleted successfully');
      fetchVendors();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const onFinish = async (values: any) => {
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.id}`, values);
        message.success('Vendor updated successfully');
      } else {
        await api.post('/vendors', values);
        message.success('Vendor created successfully');
      }
      setIsModalOpen(false);
      fetchVendors();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save vendor');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Vendor, b: Vendor) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'GST Number',
      dataIndex: 'gstNumber',
      key: 'gstNumber',
      render: (gst: string) => gst || '-',
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
      render: (_: any, record: Vendor) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this vendor?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Vendor Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Vendor
        </Button>
      </div>

      <Card className="card-shadow">
        <Table
          columns={columns}
          dataSource={vendors.map(v => ({ ...v, key: v.id }))}
          loading={loading}
        />
      </Card>

      <Modal
        title={editingVendor ? 'Edit Vendor Details' : 'Register New Vendor'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: 'ACTIVE' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Company Name"
            rules={[{ required: true, message: 'Please input company name!' }]}
          >
            <Input placeholder="Acme Ltd" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please input email address!' },
              { type: 'email', message: 'Please enter a valid email address!' },
            ]}
          >
            <Input placeholder="contact@acme.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
          >
            <Input placeholder="+1 (555) 019-2834" />
          </Form.Item>

          <Form.Item
            name="gstNumber"
            label="GST Number"
          >
            <Input placeholder="29GGGGG1314R9Z6" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea placeholder="123 Industrial Park, Block B" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status!' }]}
          >
            <Select>
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="BLOCKED">Blocked</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingVendor ? 'Save Changes' : 'Register'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Vendors;
