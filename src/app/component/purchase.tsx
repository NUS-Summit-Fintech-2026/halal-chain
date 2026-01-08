'use client';

import { Card, Button, InputNumber, Typography, Space, Statistic, Row, Col, Divider, message, Radio } from 'antd';
import { ShoppingCartOutlined, WalletOutlined, DollarOutlined } from '@ant-design/icons';
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
}

export default function PurchaseSection({ bond, currentPrice }: PurchaseSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  
  const availableTokens = 8500;
  const userBalance = 50000;
  const pricePerToken = orderType === 'market' ? currentPrice : limitPrice;
  const totalCost = quantity * pricePerToken;

  const handlePurchase = () => {
    if (totalCost > userBalance) {
      message.error('Insufficient balance');
      return;
    }

    if (quantity > availableTokens) {
      message.error('Quantity exceeds available tokens');
      return;
    }

    const orderTypeText = orderType === 'market' ? 'Market' : 'Limit';
    message.success(
      `${orderTypeText} order placed: ${quantity} tokens at ${pricePerToken.toFixed(2)} RLUSD (Total: ${totalCost.toFixed(2)} RLUSD)`
    );
    setQuantity(1);
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
                    precision={2}
                    suffix="RLUSD"
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
            title="Order Details"
            style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Order Type */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Order Type
                </Text>
                <Radio.Group 
                  value={orderType} 
                  onChange={(e) => setOrderType(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="market">Market Order</Radio.Button>
                  <Radio.Button value="limit">Limit Order</Radio.Button>
                </Radio.Group>
              </div>

              {/* Limit Price (only for limit orders) */}
              {orderType === 'limit' && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Limit Price (RLUSD)
                  </Text>
                  <InputNumber 
                    min={0.01} 
                    value={limitPrice}
                    onChange={(val) => setLimitPrice(val || currentPrice)}
                    style={{ width: '100%' }}
                    size="large"
                    precision={2}
                    prefix={<DollarOutlined />}
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Number of Tokens
                </Text>
                <InputNumber 
                  min={1} 
                  max={availableTokens}
                  value={quantity}
                  onChange={(val) => setQuantity(val || 1)}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Cost Summary */}
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic 
                    title="Total Cost" 
                    value={totalCost}
                    precision={2}
                    suffix="RLUSD"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Your Balance" 
                    value={userBalance}
                    suffix="RLUSD"
                    prefix={<WalletOutlined />}
                  />
                </Col>
              </Row>

              {/* Purchase Button */}
              <Button 
                type="primary" 
                size="large"
                block
                icon={<ShoppingCartOutlined />}
                onClick={handlePurchase}
                disabled={totalCost > userBalance || quantity > availableTokens}
              >
                {orderType === 'market' ? 'Buy Now' : 'Place Limit Order'}
              </Button>

              {/* Error Messages */}
              {totalCost > userBalance && (
                <Text type="danger" style={{ display: 'block', textAlign: 'center' }}>
                  Insufficient balance
                </Text>
              )}
              {quantity > availableTokens && (
                <Text type="danger" style={{ display: 'block', textAlign: 'center' }}>
                  Quantity exceeds available tokens
                </Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}