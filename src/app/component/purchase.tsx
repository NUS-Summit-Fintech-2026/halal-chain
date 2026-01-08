'use client';

import { Card, Button, InputNumber, Typography, Space, Statistic, Divider, message, Tabs } from 'antd';
import { ShoppingCartOutlined, LoadingOutlined, LoginOutlined, WalletOutlined, DollarOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const { Text } = Typography;

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
  const [activeTab, setActiveTab] = useState('buy');

  // Buy state
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(currentPrice || 0);
  const [buyLoading, setBuyLoading] = useState(false);

  // Sell state
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(currentPrice || 0);
  const [sellLoading, setSellLoading] = useState(false);

  // Balance state
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const { user, getAuthHeader } = useAuth();

  const buyTotalCost = buyQuantity * buyPrice;
  const sellTotalValue = sellQuantity * sellPrice;
  const hasInsufficientXrp = userBalance !== null && buyTotalCost > userBalance;
  const hasInsufficientTokens = sellQuantity > tokenBalance;

  // Fetch user balances (XRP and tokens)
  const fetchBalances = useCallback(async () => {
    if (!user) {
      setUserBalance(null);
      setTokenBalance(0);
      return;
    }

    setBalanceLoading(true);
    try {
      const res = await fetch('/api/me/balance', {
        headers: {
          ...getAuthHeader(),
        },
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setUserBalance(data.xrpBalance);

        // Find token balance for this specific bond using currencyCode and issuerAddress
        const bondToken = data.balances?.find(
          (b: { currency: string; issuer?: string }) =>
            b.currency === bond.currencyCode && b.issuer === bond.issuerAddress
        );
        setTokenBalance(bondToken ? parseFloat(bondToken.value) : 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  }, [user, getAuthHeader, bond.currencyCode, bond.issuerAddress]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Update buy/sell price when currentPrice changes
  useEffect(() => {
    if (currentPrice > 0) {
      setBuyPrice(currentPrice);
      setSellPrice(currentPrice);
    }
  }, [currentPrice]);

  const handleBuy = async () => {
    if (!user) {
      message.error('Please sign in to purchase tokens');
      return;
    }

    if (buyQuantity <= 0) {
      message.error('Please enter a valid quantity');
      return;
    }

    if (buyPrice <= 0) {
      message.error('Please enter a valid price');
      return;
    }

    if (hasInsufficientXrp) {
      message.error('Insufficient XRP balance');
      return;
    }

    setBuyLoading(true);
    try {
      const res = await fetch(`/api/xrpl/buy/${bond.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          tokenAmount: buyQuantity,
          pricePerToken: buyPrice,
          currencyCode: bond.currencyCode,
          issuerAddress: bond.issuerAddress,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        message.success(
          `Buy order placed! Buying ${data.data.tokenAmount} tokens at ${data.data.pricePerToken} XRP each`
        );
        setBuyQuantity(1);
        // Refresh balances and orderbook after purchase
        fetchBalances();
        onTradeSuccess?.();
      } else {
        message.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleSell = async () => {
    if (!user) {
      message.error('Please sign in to sell tokens');
      return;
    }

    if (sellQuantity <= 0) {
      message.error('Please enter a valid quantity');
      return;
    }

    if (sellPrice <= 0) {
      message.error('Please enter a valid price');
      return;
    }

    if (hasInsufficientTokens) {
      message.error('Insufficient token balance');
      return;
    }

    setSellLoading(true);
    try {
      const res = await fetch(`/api/xrpl/sell/${bond.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          tokenAmount: sellQuantity,
          pricePerToken: sellPrice,
          currencyCode: bond.currencyCode,
          issuerAddress: bond.issuerAddress,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        message.success(
          `Sell order placed! Selling ${data.data.tokenAmount} tokens at ${data.data.pricePerToken} XRP each`
        );
        setSellQuantity(1);
        // Refresh balances and orderbook after sell order
        fetchBalances();
        onTradeSuccess?.();
      } else {
        message.error(data.error || 'Failed to place sell order');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setSellLoading(false);
    }
  };

  const renderBuyTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* XRP Balance */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
          <WalletOutlined style={{ color: '#52c41a' }} />
          <Text>
            Your XRP:{' '}
            {balanceLoading ? (
              <LoadingOutlined style={{ marginLeft: 4 }} />
            ) : (
              <Text strong style={{ color: hasInsufficientXrp ? '#ff4d4f' : '#52c41a' }}>
                {userBalance?.toFixed(2) ?? '—'} XRP
              </Text>
            )}
          </Text>
        </div>
      )}

      {/* Quantity */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Number of Tokens to Buy
        </Text>
        <InputNumber
          min={1}
          value={buyQuantity}
          onChange={(val) => setBuyQuantity(val || 1)}
          style={{ width: '100%' }}
          size="large"
          disabled={buyLoading}
        />
      </div>

      {/* Price */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Price per Token (XRP)
        </Text>
        <InputNumber
          min={0.000001}
          step={0.001}
          value={buyPrice}
          onChange={(val) => setBuyPrice(val || 0)}
          style={{ width: '100%' }}
          size="large"
          disabled={buyLoading}
          precision={6}
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          Current market price: {currentPrice.toFixed(6)} XRP
        </Text>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Cost Summary */}
      <Statistic
        title="Total Cost"
        value={buyTotalCost}
        precision={6}
        suffix="XRP"
        valueStyle={{ color: hasInsufficientXrp ? '#ff4d4f' : '#52c41a' }}
      />

      {/* Buy Button */}
      <Button
        type="primary"
        size="large"
        block
        icon={buyLoading ? <LoadingOutlined /> : (user ? <ShoppingCartOutlined /> : <LoginOutlined />)}
        onClick={handleBuy}
        disabled={!user || buyQuantity <= 0 || buyPrice <= 0 || buyLoading || hasInsufficientXrp}
        loading={buyLoading}
        style={{ background: '#52c41a', borderColor: '#52c41a' }}
      >
        {buyLoading ? 'Processing...' : (user ? 'Place Buy Order' : 'Sign In to Buy')}
      </Button>

      {/* Error Messages */}
      {!user && (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          Please sign in to purchase tokens
        </Text>
      )}
      {user && hasInsufficientXrp && (
        <Text type="danger" style={{ display: 'block', textAlign: 'center' }}>
          Insufficient XRP balance
        </Text>
      )}
    </Space>
  );

  const renderSellTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Token Balance */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <Text>
            Your {bond.currencyCode} Tokens:{' '}
            {balanceLoading ? (
              <LoadingOutlined style={{ marginLeft: 4 }} />
            ) : (
              <Text strong style={{ color: tokenBalance > 0 ? '#1890ff' : '#999' }}>
                {tokenBalance}
              </Text>
            )}
          </Text>
        </div>
      )}

      {/* Quantity */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Number of Tokens to Sell
        </Text>
        <InputNumber
          min={1}
          max={tokenBalance || undefined}
          value={sellQuantity}
          onChange={(val) => setSellQuantity(val || 1)}
          style={{ width: '100%' }}
          size="large"
          disabled={sellLoading}
        />
      </div>

      {/* Price */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Price per Token (XRP)
        </Text>
        <InputNumber
          min={0.000001}
          step={0.001}
          value={sellPrice}
          onChange={(val) => setSellPrice(val || 0)}
          style={{ width: '100%' }}
          size="large"
          disabled={sellLoading}
          precision={6}
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          Current market price: {currentPrice.toFixed(6)} XRP
        </Text>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Value Summary */}
      <Statistic
        title="Total Value"
        value={sellTotalValue}
        precision={6}
        suffix="XRP"
        valueStyle={{ color: '#fa541c' }}
      />

      {/* Sell Button */}
      <Button
        type="primary"
        size="large"
        block
        danger
        icon={sellLoading ? <LoadingOutlined /> : (user ? <DollarOutlined /> : <LoginOutlined />)}
        onClick={handleSell}
        disabled={!user || sellQuantity <= 0 || sellPrice <= 0 || sellLoading || hasInsufficientTokens || tokenBalance === 0}
        loading={sellLoading}
      >
        {sellLoading ? 'Processing...' : (user ? 'Place Sell Order' : 'Sign In to Sell')}
      </Button>

      {/* Error Messages */}
      {!user && (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          Please sign in to sell tokens
        </Text>
      )}
      {user && hasInsufficientTokens && tokenBalance > 0 && (
        <Text type="danger" style={{ display: 'block', textAlign: 'center' }}>
          Quantity exceeds your token balance
        </Text>
      )}
      {user && tokenBalance === 0 && (
        <Text type="warning" style={{ display: 'block', textAlign: 'center' }}>
          You don't have any {bond.currencyCode} tokens to sell
        </Text>
      )}
    </Space>
  );

  return (
    <Card
      title={
        <span style={{ fontSize: '20px', fontWeight: 600 }}>
          Trade {bond.currencyCode}
        </span>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={[
          {
            key: 'buy',
            label: (
              <span style={{ color: activeTab === 'buy' ? '#52c41a' : undefined }}>
                <ShoppingCartOutlined /> Buy
              </span>
            ),
            children: renderBuyTab(),
          },
          {
            key: 'sell',
            label: (
              <span style={{ color: activeTab === 'sell' ? '#ff4d4f' : undefined }}>
                <DollarOutlined /> Sell
              </span>
            ),
            children: renderSellTab(),
          },
        ]}
      />
    </Card>
  );
}
