'use client';

import { Button, message, Modal, Tooltip } from 'antd';
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
  SettingOutlined,
  CopyOutlined,
  CheckOutlined,
  BlockOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdminAuth } from '@/context/AdminAuthContext';

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
      const res = await fetch('/api/me/wallet', { headers: { ...getAuthHeader() } });
      const data = await res.json();
      if (res.ok && data.ok) {
        window.open(data.explorerUrl, '_blank');
      } else {
        message.error(data.error || 'Failed to get wallet info');
      }
    } catch {
      message.error('Network error');
    }
  };

  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const isUserLoginPage = pathname === '/login';

  if (isAdminLoginPage || isUserLoginPage || pathname === '/') return null;

  const BG = isAdminRoute ? '#0d0d1a' : '#0a0a0a';
  const BORDER = isAdminRoute ? 'rgba(100, 100, 200, 0.15)' : 'rgba(255,255,255,0.07)';

  const userNavItems = [
    { key: '/', icon: <HomeOutlined />, label: 'Home' },
    { key: '/bond-marketplace', icon: <BankOutlined />, label: 'Bond Marketplace', group: 'MARKETPLACE' },
    { key: '/asset-marketplace', icon: <ShopOutlined />, label: 'Asset Marketplace', group: 'MARKETPLACE' },
    { key: '/zakat', icon: <HeartOutlined />, label: 'Zakat Donation', group: 'MARKETPLACE' },
  ];

  const adminNavItems = [
    { key: '/admin/bonds', icon: <BankOutlined />, label: 'Manage Bonds', group: 'ADMIN' },
    { key: '/admin/assets', icon: <GoldOutlined />, label: 'Manage Real Assets', group: 'ADMIN' },
    { key: '/admin/charities', icon: <TeamOutlined />, label: 'Manage Charities', group: 'ADMIN' },
  ];

  const navItems = isAdminRoute ? adminNavItems : userNavItems;

  const isActive = (key: string) => pathname === key || (key !== '/' && pathname.startsWith(key));

  return (
    <>
      <div style={{
        width: 240,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: BG,
        borderRight: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isAdminRoute
                ? 'linear-gradient(135deg, #4060ff, #2040cc)'
                : 'linear-gradient(135deg, #00bf63, #00a855)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isAdminRoute
                ? <SettingOutlined style={{ color: '#fff', fontSize: 15 }} />
                : <BlockOutlined style={{ color: '#fff', fontSize: 15 }} />}
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.3px' }}>
              {isAdminRoute ? 'Admin Portal' : 'Amanah'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflow: 'auto' }}>
          {navItems.map((item, i) => {
            const showGroup = item.group && (i === 0 || navItems[i - 1]?.group !== item.group);
            const active = isActive(item.key);
            return (
              <div key={item.key}>
                {showGroup && (
                  <div style={{
                    padding: '12px 8px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: 'rgba(255,255,255,0.25)',
                    textTransform: 'uppercase',
                    marginTop: i === 0 ? 0 : 8,
                  }}>
                    {item.group}
                  </div>
                )}
                <button
                  onClick={() => router.push(item.key)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#f5f5f5' : 'rgba(255,255,255,0.5)',
                    background: active
                      ? (isAdminRoute ? 'rgba(64, 96, 255, 0.15)' : 'rgba(0, 191, 99, 0.12)')
                      : 'transparent',
                    borderLeft: active
                      ? `2px solid ${isAdminRoute ? '#4060ff' : '#00bf63'}`
                      : '2px solid transparent',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    }
                  }}
                >
                  <span style={{ color: active ? (isAdminRoute ? '#4060ff' : '#00bf63') : 'inherit', fontSize: 16 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </div>
            );
          })}

          {/* Wallet button for users */}
          {!isAdminRoute && user && (
            <button
              onClick={handleOpenWallet}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.5)',
                background: 'transparent',
                borderLeft: '2px solid transparent',
                transition: 'all 0.2s',
                textAlign: 'left',
                marginTop: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              <span style={{ color: 'inherit', fontSize: 16 }}><WalletOutlined /></span>
              My Wallet
              <LinkOutlined style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }} />
            </button>
          )}
        </nav>

        {/* Bottom user section */}
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 12px' }}>
          {isAdminRoute ? (
            adminLoading ? null : admin ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'rgba(64, 96, 255, 0.08)',
                  borderRadius: 10,
                  marginBottom: 10,
                }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: 'rgba(64, 96, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <SettingOutlined style={{ color: '#6080ff', fontSize: 16 }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#f5f5f5', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {admin.email}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>Administrator</div>
                  </div>
                </div>
                <button
                  onClick={adminSignOut}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                    background: 'transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)'; e.currentTarget.style.color = '#ff6060'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <LogoutOutlined /> Sign Out
                </button>
              </div>
            ) : null
          ) : isLoading ? null : user ? (
            <div>
              <div
                onClick={() => setIsProfileModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'rgba(0, 191, 99, 0.07)',
                  borderRadius: 10,
                  marginBottom: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(0, 191, 99, 0.12)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 191, 99, 0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 191, 99, 0.07)'; }}
              >
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'rgba(0, 191, 99, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <UserOutlined style={{ color: '#00bf63', fontSize: 16 }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: '#f5f5f5', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>View profile</div>
                </div>
              </div>
              <button
                onClick={signOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)'; e.currentTarget.style.color = '#ff6060'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <LogoutOutlined /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="green-glow-btn"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {user && (
        <Modal
          title={null}
          open={isProfileModalOpen}
          onCancel={() => setIsProfileModalOpen(false)}
          footer={null}
          width={480}
          styles={{
            content: { background: '#111111', border: '1px solid rgba(255,255,255,0.08)', padding: 0 },
            mask: { backdropFilter: 'blur(4px)' },
          }}
        >
          {/* Modal Header */}
          <div style={{
            padding: '24px 24px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(135deg, rgba(0,191,99,0.08) 0%, transparent 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(0, 191, 99, 0.15)',
                border: '1px solid rgba(0, 191, 99, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <UserOutlined style={{ color: '#00bf63', fontSize: 24 }} />
              </div>
              <div>
                <div style={{ color: '#f5f5f5', fontWeight: 700, fontSize: 16 }}>Your Profile</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{user.email}</div>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ padding: 24 }}>
            {[
              { label: 'Email', value: user.email, field: 'email' },
              ...(user.did ? [{ label: 'DID', value: user.did, field: 'did', mono: true }] : []),
              { label: 'Wallet', value: user.walletAddress, field: 'wallet', mono: true },
            ].map(({ label, value, field, mono }) => (
              <div key={field} style={{ marginBottom: 16 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                }}>
                  <span style={{
                    flex: 1,
                    color: '#f5f5f5',
                    fontSize: mono ? 11 : 14,
                    fontFamily: mono ? 'monospace' : 'inherit',
                    wordBreak: 'break-all',
                  }}>
                    {value}
                  </span>
                  <Tooltip title={copiedField === field ? 'Copied!' : 'Copy'}>
                    <button
                      onClick={() => handleCopyToClipboard(value, field)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedField === field ? '#00bf63' : 'rgba(255,255,255,0.3)',
                        padding: 4,
                        borderRadius: 6,
                        transition: 'color 0.2s',
                      }}
                    >
                      {copiedField === field ? <CheckOutlined /> : <CopyOutlined />}
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}

            <button
              onClick={() => { handleOpenWallet(); setIsProfileModalOpen(false); }}
              className="green-glow-btn"
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <WalletOutlined /> View Wallet on Explorer
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
