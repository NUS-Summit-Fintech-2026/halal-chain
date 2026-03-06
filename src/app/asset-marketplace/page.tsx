'use client';

import { Spin, message, Modal } from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  HomeOutlined,
  ArrowRightOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/app/component/AuthGuard';

interface RealAsset {
  id: string;
  name: string;
  description: string;
  code: string;
  currencyCode: string | null;
  totalTokens: number;
  status: 'DRAFT' | 'PUBLISHED' | 'REALIZED';
  profitRate: number;
  currentValuationXrp: number | null;
  fileUrl: string | null;
  issuerAddress: string;
  treasuryAddress: string;
  createdAt: string;
}

export default function RealAssetMarketplacePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<RealAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/realassets/published');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        message.error('Failed to fetch assets');
      }
    } catch {
      message.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleViewAsset = (assetId: string) => router.push(`/asset-trade/${assetId}`);

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
                <HomeOutlined style={{ color: '#00bf63', fontSize: 20 }} />
              </div>
              <h1 style={{ margin: 0, color: '#f5f5f5', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
                Real Asset Marketplace
              </h1>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Own fractions of real-world assets. Receive proportional payouts upon realization.
            </p>
          </div>
          <button
            onClick={fetchAssets}
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
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading assets...</span>
          </div>
        ) : assets.length === 0 ? (
          <div style={{ ...glassCard, padding: 60, textAlign: 'center' }}>
            <HomeOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 8 }}>No assets available yet</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Published real assets will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {assets.map((asset) => (
              <div
                key={asset.id}
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
                {/* Asset Image */}
                {asset.fileUrl ? (
                  <div
                    style={{
                      height: 180,
                      borderRadius: '16px 16px 0 0',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => setPreviewImage(asset.fileUrl)}
                  >
                    <img
                      src={asset.fileUrl}
                      alt={asset.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      color: '#00bf63',
                      fontSize: 11,
                      fontWeight: 600,
                      border: '1px solid rgba(0,191,99,0.3)',
                    }}>
                      REAL ASSET
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: 140,
                    borderRadius: '16px 16px 0 0',
                    background: 'rgba(0, 191, 99, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    position: 'relative',
                  }}>
                    <PictureOutlined style={{ fontSize: 32, color: 'rgba(0,191,99,0.3)' }} />
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(0, 191, 99, 0.1)',
                      border: '1px solid rgba(0, 191, 99, 0.2)',
                      color: '#00bf63',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      REAL ASSET
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div style={{ padding: '20px 22px 0' }}>
                  <h3 style={{ margin: '0 0 6px', color: '#f5f5f5', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
                    {asset.name}
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>
                    {asset.code}
                  </div>
                  {asset.currencyCode && (
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(64, 128, 255, 0.1)',
                      border: '1px solid rgba(64, 128, 255, 0.2)',
                      color: '#6090ff',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}>
                      {asset.currencyCode}
                    </div>
                  )}
                </div>

                <div style={{ margin: '16px 22px', height: 1, background: 'rgba(255,255,255,0.06)' }} />

                {/* Stats */}
                <div style={{ padding: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: asset.currentValuationXrp ? 12 : 20 }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ThunderboltOutlined style={{ fontSize: 10 }} /> Expected Return
                    </div>
                    <div style={{ color: '#00bf63', fontSize: 22, fontWeight: 700 }}>
                      {(asset.profitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarOutlined style={{ fontSize: 10 }} /> Total Tokens
                    </div>
                    <div style={{ color: '#f5f5f5', fontSize: 18, fontWeight: 600 }}>
                      {asset.totalTokens.toLocaleString()}
                    </div>
                  </div>
                </div>

                {asset.currentValuationXrp && (
                  <div style={{ padding: '0 22px 16px' }}>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Valuation</span>
                      <span style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600 }}>
                        {asset.currentValuationXrp.toLocaleString()} XRP
                      </span>
                    </div>
                  </div>
                )}

                {/* Action */}
                <div style={{ padding: '0 22px 22px' }}>
                  <button
                    onClick={() => handleViewAsset(asset.id)}
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

        {/* Image Preview Modal */}
        <Modal
          open={!!previewImage}
          footer={null}
          onCancel={() => setPreviewImage(null)}
          centered
          width="auto"
          style={{ maxWidth: '90vw' }}
          styles={{
            content: { background: 'transparent', boxShadow: 'none', padding: 0 },
            mask: { backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.85)' },
          }}
        >
          {previewImage && (
            <img
              src={previewImage}
              alt="Asset Preview"
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                display: 'block',
                borderRadius: 12,
              }}
            />
          )}
        </Modal>
      </div>
    </AuthGuard>
  );
}
