'use client';

import { Layout, Menu, Button, Typography, message, Avatar, Modal, Descriptions, Tooltip } from 'antd';
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
  IdcardOutlined,
  LoginOutlined,
  SettingOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdminAuth } from '@/context/AdminAuthContext';

const { Sider } = Layout;
const { Text } = Typography;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, signOut, getAuthHeader } = useAuth();
  const { admin, isLoading: adminLoading, signOut: adminSignOut } = useAdminAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      message.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      message.error('Failed to copy');
    }
  };

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

  // Check if we're on an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const isUserLoginPage = pathname === '/login';

  // Don't render sidebar on login pages
  if (isAdminLoginPage || isUserLoginPage) {
    return null;
  }

  const adminMenuItems = [
    {
      key: 'admin-group',
      type: 'group' as const,
      label: (
        <span style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
          ADMIN
        </span>
      ),
      children: [
        {
          key: '/admin/bonds',
          icon: <BankOutlined />,
          label: 'Manage Bonds',
        },
        {
          key: '/admin/assets',
          icon: <GoldOutlined />,
          label: 'Manage Real Assets',
        },
        {
          key: '/admin/charities',
          icon: <TeamOutlined />,
          label: 'Manage Charities',
        },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'user-group',
      type: 'group' as const,
      label: (
        <span style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
          MARKETPLACE
        </span>
      ),
      children: [
        {
          key: '/bond-marketplace',
          icon: <DollarOutlined />,
          label: 'Bond Marketplace',
        },
        {
          key: '/asset-marketplace',
          icon: <ShopOutlined />,
          label: 'Asset Marketplace',
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
      ],
    },
  ];

  // Determine which menu items to show
  const getMenuItems = () => {
    if (isAdminRoute) {
      // On admin routes, show only admin menu (no Home)
      return [...adminMenuItems];
    } else if (user) {
      // Logged in user, show only marketplace menu
      return [
        {
          key: '/',
          icon: <HomeOutlined />,
          label: 'Home',
        },
        ...userMenuItems,
      ];
    } else {
      // Not logged in, show both (so they can navigate to admin)
      return [
        {
          key: '/',
          icon: <HomeOutlined />,
          label: 'Home',
        },
        ...adminMenuItems,
        ...userMenuItems,
      ];
    }
  };

  return (
    <Sider
      width={240}
      theme="light"
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        background: isAdminRoute ? '#1a1a2e' : '#fafafa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo/Brand Section */}
      <div style={{
        padding: '24px 20px',
        borderBottom: isAdminRoute ? '1px solid #2d2d44' : '1px solid #e8e8e8',
        marginBottom: '8px',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: isAdminRoute ? '#fff' : '#1890ff',
          letterSpacing: '0.5px',
        }}>
          {isAdminRoute ? 'Admin Portal' : 'Halal Chain'}
        </h2>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={handleMenuClick}
        theme={isAdminRoute ? 'dark' : 'light'}
        style={{
          border: 'none',
          background: 'transparent',
          flex: 1,
        }}
        items={getMenuItems()}
      />

      {/* Admin Section - Show on admin routes */}
      {isAdminRoute && !isAdminLoginPage && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #2d2d44',
          background: '#1a1a2e',
        }}>
          {adminLoading ? (
            <div style={{ textAlign: 'center', padding: 8, color: '#fff' }}>Loading...</div>
          ) : admin ? (
            <div>
              {/* Admin Profile Card */}
              <div style={{
                background: '#2d2d44',
                borderRadius: 8,
                padding: '12px',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar
                    size={40}
                    icon={<SettingOutlined />}
                    style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text
                      strong
                      ellipsis
                      style={{ color: '#fff', fontSize: 13, display: 'block' }}
                    >
                      {admin.email}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 10,
                        display: 'block',
                      }}
                    >
                      Administrator
                    </Text>
                  </div>
                </div>
              </div>

              {/* Admin Logout Button */}
              <Button
                type="default"
                icon={<LogoutOutlined />}
                onClick={adminSignOut}
                block
                style={{ borderColor: '#2d2d44', color: '#fff', background: 'transparent' }}
              >
                Sign Out
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* User Section at Bottom - Hidden on admin routes */}
      {!isAdminRoute && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e8e8e8',
          background: '#fff',
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 8 }}>Loading...</div>
          ) : user ? (
            <div>
              {/* User Profile Card - Clickable */}
              <div
                onClick={() => setIsProfileModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 8,
                  padding: '12px',
                  marginBottom: 12,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar
                    size={40}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text
                      strong
                      ellipsis
                      style={{ color: '#fff', fontSize: 13, display: 'block' }}
                    >
                      {user.email}
                    </Text>
                    {user.did && (
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.75)',
                          fontSize: 10,
                          fontFamily: 'monospace',
                          display: 'block',
                        }}
                        ellipsis
                      >
                        {user.did.slice(0, 20)}...
                      </Text>
                    )}
                  </div>
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 8, display: 'block' }}>
                  Click to view profile
                </Text>
              </div>

              {/* Logout Button */}
              <Button
                type="default"
                icon={<LogoutOutlined />}
                onClick={signOut}
                block
                style={{ borderColor: '#d9d9d9' }}
              >
                Sign Out
              </Button>

              {/* User Profile Modal */}
              <Modal
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#667eea' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>User Profile</div>
                      <div style={{ fontWeight: 400, fontSize: 12, color: '#666' }}>Your account details</div>
                    </div>
                  </div>
                }
                open={isProfileModalOpen}
                onCancel={() => setIsProfileModalOpen(false)}
                footer={null}
                width={500}
              >
                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  style={{ marginTop: 24 }}
                  labelStyle={{ fontWeight: 600, width: 140 }}
                >
                  <Descriptions.Item label="Email">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text>{user.email}</Text>
                      <Tooltip title={copiedField === 'email' ? 'Copied!' : 'Copy'}>
                        <Button
                          type="text"
                          size="small"
                          icon={copiedField === 'email' ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                          onClick={() => handleCopyToClipboard(user.email, 'email')}
                        />
                      </Tooltip>
                    </div>
                  </Descriptions.Item>

                  {user.did && (
                    <Descriptions.Item label="DID">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                          style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}
                        >
                          {user.did}
                        </Text>
                        <Tooltip title={copiedField === 'did' ? 'Copied!' : 'Copy DID'}>
                          <Button
                            type="text"
                            size="small"
                            icon={copiedField === 'did' ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                            onClick={() => handleCopyToClipboard(user.did!, 'did')}
                          />
                        </Tooltip>
                      </div>
                    </Descriptions.Item>
                  )}

                  <Descriptions.Item label="Wallet Address">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text
                        style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}
                      >
                        {user.walletAddress}
                      </Text>
                      <Tooltip title={copiedField === 'wallet' ? 'Copied!' : 'Copy Address'}>
                        <Button
                          type="text"
                          size="small"
                          icon={copiedField === 'wallet' ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                          onClick={() => handleCopyToClipboard(user.walletAddress, 'wallet')}
                        />
                      </Tooltip>
                    </div>
                  </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <Button
                    type="primary"
                    icon={<WalletOutlined />}
                    onClick={() => {
                      handleOpenWallet();
                      setIsProfileModalOpen(false);
                    }}
                    style={{ flex: 1 }}
                  >
                    View Wallet on Explorer
                  </Button>
                </div>
              </Modal>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
                Sign in to access marketplace features
              </Text>
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => router.push('/login')}
                block
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      )}
    </Sider>
  );
}
