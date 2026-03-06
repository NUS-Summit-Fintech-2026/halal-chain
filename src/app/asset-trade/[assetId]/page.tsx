'use client';

import { Spin } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, CalendarOutlined, PercentageOutlined, DollarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use, useCallback } from 'react';
import PriceChart from '@/app/component/pricechart';
import OrderBook from '@/app/component/orderbook';
import TradingSection from '@/app/component/purchase';
import AuthGuard from '@/app/component/AuthGuard';

interface AssetDetails {
  id: string;
  name: string;
  code: string;
  issuer: string;
  maturityDate: string;
  expectedReturn: string;
  profitRate: number;
  totalValue: number;
  currencyCode: string;
  issuerAddress: string;
  currentValuationXrp: number | null;
  fileUrl?: string;
}

interface SellOrder {
  price: number;
  quantity: number;
}

export default function AssetTradePage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = use(params);
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState(1);
  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);
  const [availableTokens, setAvailableTokens] = useState(0);
  const [lowestSellPrice, setLowestSellPrice] = useState(1);
  const [orderbookKey, setOrderbookKey] = useState(0);

  const fetchOrderBook = useCallback(async (currencyCode: string, issuerAddress: string) => {
    try {
      const res = await fetch(`/api/xrpl/orderbook?currencyCode=${encodeURIComponent(currencyCode)}&issuerAddress=${encodeURIComponent(issuerAddress)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const sells: SellOrder[] = data.data.sells.map((order: any) => ({
          price: order.pricePerToken,
          quantity: order.tokenAmount,
        }));
        setSellOrders(sells);
        const totalAvailable = sells.reduce((sum: number, order: SellOrder) => sum + order.quantity, 0);
        setAvailableTokens(totalAvailable);
        if (sells.length > 0) {
          const lowest = Math.min(...sells.map((o: SellOrder) => o.price));
          setLowestSellPrice(lowest);
          setCurrentPrice(lowest);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orderbook:', error);
    }
  }, []);

  const onTradeSuccess = useCallback(() => {
    if (asset?.currencyCode && asset?.issuerAddress) {
      fetchOrderBook(asset.currencyCode, asset.issuerAddress);
      setOrderbookKey(prev => prev + 1);
    }
  }, [asset?.currencyCode, asset?.issuerAddress, fetchOrderBook]);

  useEffect(() => {
    async function fetchAsset() {
      try {
        const res = await fetch(`/api/realassets/${assetId}`);
        if (res.ok) {
          const data = await res.json();
          const profitRate = data.profitRate;
          setAsset({
            id: data.id,
            name: data.name,
            code: data.code,
            issuer: 'Real Asset',
            maturityDate: 'Upon Realization',
            expectedReturn: `${(profitRate * 100).toFixed(1)}%`,
            profitRate: profitRate,
            totalValue: data.totalTokens,
            currencyCode: data.currencyCode,
            issuerAddress: data.issuerAddress,
            currentValuationXrp: data.currentValuationXrp,
            fileUrl: data.fileUrl,
          });
          if (data.currencyCode && data.issuerAddress) {
            fetchOrderBook(data.currencyCode, data.issuerAddress);
          }
        } else {
          setAsset(null);
        }
      } catch {
        setAsset(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAsset();
  }, [assetId, fetchOrderBook]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', gap: 16 }}>
        <Spin size="large" />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading asset...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: 'rgba(255,255,255,0.4)' }}>
        Asset not found
      </div>
    );
  }

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '32px 28px' }}>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'all 0.2s',
            marginBottom: 28,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f5f5f5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <ArrowLeftOutlined /> Back to Marketplace
        </button>

        {/* Asset Header Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,191,99,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {asset.fileUrl && (
              <img
                src={asset.fileUrl}
                alt={asset.name}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 14,
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={() => window.open(asset.fileUrl, '_blank')}
              />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(0, 191, 99, 0.1)',
                  border: '1px solid rgba(0, 191, 99, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <HomeOutlined style={{ color: '#00bf63', fontSize: 18 }} />
                </div>
                <h2 style={{ margin: 0, color: '#f5f5f5', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {asset.name}
                </h2>
                <div style={{
                  padding: '3px 10px',
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
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'monospace', marginBottom: 16 }}>
                {asset.code}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { icon: <CalendarOutlined />, label: 'Realization', value: asset.maturityDate },
                  { icon: <PercentageOutlined />, label: 'Expected Return', value: asset.expectedReturn, highlight: true },
                  { icon: <DollarOutlined />, label: 'Total Tokens', value: asset.totalValue.toLocaleString() },
                  ...(asset.currentValuationXrp ? [{ icon: <DollarOutlined />, label: 'Valuation', value: `${asset.currentValuationXrp.toLocaleString()} XRP` }] : []),
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    flex: '1 1 140px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4 }}>
                      {stat.icon} {stat.label}
                    </div>
                    <div style={{ color: stat.highlight ? '#00bf63' : '#f5f5f5', fontSize: 15, fontWeight: 700 }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <PriceChart
          bondId={asset.id}
          basePrice={lowestSellPrice}
          profitRate={asset.profitRate}
          onPriceUpdate={setCurrentPrice}
        />

        {/* Order Book */}
        <OrderBook
          key={orderbookKey}
          currencyCode={asset.currencyCode}
          issuerAddress={asset.issuerAddress}
          currentPrice={currentPrice}
        />

        {/* Trading Section */}
        <TradingSection
          bond={asset}
          currentPrice={lowestSellPrice}
          availableTokens={availableTokens}
          onTradeSuccess={onTradeSuccess}
        />
      </div>
    </AuthGuard>
  );
}
