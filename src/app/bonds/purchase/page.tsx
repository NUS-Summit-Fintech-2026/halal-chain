'use client';

import { Card, Button, InputNumber, Typography, Space, Statistic, Row, Col, Divider, message } from 'antd';
import { ShoppingCartOutlined, WalletOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;

export default function PurchaseBondPage() {
  const [quantity, setQuantity] = useState(1);
  const pricePerToken = 100;
  const availableTokens = 8500;

  const handlePurchase = () => {
    message.success(`Successfully purchased ${quantity} tokens for ${quantity * pricePerToken} RLUSD`);
    setQuantity(1);
  };

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
      <Card 
        title={
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            Purchase Bond
          </span>
        }
      >
        <Row gutter={24}>
          <Col span={12}>
            <Card 
              type="inner" 
              title="Bond Details"
              style={{ background: '#fafafa' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    Government Sukuk 2026
                  </Title>
                  <Text type="secondary">Ministry of Finance</Text>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="Price per Token" 
                      value={pricePerToken} 
                      suffix="RLUSD"
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
                  <Text type="secondary">Maturity: December 31, 2026</Text>
                  <br />
                  <Text type="secondary">Expected Return: 5% annually</Text>
                </div>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card 
              type="inner" 
              title="Purchase Details"
              style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
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

                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="Total Cost" 
                      value={quantity * pricePerToken}
                      suffix="RLUSD"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Your Balance" 
                      value={50000}
                      suffix="RLUSD"
                      prefix={<WalletOutlined />}
                    />
                  </Col>
                </Row>

                <Button 
                  type="primary" 
                  size="large"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={handlePurchase}
                  disabled={quantity * pricePerToken > 50000}
                >
                  Purchase Tokens
                </Button>

                {quantity * pricePerToken > 50000 && (
                  <Text type="danger">Insufficient balance</Text>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}