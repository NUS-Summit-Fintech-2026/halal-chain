'use client';

import { Card, Row, Col, Table, Typography, Space } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

interface OrderBookProps {
  bondId: string;
  currentPrice: number;
}

interface Order {
  key: string;
  price: number;
  quantity: number;
  total: number;
}

export default function OrderBook({ bondId, currentPrice }: OrderBookProps) {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);

  // Generate mock order book data based on current price
  useEffect(() => {
    const generateOrders = (basePrice: number, type: 'buy' | 'sell', count: number): Order[] => {
      const orders: Order[] = [];
      const priceStep = type === 'buy' ? -0.5 : 0.5;
      
      for (let i = 0; i < count; i++) {
        const price = parseFloat((basePrice + (priceStep * i)).toFixed(2));
        const quantity = Math.floor(Math.random() * 500) + 100;
        const total = parseFloat((price * quantity).toFixed(2));
        
        orders.push({
          key: `${type}-${i}`,
          price,
          quantity,
          total,
        });
      }
      
      return orders;
    };

    // Buy orders (below current price)
    const newBuyOrders = generateOrders(currentPrice - 0.5, 'buy', 10);
    setBuyOrders(newBuyOrders);

    // Sell orders (above current price)
    const newSellOrders = generateOrders(currentPrice + 0.5, 'sell', 10);
    setSellOrders(newSellOrders);
  }, [currentPrice, bondId]);

  const buyColumns = [
    {
      title: 'Price (RLUSD)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#52c41a' }}>{price.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toLocaleString(),
    },
    {
      title: 'Total (RLUSD)',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
  ];

  const sellColumns = [
    {
      title: 'Price (RLUSD)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>{price.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toLocaleString(),
    },
    {
      title: 'Total (RLUSD)',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
  ];

  const totalBuyVolume = buyOrders.reduce((sum, order) => sum + order.quantity, 0);
  const totalSellVolume = sellOrders.reduce((sum, order) => sum + order.quantity, 0);
  const spread = sellOrders.length > 0 && buyOrders.length > 0 
    ? (sellOrders[0].price - buyOrders[0].price).toFixed(2) 
    : '0.00';

  return (
    <Card 
      title={
        <span style={{ fontSize: '20px', fontWeight: 600 }}>
          Order Book
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      {/* Order Book Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Space>
              <RiseOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Buy Volume</Text>
                <div><Text strong style={{ fontSize: 16 }}>{totalBuyVolume.toLocaleString()}</Text></div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
            <Space>
              <div style={{ fontSize: 20 }}>📊</div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Spread</Text>
                <div><Text strong style={{ fontSize: 16 }}>{spread} RLUSD</Text></div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: '#fff1f0', borderColor: '#ffccc7' }}>
            <Space>
              <FallOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Sell Volume</Text>
                <div><Text strong style={{ fontSize: 16 }}>{totalSellVolume.toLocaleString()}</Text></div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Buy Orders */}
        <Col span={12}>
          <Card 
            type="inner" 
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                <span>Buy Orders</span>
              </Space>
            }
            headStyle={{ background: '#f6ffed' }}
          >
            <Table
              columns={buyColumns}
              dataSource={buyOrders}
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>

        {/* Sell Orders */}
        <Col span={12}>
          <Card 
            type="inner" 
            title={
              <Space>
                <FallOutlined style={{ color: '#ff4d4f' }} />
                <span>Sell Orders</span>
              </Space>
            }
            headStyle={{ background: '#fff1f0' }}
          >
            <Table
              columns={sellColumns}
              dataSource={sellOrders}
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
}