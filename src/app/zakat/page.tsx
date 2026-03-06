'use client';

import { Spin, message, Modal } from 'antd';
import {
  HeartOutlined,
  WalletOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/app/component/AuthGuard';

const ZAKAT_RATE = 0.025;

interface Charity {
  id: string;
  did?: string;
  name: string;
  description: string;
  walletAddress: string;
  totalReceived: number;
  _count?: { donations: number };
}

interface DonationResult {
  id: string;
  charityName: string;
  xrpAmount: number;
  txHash: string;
  zakatRate: string;
  donorBalance: number;
  donateableBalance: number;
}

export default function ZakatDonationPage() {
  const { user, isLoading: authLoading, getAuthHeader } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [xrpBalance, setXrpBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [donating, setDonating] = useState<string | null>(null);
  const [donationResult, setDonationResult] = useState<DonationResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [copiedDid, setCopiedDid] = useState<string | null>(null);

  const handleCopyDid = async (did: string) => {
    try {
      await navigator.clipboard.writeText(did);
      setCopiedDid(did);
      message.success('DID copied to clipboard!');
      setTimeout(() => setCopiedDid(null), 2000);
    } catch {
      message.error('Failed to copy');
    }
  };

  const reserveBuffer = 15;
  const donateableBalance = Math.max(0, xrpBalance - reserveBuffer);
  const zakatAmount = Math.round(donateableBalance * ZAKAT_RATE * 100) / 100;

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/charities');
      if (res.ok) {
        const data = await res.json();
        setCharities(data);
      }
    } catch {
      message.error('Failed to fetch charities');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!user) return;
    setBalanceLoading(true);
    try {
      const res = await fetch('/api/me/balance', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        const xrp = data.balances?.find((b: any) => b.currency === 'XRP');
        setXrpBalance(xrp ? parseFloat(xrp.value) : 0);
      }
    } catch {
      console.error('Failed to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => { fetchCharities(); }, []);
  useEffect(() => { if (user) fetchBalance(); }, [user]);

  const handleDonate = async (charityId: string) => {
    if (!user) { message.error('Please sign in to donate'); return; }
    if (zakatAmount < 0.01) { message.error('Insufficient balance to donate Zakat (minimum 0.01 XRP)'); return; }

    setDonating(charityId);
    try {
      const res = await fetch('/api/zakat/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ charityId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDonationResult(data.donation);
        setResultModalOpen(true);
        fetchBalance();
        fetchCharities();
      } else {
        message.error(data.error || 'Failed to process donation');
      }
    } catch {
      message.error('Network error. Please try again.');
    } finally {
      setDonating(null);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a' }}>
        <Spin size="large" />
      </div>
    );
  }

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
  };

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '32px 28px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(0, 191, 99, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HeartOutlined style={{ color: '#00bf63', fontSize: 20 }} />
            </div>
            <h1 style={{ margin: 0, color: '#f5f5f5', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
              Zakat Donation
            </h1>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 14, maxWidth: 560 }}>
            Zakat is one of the Five Pillars of Islam — donating 2.5% of qualifying wealth to those in need.
            All donations are processed on-chain with full transparency.
          </p>
        </div>

        {/* Balance & Zakat Calculation */}
        {user && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'Total Balance', value: `${xrpBalance.toFixed(2)} XRP`, sub: 'Your wallet balance' },
              { label: 'Reserve (Locked)', value: `${reserveBuffer} XRP`, sub: 'XRPL account reserve', muted: true },
              { label: 'Donateable Balance', value: `${donateableBalance.toFixed(2)} XRP`, sub: 'After reserve deduction', blue: true },
              { label: `Zakat Due (${ZAKAT_RATE * 100}%)`, value: `${zakatAmount.toFixed(2)} XRP`, sub: 'Your obligation', green: true },
            ].map((item, i) => (
              <div key={i} style={{ ...glassCard, padding: '20px 22px', flex: '1 1 160px', position: 'relative', overflow: 'hidden' }}>
                {item.green && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at top right, rgba(0,191,99,0.08) 0%, transparent 60%)',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: item.green ? '#00bf63' : item.blue ? '#6090ff' : item.muted ? 'rgba(255,255,255,0.3)' : '#f5f5f5',
                  marginBottom: 4,
                }}>
                  {balanceLoading ? <Spin size="small" /> : item.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{item.sub}</div>
              </div>
            ))}

            <button
              onClick={fetchBalance}
              disabled={balanceLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,191,99,0.3)'; e.currentTarget.style.color = '#00bf63'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <ReloadOutlined spin={balanceLoading} /> Refresh Balance
            </button>
          </div>
        )}

        {/* Charities Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', color: '#f5f5f5', fontSize: 20, fontWeight: 700 }}>Select a Charity</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              All charities are verified with on-chain wallet addresses
            </p>
          </div>
          <button
            onClick={fetchCharities}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f5f5f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <ReloadOutlined spin={loading} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 16 }}>
            <Spin size="large" />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading charities...</span>
          </div>
        ) : charities.length === 0 ? (
          <div style={{ ...glassCard, padding: 60, textAlign: 'center' }}>
            <HeartOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>No charities available yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {charities.map((charity) => (
              <div
                key={charity.id}
                style={{
                  ...glassCard,
                  padding: '24px 26px',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-start',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 191, 99, 0.2)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'rgba(0, 191, 99, 0.1)',
                  border: '1px solid rgba(0, 191, 99, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <HeartOutlined style={{ color: '#00bf63', fontSize: 22 }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, color: '#f5f5f5', fontSize: 17, fontWeight: 700 }}>{charity.name}</h3>
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(0, 191, 99, 0.1)',
                      color: '#00bf63',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {charity.totalReceived.toFixed(2)} XRP received
                    </div>
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(64, 128, 255, 0.1)',
                      color: '#6090ff',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {charity._count?.donations || 0} donations
                    </div>
                  </div>

                  <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
                    {charity.description}
                  </p>

                  {charity.did && (
                    <button
                      onClick={() => handleCopyDid(charity.did!)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${copiedDid === charity.did ? 'rgba(0,191,99,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        background: copiedDid === charity.did ? 'rgba(0,191,99,0.08)' : 'transparent',
                        color: copiedDid === charity.did ? '#00bf63' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                        marginBottom: 8,
                      }}
                    >
                      {copiedDid === charity.did ? <CheckOutlined /> : <CopyOutlined />}
                      {charity.did.length > 40 ? `${charity.did.slice(0, 40)}...` : charity.did}
                    </button>
                  )}

                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                    Wallet:{' '}
                    <a
                      href={`https://testnet.xrpl.org/accounts/${charity.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#00bf63')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                    >
                      {charity.walletAddress.slice(0, 12)}...{charity.walletAddress.slice(-8)}
                      <LinkOutlined style={{ marginLeft: 4 }} />
                    </a>
                  </div>
                </div>

                {/* Donate button */}
                <div style={{ flexShrink: 0 }}>
                  <button
                    onClick={() => handleDonate(charity.id)}
                    disabled={!user || zakatAmount < 0.01 || donating !== null}
                    className={!user || zakatAmount < 0.01 || donating !== null ? '' : 'green-glow-btn'}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: !user || zakatAmount < 0.01 || donating !== null
                        ? 'rgba(255,255,255,0.04)'
                        : undefined,
                      color: !user || zakatAmount < 0.01 || donating !== null
                        ? 'rgba(255,255,255,0.25)'
                        : '#fff',
                      cursor: !user || zakatAmount < 0.01 || donating !== null ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    <HeartOutlined />
                    {donating === charity.id ? 'Donating...' : (
                      zakatAmount >= 0.01 ? `Donate ${zakatAmount.toFixed(2)} XRP` : 'Donate Zakat'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Modal */}
        <Modal
          open={resultModalOpen}
          footer={null}
          onCancel={() => setResultModalOpen(false)}
          width={480}
          centered
          styles={{
            content: { background: '#111111', border: '1px solid rgba(255,255,255,0.08)', padding: 0 },
            mask: { backdropFilter: 'blur(4px)' },
          }}
        >
          {donationResult && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'rgba(0, 191, 99, 0.1)',
                border: '1px solid rgba(0, 191, 99, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircleOutlined style={{ fontSize: 36, color: '#00bf63' }} />
              </div>

              <h2 style={{ color: '#f5f5f5', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
                Zakat Donated!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>
                May Allah accept your Zakat and bless you abundantly.
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'left',
                marginBottom: 24,
              }}>
                {[
                  { label: 'Charity', value: donationResult.charityName },
                  { label: 'Amount', value: `${donationResult.xrpAmount.toFixed(2)} XRP`, green: true },
                  { label: 'Zakat Rate', value: donationResult.zakatRate },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{item.label}</span>
                    <span style={{ color: item.green ? '#00bf63' : '#f5f5f5', fontSize: 13, fontWeight: 600 }}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div style={{ paddingTop: 12 }}>
                  <a
                    href={`https://testnet.xrpl.org/transactions/${donationResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00bf63', fontSize: 13, textDecoration: 'none' }}
                  >
                    <LinkOutlined /> View on XRPL Explorer
                  </a>
                </div>
              </div>

              <button
                onClick={() => setResultModalOpen(false)}
                className="green-glow-btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                Close
              </button>
            </div>
          )}
        </Modal>
      </div>
    </AuthGuard>
  );
}
