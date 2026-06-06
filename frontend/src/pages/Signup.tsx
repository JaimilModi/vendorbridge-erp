import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Typography, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ShopOutlined, PhoneOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

export const Signup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('PROCUREMENT_OFFICER');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        companyName: values.companyName,
        vendorEmail: values.vendorEmail,
        phone: values.phone,
        gstNumber: values.gstNumber,
        address: values.address,
      });

      const { token, user } = response.data;
      login(token, user);
      message.success('Registration successful!');

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'PROCUREMENT_OFFICER') {
        navigate('/officer/dashboard');
      } else if (user.role === 'VENDOR') {
        navigate('/vendor/dashboard');
      } else if (user.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/login');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 16px',
    }}>
      <Card style={{ width: selectedRole === 'VENDOR' ? 650 : 450, borderRadius: 12, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)', transition: 'width 0.3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1677ff', marginBottom: 4 }}>Create Account</Title>
          <Text type="secondary">Join VendorBridge Procurement Network</Text>
        </div>

        <Form
          form={form}
          name="signup_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{ role: 'PROCUREMENT_OFFICER' }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item
              name="firstName"
              label="First Name"
              style={{ flex: 1, minWidth: 180 }}
              rules={[{ required: true, message: 'Please input your first name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="John" />
            </Form.Item>

            <Form.Item
              name="lastName"
              label="Last Name"
              style={{ flex: 1, minWidth: 180 }}
              rules={[{ required: true, message: 'Please input your last name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Doe" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="User Email Address"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="john.doe@company.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select onChange={(value) => setSelectedRole(value)}>
              <Option value="PROCUREMENT_OFFICER">Procurement Officer</Option>
              <Option value="MANAGER">Manager</Option>
              <Option value="VENDOR">Vendor</Option>
              <Option value="ADMIN">Administrator</Option>
            </Select>
          </Form.Item>

          {selectedRole === 'VENDOR' && (
            <>
              <Divider orientation="left" style={{ color: '#1677ff', borderColor: '#1677ff' }}>Vendor Details</Divider>
              
              <Form.Item
                name="companyName"
                label="Company Name"
                rules={[{ required: true, message: 'Please input your company name!' }]}
              >
                <Input prefix={<ShopOutlined />} placeholder="Acme Corporation Ltd" />
              </Form.Item>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Form.Item
                  name="vendorEmail"
                  label="Vendor Email Address"
                  style={{ flex: 1, minWidth: 180 }}
                  rules={[
                    { required: true, message: 'Please input the vendor email!' },
                    { type: 'email', message: 'Please enter a valid email address!' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="sales@acme.com" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Contact Phone"
                  style={{ flex: 1, minWidth: 180 }}
                  rules={[{ required: true, message: 'Please input the vendor contact phone!' }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="+1 (555) 019-2834" />
                </Form.Item>
              </div>

              <Form.Item
                name="gstNumber"
                label="GST Number"
                rules={[{ required: true, message: 'Please input the GST/Tax number!' }]}
              >
                <Input prefix={<SafetyCertificateOutlined />} placeholder="29GGGGG1314R9Z6" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Company Address"
                rules={[{ required: true, message: 'Please input the company address!' }]}
              >
                <Input.TextArea placeholder="123 Industrial Park, Block B, Suite 400" autoSize={{ minRows: 2, maxRows: 4 }} />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 6 }}>
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Already have an account? <Link to="/login" style={{ color: '#1677ff', fontWeight: 500 }}>Sign In</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
