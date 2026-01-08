'use client';

import { Card, Button, Space, Typography, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import PriceChart from '@/app/component/pricechart';
import OrderBook from '@/app/component/orderbook';
import PurchaseSection from '@/app/component/purchase';

const { Title, Text } = Typography;

interface BondDetails {
  id: string;
  name: string;
  code: string;
  issuer: string;
  maturityDate: string;
  expectedReturn: string;
  profitRate: number;
  totalValue: number;
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

  // Fetch orderbook data
  const fetchOrderBook = async (bondCode: string) => {
    try {
      const res = await fetch(`/api/xrpl/orderbook/${bondCode}`);
      const data = await res.json();

      if (res.ok && data.success) {
        const sells: SellOrder[] = data.data.sells.map((order: any) => ({
          price: order.pricePerToken,
          quantity: order.tokenAmount,
        }));

        setSellOrders(sells);

        // Calculate available tokens (sum of all sell orders)
        const totalAvailable = sells.reduce((sum: number, order: SellOrder) => sum + order.quantity, 0);
        setAvailableTokens(totalAvailable);

        // Get lowest sell price
        if (sells.length > 0) {
          const lowest = Math.min(...sells.map((o: SellOrder) => o.price));
          setLowestSellPrice(lowest);
          setCurrentPrice(lowest);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orderbook:', error);
    }
  };

  useEffect(() => {
    // Fetch bond data from API
    async function fetchBond() {
      try {
        const res = await fetch(`/api/bonds/${bondId}`);
        if (res.ok) {
          const data = await res.json();
          const profitRate = data.profitRate;
          setBond({
            id: data.id,
            name: data.name,
            code: data.code,
            issuer: 'Issuer',
            maturityDate: data.maturityDate || 'TBD',
            expectedReturn: `${(profitRate * 100).toFixed(1)}%`,
            profitRate: profitRate,
            totalValue: data.totalTokens,
          });

          // Fetch orderbook after getting bond code
          if (data.code) {
            fetchOrderBook(data.code);
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
          });
        }
      } catch (error) {
        setBond({
          id: bondId,
          name: 'Government Sukuk 2026',
          code: 'US092189AC02',
          issuer: 'Ministry of Finance',
          maturityDate: 'December 31, 2026',
          expectedReturn: '5%',
          profitRate: 0.05,
          totalValue: 1000000,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchBond();
  }, [bondId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!bond) {
    return <div>Bond not found</div>;
  }

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        Back to Marketplace
      </Button>

      {/* Bond Header */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>{bond.name}</Title>
          <Text type="secondary">{bond.code} • {bond.issuer}</Text>
          <Space size="large" style={{ marginTop: 8 }}>
            <Text>Maturity: <strong>{bond.maturityDate}</strong></Text>
            <Text>Expected Return: <strong>{bond.expectedReturn}</strong></Text>
            <Text>Total Value: <strong>{bond.totalValue.toLocaleString()} XRP</strong></Text>
          </Space>
        </Space>
      </Card>

      {/* Price Chart */}
      <PriceChart
        bondId={bond.id}
        basePrice={lowestSellPrice}
        profitRate={bond.profitRate}
        onPriceUpdate={setCurrentPrice}
      />

      {/* Order Book */}
      <OrderBook
        bondCode={bond.code}
        currentPrice={currentPrice}
      />

      {/* Purchase Section */}
      <PurchaseSection
        bond={bond}
        currentPrice={lowestSellPrice}
        availableTokens={availableTokens}
      />
    </div>
  );
}