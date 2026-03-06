'use client';

import { InputNumber, message } from 'antd';
import { ShoppingCartOutlined, LoadingOutlined, LoginOutlined, WalletOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TradingSectionProps {
  bond: {
    id: string;
    name: string;
    code: string;
    issuer: string;
    maturityDate: string;
    expectedReturn: string;
    currencyCode: string;
    issuerAddress: string;
  };
  currentPrice: number;
  availableTokens: number;
  onTradeSuccess?: () => void;
}

export default function TradingSection({ bond, currentPrice, availableTokens, onTradeSuccess }: TradingSectionProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(currentPrice || 0);
  const [buyLoading, setBuyLoading] = useState(false);

  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(currentPrice || 0);
  const [sellLoading, setSellLoading] = useState(false);

  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const { user, getAuthHeader } = useAuth();

  const buyTotalCost = buyQuantity * buyPrice;
  const sellTotalValue = sellQuantity * sellPrice;
  const hasInsufficientXrp = userBalance !== null && buyTotalCost > userBalance;
  const hasInsufficientTokens = sellQuantity > tokenBalance;

  const fetchBalances = useCallback(async () => {
    if (!user) { setUserBalance(null); setTokenBalance(0); return; }
    setBalanceLoading(true);
    try {
      const res = await fetch('/api/me/balance', { headers: { ...getAuthHeader() } });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUserBalance(data.xrpBalance);
        const bondToken = data.balances?.find(
          (b: { currency: string; issuer?: string }) =>
            b.currency === bond.currencyCode && b.issuer === bond.issuerAddress
        );
        setTokenBalance(bondToken ? parseFloat(bondToken.value) : 0);
      }
    } catch { console.error('Failed to fetch balance'); }
    finally { setBalanceLoading(false); }
  }, [user, getAuthHeader, bond.currencyCode, bond.issuerAddress]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  useEffect(() => {
    if (currentPrice > 0) { setBuyPrice(currentPrice); setSellPrice(currentPrice); }
  }, [currentPrice]);

  const handleBuy = async () => {
    if (!user) { message.error('Please sign in to purchase tokens'); return; }
    if (buyQuantity <= 0) { message.error('Please enter a valid quantity'); return; }
    if (buyPrice <= 0) { message.error('Please enter a valid price'); return; }
    if (hasInsufficientXrp) { message.error('Insufficient XRP balance'); return; }

    setBuyLoading(true);
    try {
      const res = await fetch(`/api/xrpl/buy/${bond.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ tokenAmount: buyQuantity, pricePerToken: buyPrice, currencyCode: bond.currencyCode, issuerAddress: bond.issuerAddress }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        message.success(`Buy order placed! Buying ${data.data.tokenAmount} tokens at ${data.data.pricePerToken} XRP each`);
        setBuyQuantity(1);
        fetchBalances();
        onTradeSuccess?.();
      } else {
        message.error(data.error || 'Failed to place order');
      }
    } catch { message.error('Network error. Please try again.'); }
    finally { setBuyLoading(false); }
  };

  const handleSell = async () => {
    if (!user) { message.error('Please sign in to sell tokens'); return; }
    if (sellQuantity <= 0) { message.error('Please enter a valid quantity'); return; }
    if (sellPrice <= 0) { message.error('Please enter a valid price'); return; }
    if (hasInsufficientTokens) { message.error('Insufficient token balance'); return; }

    setSellLoading(true);
    try {
      const res = await fetch(`/api/xrpl/sell/${bond.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ tokenAmount: sellQuantity, pricePerToken: sellPrice, currencyCode: bond.currencyCode, issuerAddress: bond.issuerAddress }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        message.success(`Sell order placed! Selling ${data.data.tokenAmount} tokens at ${data.data.pricePerToken} XRP each`);
        setSellQuantity(1);
        fetchBalances();
        onTradeSuccess?.();
      } else {
        message.error(data.error || 'Failed to place sell order');
      }
    } catch { message.error('Network error. Please try again.'); }
    finally { setSellLoading(false); }
  };

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
  };

  const fieldLabel: React.CSSProperties = {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  };

  const isBuy = activeTab === 'buy';

  return (
    <div style={{ ...glassCard, marginBottom: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: '#f5f5f5', fontSize: 17, fontWeight: 700 }}>
          Trade {bond.currencyCode}
        </h3>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 3,
        }}>
          <button
            onClick={() => setActiveTab('buy')}
            style={{
              padding: '7px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: isBuy ? 'rgba(0, 191, 99, 0.15)' : 'transparent',
              color: isBuy ? '#00bf63' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowUpOutlined /> Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            style={{
              padding: '7px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: !isBuy ? 'rgba(255, 77, 79, 0.12)' : 'transparent',
              color: !isBuy ? '#ff4d4f' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowDownOutlined /> Sell
          </button>
        </div>
      </div>

      {/* Balance display */}
      {user && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WalletOutlined style={{ color: '#00bf63', fontSize: 14 }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>XRP:</span>
            <span style={{ color: isBuy && hasInsufficientXrp ? '#ff4d4f' : '#f5f5f5', fontSize: 13, fontWeight: 600 }}>
              {balanceLoading ? '...' : `${userBalance?.toFixed(2) ?? '—'}`}
            </span>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarOutlined style={{ color: '#6090ff', fontSize: 14 }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{bond.currencyCode}:</span>
            <span style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600 }}>
              {balanceLoading ? '...' : tokenBalance}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={fieldLabel}>{isBuy ? 'Tokens to Buy' : 'Tokens to Sell'}</label>
          <InputNumber
            min={1}
            max={!isBuy ? (tokenBalance || undefined) : undefined}
            value={isBuy ? buyQuantity : sellQuantity}
            onChange={(val) => isBuy ? setBuyQuantity(val || 1) : setSellQuantity(val || 1)}
            style={{ width: '100%' }}
            size="large"
            disabled={isBuy ? buyLoading : sellLoading}
            className="dark-input-number"
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={fieldLabel}>Price per Token (XRP)</label>
          <InputNumber
            min={0.000001}
            step={0.001}
            value={isBuy ? buyPrice : sellPrice}
            onChange={(val) => isBuy ? setBuyPrice(val || 0) : setSellPrice(val || 0)}
            style={{ width: '100%' }}
            size="large"
            disabled={isBuy ? buyLoading : sellLoading}
            precision={6}
            className="dark-input-number"
          />
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>
            Market: {currentPrice.toFixed(6)} XRP
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

      {/* Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        background: isBuy ? 'rgba(0, 191, 99, 0.05)' : 'rgba(255, 77, 79, 0.05)',
        border: `1px solid ${isBuy ? 'rgba(0,191,99,0.15)' : 'rgba(255,77,79,0.15)'}`,
        borderRadius: 12,
        marginBottom: 20,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          {isBuy ? 'Total Cost' : 'Total Value'}
        </span>
        <span style={{ color: isBuy ? (hasInsufficientXrp ? '#ff4d4f' : '#00bf63') : '#ff4d4f', fontSize: 20, fontWeight: 700 }}>
          {(isBuy ? buyTotalCost : sellTotalValue).toFixed(6)}{' '}
          <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>XRP</span>
        </span>
      </div>

      {/* Action Button */}
      <button
        onClick={isBuy ? handleBuy : handleSell}
        disabled={
          !user ||
          (isBuy
            ? (buyQuantity <= 0 || buyPrice <= 0 || buyLoading || hasInsufficientXrp)
            : (sellQuantity <= 0 || sellPrice <= 0 || sellLoading || hasInsufficientTokens || tokenBalance === 0))
        }
        className={
          (!user || (isBuy
            ? (buyQuantity <= 0 || buyPrice <= 0 || buyLoading || hasInsufficientXrp)
            : (sellQuantity <= 0 || sellPrice <= 0 || sellLoading || hasInsufficientTokens || tokenBalance === 0)))
            ? '' : (isBuy ? 'green-glow-btn' : '')
        }
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          cursor: !user || (isBuy
            ? (buyQuantity <= 0 || buyPrice <= 0 || buyLoading || hasInsufficientXrp)
            : (sellQuantity <= 0 || sellPrice <= 0 || sellLoading || hasInsufficientTokens || tokenBalance === 0))
            ? 'not-allowed' : 'pointer',
          fontSize: 15,
          fontWeight: 700,
          color: !user || (isBuy
            ? (buyQuantity <= 0 || buyPrice <= 0 || buyLoading || hasInsufficientXrp)
            : (sellQuantity <= 0 || sellPrice <= 0 || sellLoading || hasInsufficientTokens || tokenBalance === 0))
            ? 'rgba(255,255,255,0.25)' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
          background: !user || (isBuy
            ? (buyQuantity <= 0 || buyPrice <= 0 || buyLoading || hasInsufficientXrp)
            : (sellQuantity <= 0 || sellPrice <= 0 || sellLoading || hasInsufficientTokens || tokenBalance === 0))
            ? 'rgba(255,255,255,0.05)'
            : isBuy ? undefined : 'linear-gradient(135deg, #ff4d4f 0%, #d9363e 100%)',
          boxShadow: !isBuy && user && !hasInsufficientTokens && tokenBalance > 0
            ? '0 4px 20px rgba(255, 77, 79, 0.3)'
            : undefined,
        }}
      >
        {(isBuy ? buyLoading : sellLoading)
          ? <><LoadingOutlined /> Processing...</>
          : !user
            ? <><LoginOutlined /> Sign In to {isBuy ? 'Buy' : 'Sell'}</>
            : isBuy
              ? <><ShoppingCartOutlined /> Place Buy Order</>
              : <><DollarOutlined /> Place Sell Order</>}
      </button>

      {user && isBuy && hasInsufficientXrp && (
        <div style={{ marginTop: 10, color: '#ff4d4f', fontSize: 12, textAlign: 'center' }}>
          Insufficient XRP balance
        </div>
      )}
      {user && !isBuy && tokenBalance === 0 && (
        <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' }}>
          You don&apos;t have any {bond.currencyCode} tokens to sell
        </div>
      )}
      {user && !isBuy && hasInsufficientTokens && tokenBalance > 0 && (
        <div style={{ marginTop: 10, color: '#ff4d4f', fontSize: 12, textAlign: 'center' }}>
          Quantity exceeds your token balance
        </div>
      )}
    </div>
  );
}
