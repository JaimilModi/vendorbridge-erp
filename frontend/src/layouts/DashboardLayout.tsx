import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  LineChartOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
    }
  ];

const getMenuItems = () => {
  if (!user) return [];

  const dashboardKey =
    user.role === 'ADMIN'
      ? '/admin/dashboard'
      : user.role === 'PROCUREMENT_OFFICER'
      ? '/officer/dashboard'
      : user.role === 'VENDOR'
      ? '/vendor/dashboard'
      : '/manager/dashboard';

  const baseMenu = [
    {
      key: dashboardKey,
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
  ];

  // ADMIN
  if (user.role === 'ADMIN') {
    return [
      ...baseMenu,
      {
        key: '/vendors',
        icon: <TeamOutlined />,
        label: 'Vendors',
      },
      {
        key: '/reports',
        icon: <LineChartOutlined />,
        label: 'Reports',
      },
    ];
  }

  // PROCUREMENT OFFICER
  if (user.role === 'PROCUREMENT_OFFICER') {
    return [
      ...baseMenu,

      {
        key: '/vendors',
        icon: <TeamOutlined />,
        label: 'Vendors',
      },

      {
        key: '/rfqs',
        icon: <FileTextOutlined />,
        label: 'RFQs',
      },

      {
        key: '/quotations',
        icon: <SolutionOutlined />,
        label: 'Quotations',
      },

      {
        key: '/purchase-orders',
        icon: <ShoppingCartOutlined />,
        label: 'Purchase Orders',
      },

      {
        key: '/invoices',
        icon: <AuditOutlined />,
        label: 'Invoices',
      },

      {
        key: '/reports',
        icon: <LineChartOutlined />,
        label: 'Reports',
      },
    ];
  }

  // VENDOR
  if (user.role === 'VENDOR') {
    return [
      ...baseMenu,

      {
        key: '/rfqs',
        icon: <FileTextOutlined />,
        label: 'RFQs',
      },

      {
        key: '/quotations',
        icon: <SolutionOutlined />,
        label: 'Quotations',
      },

      {
        key: '/purchase-orders',
        icon: <ShoppingCartOutlined />,
        label: 'Purchase Orders',
      },

      {
        key: '/invoices',
        icon: <AuditOutlined />,
        label: 'Invoices',
      },
    ];
  }

  // MANAGER
  if (user.role === 'MANAGER') {
    return [
      ...baseMenu,

      {
        key: '/approvals',
        icon: <CheckCircleOutlined />,
        label: 'Approvals',
      },

      {
        key: '/reports',
        icon: <LineChartOutlined />,
        label: 'Reports',
      },
    ];
  }

  return baseMenu;
};

  const getRoleDisplayName = (role?: string) => {
    if (!role) return '';
    return role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <Layout className="app-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo-wrapper" style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <h1 className="logo-text" style={{ margin: 0 }}>{collapsed ? 'VB' : 'VendorBridge'}</h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={getMenuItems()}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div className="header-user-info">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <span style={{ fontWeight: 500 }}>{user?.firstName} {user?.lastName}</span>
                  <span style={{ fontSize: '11px', color: '#8c8c8c' }}>{getRoleDisplayName(user?.role)}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#ffffff', minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
