'use client';

import { Card, Button, InputNumber, Typography, Space, Statistic, Row, Col, Divider, message } from 'antd';
import { ShoppingCartOutlined, LoadingOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;

interface PurchaseSectionProps {
  bond: {
    id: string;
    name: string;
    code: string;
    issuer: string;
    maturityDate: string;
    expectedReturn: string;
  };
  currentPrice: number;
  availableTokens: number;
}

export default function PurchaseSection({ bond, currentPrice, availableTokens }: PurchaseSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalCost = quantity * currentPrice;

  const handlePurchase = async () => {
    if (quantity > availableTokens) {
      message.error('Quantity exceeds available tokens');
      return;
    }

    if (currentPrice <= 0) {
      message.error('No sell orders available');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/xrpl/buy/${bond.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAmount: quantity,
          pricePerToken: currentPrice,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        message.success(
          `Order placed successfully! Bought ${data.data.tokenAmount} tokens at ${data.data.pricePerToken} XRP`
        );
        setQuantity(1);
      } else {
        message.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <span style={{ fontSize: '20px', fontWeight: 600 }}>
          Purchase Tokens
        </span>
      }
    >
      <Row gutter={24}>
        {/* Bond Summary */}
        <Col span={12}>
          <Card 
            type="inner" 
            title="Bond Summary"
            style={{ background: '#fafafa' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {bond.name}
                </Title>
                <Text type="secondary">{bond.issuer}</Text>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Current Price"
                    value={currentPrice}
                    precision={6}
                    suffix="XRP"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Available"
                    value={availableTokens}
                    suffix="tokens"
                  />
                </Col>
              </Row>

              <div>
                <Text type="secondary">Maturity: {bond.maturityDate}</Text>
                <br />
                <Text type="secondary">Expected Return: {bond.expectedReturn}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Order Details */}
        <Col span={12}>
          <Card
            type="inner"
            title="Market Order"
            style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Quantity */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Number of Tokens
                </Text>
                <InputNumber
                  min={1}
                  max={availableTokens || undefined}
                  value={quantity}
                  onChange={(val) => setQuantity(val || 1)}
                  style={{ width: '100%' }}
                  size="large"
                  disabled={loading}
                />
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Cost Summary */}
              <Statistic
                title="Total Cost"
                value={totalCost}
                precision={6}
                suffix="XRP"
                valueStyle={{ color: '#1890ff' }}
              />

              {/* Purchase Button */}
              <Button
                type="primary"
                size="large"
                block
                icon={loading ? <LoadingOutlined /> : <ShoppingCartOutlined />}
                onClick={handlePurchase}
                disabled={quantity > availableTokens || availableTokens === 0 || loading}
                loading={loading}
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </Button>

              {/* Error Messages */}
              {quantity > availableTokens && availableTokens > 0 && (
                <Text type="danger" style={{ display: 'block', textAlign: 'center' }}>
                  Quantity exceeds available tokens
                </Text>
              )}
              {availableTokens === 0 && (
                <Text type="warning" style={{ display: 'block', textAlign: 'center' }}>
                  No tokens available for purchase
                </Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}