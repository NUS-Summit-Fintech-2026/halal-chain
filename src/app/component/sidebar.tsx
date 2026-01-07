'use client';

import { Layout, Menu } from 'antd';
import {
  HomeOutlined, 
  BankOutlined,
  UploadOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider } = Layout;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Sider
      width={240}
      theme="light"
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        background: '#fafafa',
      }}
    >
      {/* Logo/Brand Section */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #e8e8e8',
        marginBottom: '8px',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: '#1890ff',
          letterSpacing: '0.5px',
        }}>
          Halal Chain
        </h2>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={({ key }) => router.push(key)}
        style={{
          border: 'none',
          background: 'transparent',
        }}
        items={[
          {
            key: '/bonds/home',
            icon: <HomeOutlined />,
            label: 'Home',
          },
          {
            key: '/bonds/management',
            icon: <BankOutlined />,
            label: 'Manage Bonds',
          },
          {
            key: '/bonds/token',
            icon: <DollarOutlined />,
            label: 'Bond Marketplace',
          }
        ]}
      />
    </Sider>
  );
}