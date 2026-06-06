import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password,
      });

      const { token, user } = response.data;
      login(token, user);
      message.success('Login successful!');

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
      const errMsg = error.response?.data?.message || 'Login failed. Please try again.';
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
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1677ff', marginBottom: 4 }}>VendorBridge ERP</Title>
          <Text type="secondary">Sign in to manage your procurement lifecycle</Text>
        </div>

        <Form
          name="login_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email Address" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 6 }}>
              Log in
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Don't have an account? <Link to="/signup" style={{ color: '#1677ff', fontWeight: 500 }}>Register now</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
