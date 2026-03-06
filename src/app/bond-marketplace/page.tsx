'use client';

import { Button, Spin, message, Tag } from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  BankOutlined,
  ArrowRightOutlined,
  DollarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/app/component/AuthGuard';

interface Bond {
  id: string;
  name: string;
  description: string;
  code: string;
  currencyCode: string | null;
  totalTokens: number;
  status: 'DRAFT' | 'PUBLISHED';
  profitRate: number;
  issuerAddress: string;
  treasuryAddress: string;
  createdAt: string;
}

export default function BondMarketplacePage() {
  const router = useRouter();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBonds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bonds/published');
      if (res.ok) {
        const data = await res.json();
        setBonds(data);
      } else {
        message.error('Failed to fetch bonds');
      }
    } catch {
      message.error('Failed to fetch bonds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBonds(); }, []);

  const handleViewBond = (bondId: string) => router.push(`/trade/${bondId}`);

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    transition: 'all 0.3s ease',
  };

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '32px 28px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
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
                <BankOutlined style={{ color: '#00bf63', fontSize: 20 }} />
              </div>
              <h1 style={{ margin: 0, color: '#f5f5f5', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
                Bond Marketplace
              </h1>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Invest in tokenized Sukuk bonds. Buy fractional ownership and earn halal returns upon maturity.
            </p>
          </div>
          <button
            onClick={fetchBonds}
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

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
            <Spin size="large" />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading bonds...</span>
          </div>
        ) : bonds.length === 0 ? (
          <div style={{
            ...glassCard,
            padding: 60,
            textAlign: 'center',
          }}>
            <BankOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 8 }}>No bonds available yet</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Published Sukuk bonds will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {bonds.map((bond) => (
              <div
                key={bond.id}
                style={glassCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(0, 191, 99, 0.25)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 191, 99, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Card Top */}
                <div style={{ padding: '22px 22px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(0, 191, 99, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BankOutlined style={{ color: '#00bf63', fontSize: 20 }} />
                    </div>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(0, 191, 99, 0.1)',
                      border: '1px solid rgba(0, 191, 99, 0.2)',
                      color: '#00bf63',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}>
                      SUKUK
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 6px', color: '#f5f5f5', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
                    {bond.name}
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace', marginBottom: 4 }}>
                    {bond.code}
                  </div>
                  {bond.currencyCode && (
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(64, 128, 255, 0.1)',
                      border: '1px solid rgba(64, 128, 255, 0.2)',
                      color: '#6090ff',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      marginTop: 4,
                    }}>
                      {bond.currencyCode}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ margin: '18px 22px', height: 1, background: 'rgba(255,255,255,0.06)' }} />

                {/* Stats */}
                <div style={{ padding: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ThunderboltOutlined style={{ fontSize: 10 }} /> Expected Return
                    </div>
                    <div style={{ color: '#00bf63', fontSize: 22, fontWeight: 700 }}>
                      {(bond.profitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarOutlined style={{ fontSize: 10 }} /> Total Supply
                    </div>
                    <div style={{ color: '#f5f5f5', fontSize: 18, fontWeight: 600 }}>
                      {bond.totalTokens.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div style={{ padding: '0 22px 22px' }}>
                  <button
                    onClick={() => handleViewBond(bond.id)}
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <EyeOutlined /> View & Trade <ArrowRightOutlined style={{ fontSize: 12 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
