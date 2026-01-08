'use client';

import { Card, Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  totalValue: number;
}

export default function BondTradePage({ params }: { params: { bondId: string } }) {
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState(100);

  // Mock bond data - in real app, fetch based on params.bondId
  const bond: BondDetails = {
    id: params.bondId,
    name: 'Government Sukuk 2026',
    code: 'US092189AC02',
    issuer: 'Ministry of Finance',
    maturityDate: 'December 31, 2026',
    expectedReturn: '5% annually',
    totalValue: 1000000,
  };

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
        onPriceUpdate={setCurrentPrice}
      />

      {/* Order Book */}
      <OrderBook 
        bondId={bond.id}
        currentPrice={currentPrice}
      />

      {/* Purchase Section */}
      <PurchaseSection 
        bond={bond}
        currentPrice={currentPrice}
      />
    </div>
  );
}