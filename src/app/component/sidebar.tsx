'use client';

import { Layout, Menu, Button, Space, Typography, message } from 'antd';
import {
  HomeOutlined,
  BankOutlined,
  DollarOutlined,
  UserOutlined,
  LogoutOutlined,
  WalletOutlined,
  GoldOutlined,
  ShopOutlined,
  HeartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

const { Sider } = Layout;
const { Text } = Typography;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, signOut, getAuthHeader } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleOpenWallet = async () => {
    if (!user) {
      message.error('Please sign in to view your wallet');
      return;
    }

    try {
      const res = await fetch('/api/me/wallet', {
        headers: {
          ...getAuthHeader(),
        },
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        window.open(data.explorerUrl, '_blank');
      } else {
        message.error(data.error || 'Failed to get wallet info');
      }
    } catch (error) {
      message.error('Network error');
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'wallet') {
      handleOpenWallet();
    } else {
      router.push(key);
    }
  };

  return (
    <>
      <Sider
        width={240}
        theme="light"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
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
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
            flex: 1,
          }}
          items={[
            {
              key: '/',
              icon: <HomeOutlined />,
              label: 'Home',
            },
            {
              key: '/management',
              icon: <BankOutlined />,
              label: 'Manage Bonds',
            },
            {
              key: '/token',
              icon: <DollarOutlined />,
              label: 'Bond Marketplace',
            },
            {
              key: '/asset-management',
              icon: <GoldOutlined />,
              label: 'Manage Real Assets',
            },
            {
              key: '/asset-marketplace',
              icon: <ShopOutlined />,
              label: 'Asset Marketplace',
            },
            {
              key: '/charity-management',
              icon: <TeamOutlined />,
              label: 'Manage Charities',
            },
            {
              key: '/zakat',
              icon: <HeartOutlined />,
              label: 'Zakat Donation',
            },
            ...(user ? [{
              key: 'wallet',
              icon: <WalletOutlined />,
              label: 'My Wallet',
            }] : []),
          ]}
        />

        {/* User Section at Bottom */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e8e8e8',
          background: '#fff',
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 8 }}>Loading...</div>
          ) : user ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: '#1890ff' }} />
                <Text strong ellipsis style={{ flex: 1 }}>{user.email}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WalletOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                  {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                </Text>
              </div>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={signOut}
                block
                style={{ marginTop: 8 }}
              >
                Sign Out
              </Button>
            </Space>
          ) : (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => setAuthModalOpen(true)}
              block
            >
              Sign In
            </Button>
          )}
        </div>
      </Sider>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}