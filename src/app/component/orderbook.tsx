'use client';

import { Card, Row, Col, Table, Typography, Space, Spin, Button, message } from 'antd';
import { RiseOutlined, FallOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Text } = Typography;

interface OrderBookProps {
  bondCode: string;
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

export default function OrderBook({ bondCode, currentPrice }: OrderBookProps) {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderBook = async () => {
    if (!bondCode) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/xrpl/orderbook/${bondCode}`);
      const data = await res.json();

      if (res.ok && data.success) {
        // Map sell orders
        const sells: Order[] = data.data.sells.map((order: ApiOrder, index: number) => ({
          key: `sell-${index}`,
          price: order.pricePerToken,
          quantity: order.tokenAmount,
          total: order.xrpAmount,
          account: order.account,
        }));
        // Sort by price ascending (lowest sell first)
        sells.sort((a, b) => a.price - b.price);
        setSellOrders(sells);

        // Map buy orders
        const buys: Order[] = data.data.buys.map((order: ApiOrder, index: number) => ({
          key: `buy-${index}`,
          price: order.pricePerToken,
          quantity: order.tokenAmount,
          total: order.xrpAmount,
          account: order.account,
        }));
        // Sort by price descending (highest buy first)
        buys.sort((a, b) => b.price - a.price);
        setBuyOrders(buys);
      } else {
        // If API fails, show empty orderbook
        setBuyOrders([]);
        setSellOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orderbook:', error);
      setBuyOrders([]);
      setSellOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBook();
  }, [bondCode]);

  const buyColumns = [
    {
      title: 'Price (XRP)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#52c41a' }}>{price.toFixed(6)}</Text>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toLocaleString(),
    },
    {
      title: 'Total (XRP)',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
    },
  ];

  const sellColumns = [
    {
      title: 'Price (XRP)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>{price.toFixed(6)}</Text>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toLocaleString(),
    },
    {
      title: 'Total (XRP)',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
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
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchOrderBook}
          loading={loading}
          size="small"
        >
          Refresh
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
      <Row gutter={16} style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Buy Orders */}
        <Col span={12} style={{ display: 'flex' }}>
          <Card
            type="inner"
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                <span>Buy Orders</span>
              </Space>
            }
            headStyle={{ background: '#f6ffed' }}
            style={{ flex: 1 }}
            styles={{ body: { height: 450, overflow: 'auto' } }}
          >
            <Table
              columns={buyColumns}
              dataSource={buyOrders}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Sell Orders */}
        <Col span={12} style={{ display: 'flex' }}>
          <Card
            type="inner"
            title={
              <Space>
                <FallOutlined style={{ color: '#ff4d4f' }} />
                <span>Sell Orders</span>
              </Space>
            }
            headStyle={{ background: '#fff1f0' }}
            style={{ flex: 1 }}
            styles={{ body: { height: 450, overflow: 'auto' } }}
          >
            <Table
              columns={sellColumns}
              dataSource={sellOrders}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
      )}
    </Card>
  );
}