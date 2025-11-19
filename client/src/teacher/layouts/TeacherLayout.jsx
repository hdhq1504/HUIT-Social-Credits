import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import { BookOutlined, UserOutlined, LogoutOutlined, DashboardOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/teacher',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/teacher'),
    },
    {
      key: '/teacher/classes',
      icon: <BookOutlined />,
      label: 'Lớp chủ nhiệm',
      onClick: () => navigate('/teacher/classes'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/teacher/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Tìm menu key dựa trên pathname
  const getSelectedKey = () => {
    if (location.pathname === '/teacher') return '/teacher';
    if (location.pathname.startsWith('/teacher/classes')) return '/teacher/classes';
    return '/teacher';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'GV' : 'Giảng viên'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[getSelectedKey()]} items={menuItems} />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Text strong style={{ fontSize: 18 }}>
            Hệ thống quản lý điểm rèn luyện
          </Text>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.hoTen}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
