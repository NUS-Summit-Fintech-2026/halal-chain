'use client';

import { Spin } from 'antd';
import { RiseOutlined, FallOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

interface OrderBookProps {
  currencyCode: string;
  issuerAddress: string;
  currentPrice: number;
}

interface Order {
  key: string;
  price: number;
  quantity: number;
  total: number;
  account?: string;
}

interface ApiOrder {
  account: string;
  tokenAmount: number;
  xrpAmount: number;
  pricePerToken: number;
  sequence: number;
}

export default function OrderBook({ currencyCode, issuerAddress, currentPrice }: OrderBookProps) {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderBook = async () => {
    if (!currencyCode || !issuerAddress) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/xrpl/orderbook?currencyCode=${encodeURIComponent(currencyCode)}&issuerAddress=${encodeURIComponent(issuerAddress)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const sells: Order[] = data.data.sells.map((order: ApiOrder, index: number) => ({
          key: `sell-${index}`,
          price: order.pricePerToken,
          quantity: order.tokenAmount,
          total: order.xrpAmount,
          account: order.account,
        }));
        sells.sort((a, b) => a.price - b.price);
        setSellOrders(sells);

        const buys: Order[] = data.data.buys.map((order: ApiOrder, index: number) => ({
          key: `buy-${index}`,
          price: order.pricePerToken,
          quantity: order.tokenAmount,
          total: order.xrpAmount,
          account: order.account,
        }));
        buys.sort((a, b) => b.price - a.price);
        setBuyOrders(buys);
      } else {
        setBuyOrders([]);
        setSellOrders([]);
      }
    } catch {
      setBuyOrders([]);
      setSellOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrderBook(); }, [currencyCode, issuerAddress]);

  const totalBuyVolume = buyOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalSellVolume = sellOrders.reduce((sum, o) => sum + o.quantity, 0);

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
  };

  const tableHeader: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  };

  const renderOrderRow = (order: Order, type: 'buy' | 'sell', maxQty: number) => {
    const pct = Math.min((order.quantity / Math.max(maxQty, 1)) * 100, 100);
    const color = type === 'buy' ? '#00bf63' : '#ff4d4f';
    const bg = type === 'buy' ? 'rgba(0, 191, 99, 0.06)' : 'rgba(255, 77, 79, 0.06)';
    return (
      <div
        key={order.key}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          padding: '8px 16px',
          position: 'relative',
          fontSize: 12,
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          [type === 'buy' ? 'left' : 'right']: 0,
          width: `${pct}%`,
          height: '100%',
          background: bg,
          pointerEvents: 'none',
        }} />
        <span style={{ color, fontWeight: 600, position: 'relative', zIndex: 1 }}>{order.price.toFixed(6)}</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {order.quantity.toLocaleString()}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'right', position: 'relative', zIndex: 1 }}>
          {order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </span>
      </div>
    );
  };

  const emptyState = (type: 'buy' | 'sell') => (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
      No {type} orders
    </div>
  );

  const spread = sellOrders.length > 0 && buyOrders.length > 0
    ? (sellOrders[0].price - buyOrders[0].price).toFixed(6)
    : null;

  return (
    <div style={{ ...glassCard, marginBottom: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 22px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, color: '#f5f5f5', fontSize: 17, fontWeight: 700 }}>Order Book</h3>
          {spread && (
            <div style={{
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
            }}>
              Spread: {spread}
            </div>
          )}
        </div>
        <button
          onClick={fetchOrderBook}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: 12,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#f5f5f5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <ReloadOutlined /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Buy Orders */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <RiseOutlined style={{ color: '#00bf63' }} />
              <span style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600 }}>Buy Orders</span>
              <span style={{ marginLeft: 'auto', color: '#00bf63', fontSize: 11, fontWeight: 600 }}>
                {totalBuyVolume.toLocaleString()} tokens
              </span>
            </div>
            <div style={tableHeader}>
              <span>Price (XRP)</span>
              <span style={{ textAlign: 'center' }}>Quantity</span>
              <span style={{ textAlign: 'right' }}>Total (XRP)</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {buyOrders.length === 0
                ? emptyState('buy')
                : buyOrders.map(o => renderOrderRow(o, 'buy', Math.max(...buyOrders.map(x => x.quantity))))}
            </div>
          </div>

          {/* Sell Orders */}
          <div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <FallOutlined style={{ color: '#ff4d4f' }} />
              <span style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600 }}>Sell Orders</span>
              <span style={{ marginLeft: 'auto', color: '#ff4d4f', fontSize: 11, fontWeight: 600 }}>
                {totalSellVolume.toLocaleString()} tokens
              </span>
            </div>
            <div style={tableHeader}>
              <span>Price (XRP)</span>
              <span style={{ textAlign: 'center' }}>Quantity</span>
              <span style={{ textAlign: 'right' }}>Total (XRP)</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {sellOrders.length === 0
                ? emptyState('sell')
                : sellOrders.map(o => renderOrderRow(o, 'sell', Math.max(...sellOrders.map(x => x.quantity))))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
