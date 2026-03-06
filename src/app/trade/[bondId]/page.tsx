'use client';

import { Spin } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, BankOutlined, CalendarOutlined, PercentageOutlined, DollarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use, useCallback } from 'react';
import PriceChart from '@/app/component/pricechart';
import OrderBook from '@/app/component/orderbook';
import TradingSection from '@/app/component/purchase';
import AuthGuard from '@/app/component/AuthGuard';

interface BondDetails {
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
  fileUrl?: string;
}

interface SellOrder {
  price: number;
  quantity: number;
}

export default function BondTradePage({ params }: { params: Promise<{ bondId: string }> }) {
  const { bondId } = use(params);
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState(1);
  const [bond, setBond] = useState<BondDetails | null>(null);
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
    if (bond?.currencyCode && bond?.issuerAddress) {
      fetchOrderBook(bond.currencyCode, bond.issuerAddress);
      setOrderbookKey(prev => prev + 1);
    }
  }, [bond?.currencyCode, bond?.issuerAddress, fetchOrderBook]);

  useEffect(() => {
    async function fetchBond() {
      try {
        const res = await fetch(`/api/bonds/${bondId}`);
        if (res.ok) {
          const data = await res.json();
          const profitRate = data.profitRate;
          let maturityDateStr = 'TBD';
          if (data.maturityAt) {
            const maturityDate = new Date(data.maturityAt);
            maturityDateStr = maturityDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          }
          setBond({
            id: data.id,
            name: data.name,
            code: data.code,
            issuer: 'Issuer',
            maturityDate: maturityDateStr,
            expectedReturn: `${(profitRate * 100).toFixed(1)}%`,
            profitRate: profitRate,
            totalValue: data.totalTokens,
            currencyCode: data.currencyCode,
            issuerAddress: data.issuerAddress,
            fileUrl: data.fileUrl,
          });
          if (data.currencyCode && data.issuerAddress) {
            fetchOrderBook(data.currencyCode, data.issuerAddress);
          }
        } else {
          setBond({
            id: bondId,
            name: 'Government Sukuk 2026',
            code: 'US092189AC02',
            issuer: 'Ministry of Finance',
            maturityDate: 'December 31, 2026',
            expectedReturn: '5%',
            profitRate: 0.05,
            totalValue: 1000000,
            currencyCode: '',
            issuerAddress: '',
          });
        }
      } catch {
        setBond({
          id: bondId,
          name: 'Government Sukuk 2026',
          code: 'US092189AC02',
          issuer: 'Ministry of Finance',
          maturityDate: 'December 31, 2026',
          expectedReturn: '5%',
          profitRate: 0.05,
          totalValue: 1000000,
          currencyCode: '',
          issuerAddress: '',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchBond();
  }, [bondId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', gap: 16 }}>
        <Spin size="large" />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading bond...</span>
      </div>
    );
  }

  if (!bond) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: 'rgba(255,255,255,0.4)' }}>
        Bond not found
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

        {/* Bond Header Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle bg glow */}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
                <BankOutlined style={{ color: '#00bf63', fontSize: 24 }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 style={{ margin: 0, color: '#f5f5f5', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                    {bond.name}
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
                    SUKUK
                  </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'monospace' }}>
                  {bond.code}
                </div>
              </div>
            </div>

            {bond.fileUrl && (
              <button
                onClick={() => window.open(bond.fileUrl, '_blank')}
                style={{
                  display: 'flex',
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
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,191,99,0.3)'; e.currentTarget.style.color = '#00bf63'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <FileTextOutlined /> View Document
              </button>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { icon: <CalendarOutlined />, label: 'Maturity', value: bond.maturityDate },
              { icon: <PercentageOutlined />, label: 'Expected Return', value: bond.expectedReturn, highlight: true },
              { icon: <DollarOutlined />, label: 'Total Supply', value: `${bond.totalValue.toLocaleString()} tokens` },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: '1 1 160px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 6 }}>
                  {stat.icon} {stat.label}
                </div>
                <div style={{ color: stat.highlight ? '#00bf63' : '#f5f5f5', fontSize: 16, fontWeight: 700 }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Chart */}
        <PriceChart
          bondId={bond.id}
          basePrice={lowestSellPrice}
          profitRate={bond.profitRate}
          onPriceUpdate={setCurrentPrice}
        />

        {/* Order Book */}
        <OrderBook
          key={orderbookKey}
          currencyCode={bond.currencyCode}
          issuerAddress={bond.issuerAddress}
          currentPrice={currentPrice}
        />

        {/* Trading Section */}
        <TradingSection
          bond={bond}
          currentPrice={lowestSellPrice}
          availableTokens={availableTokens}
          onTradeSuccess={onTradeSuccess}
        />
      </div>
    </AuthGuard>
  );
}
