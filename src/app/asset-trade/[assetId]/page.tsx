'use client';

import { Card, Button, Space, Typography, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use, useCallback } from 'react';
import PriceChart from '@/app/component/pricechart';
import OrderBook from '@/app/component/orderbook';
import TradingSection from '@/app/component/purchase';
import AuthGuard from '@/app/component/AuthGuard';

const { Title, Text } = Typography;

interface AssetDetails {
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
  currentValuationXrp: number | null;
}

interface SellOrder {
  price: number;
  quantity: number;
}

export default function AssetTradePage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = use(params);
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState(1);
  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);
  const [availableTokens, setAvailableTokens] = useState(0);
  const [lowestSellPrice, setLowestSellPrice] = useState(1);
  const [orderbookKey, setOrderbookKey] = useState(0);

  // Fetch orderbook data
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
  }, []);

  // Callback to refetch orderbook - passed to TradingSection
  const onTradeSuccess = useCallback(() => {
    if (asset?.currencyCode && asset?.issuerAddress) {
      fetchOrderBook(asset.currencyCode, asset.issuerAddress);
      // Increment key to force OrderBook component to refetch
      setOrderbookKey(prev => prev + 1);
    }
  }, [asset?.currencyCode, asset?.issuerAddress, fetchOrderBook]);

  useEffect(() => {
    // Fetch asset data from API
    async function fetchAsset() {
      try {
        const res = await fetch(`/api/realassets/${assetId}`);
        if (res.ok) {
          const data = await res.json();
          const profitRate = data.profitRate;
          setAsset({
            id: data.id,
            name: data.name,
            code: data.code,
            issuer: 'Real Asset',
            maturityDate: 'Upon Realization',
            expectedReturn: `${(profitRate * 100).toFixed(1)}%`,
            profitRate: profitRate,
            totalValue: data.totalTokens,
            currencyCode: data.currencyCode,
            issuerAddress: data.issuerAddress,
            currentValuationXrp: data.currentValuationXrp,
          });

          // Fetch orderbook after getting asset data
          if (data.currencyCode && data.issuerAddress) {
            fetchOrderBook(data.currencyCode, data.issuerAddress);
          }
        } else {
          setAsset(null);
        }
      } catch (error) {
        setAsset(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAsset();
  }, [assetId, fetchOrderBook]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!asset) {
    return <div>Asset not found</div>;
  }

  return (
    <AuthGuard>
      <div style={{ marginLeft: 20, padding: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          Back to Marketplace
        </Button>

        {/* Asset Header */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={3} style={{ margin: 0 }}>{asset.name}</Title>
            <Text type="secondary">{asset.code} • {asset.issuer}</Text>
            <Space size="large" style={{ marginTop: 8 }}>
              <Text>Realization: <strong>{asset.maturityDate}</strong></Text>
              <Text>Expected Return: <strong>{asset.expectedReturn}</strong></Text>
              <Text>Total Tokens: <strong>{asset.totalValue.toLocaleString()}</strong></Text>
              {asset.currentValuationXrp && (
                <Text>Valuation: <strong>{asset.currentValuationXrp.toLocaleString()} XRP</strong></Text>
              )}
            </Space>
          </Space>
        </Card>

        {/* Price Chart */}
        <PriceChart
          bondId={asset.id}
          basePrice={lowestSellPrice}
          profitRate={asset.profitRate}
          onPriceUpdate={setCurrentPrice}
        />

        {/* Order Book */}
        <OrderBook
          key={orderbookKey}
          currencyCode={asset.currencyCode}
          issuerAddress={asset.issuerAddress}
          currentPrice={currentPrice}
        />

        {/* Trading Section - Buy/Sell */}
        <TradingSection
          bond={asset}
          currentPrice={lowestSellPrice}
          availableTokens={availableTokens}
          onTradeSuccess={onTradeSuccess}
        />
      </div>
    </AuthGuard>
  );
}
