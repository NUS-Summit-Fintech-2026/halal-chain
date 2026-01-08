'use client';

import { Card, Row, Col, Statistic, Select, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, LineChartOutlined } from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useRef } from 'react';

interface PriceChartProps {
  bondId: string;
  basePrice?: number;
  profitRate?: number;
  onPriceUpdate?: (price: number) => void;
}

interface PriceData {
  date: string;
  price: number;
}

export default function PriceChart({ bondId, basePrice = 1, profitRate = 0.05, onPriceUpdate }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const generatedRef = useRef<Record<string, PriceData[]>>({});

  // Generate price data based on time range and profitRate
  const generatePriceData = (days: number, base: number, rate: number): PriceData[] => {
    const cacheKey = `${bondId}-${days}-${base}-${rate}`;
    if (generatedRef.current[cacheKey]) {
      return generatedRef.current[cacheKey];
    }

    const data: PriceData[] = [];
    let currentPrice = base;

    // Use profitRate to determine fluctuation range (e.g., 5% rate = ±5% fluctuation)
    const fluctuationRange = base * rate;
    const minPrice = base * (1 - rate);
    const maxPrice = base * (1 + rate);

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Random price fluctuation within ± profitRate range
      const change = (Math.random() - 0.5) * fluctuationRange * 0.4;
      currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice + change));

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: parseFloat(currentPrice.toFixed(6)),
      });
    }

    generatedRef.current[cacheKey] = data;
    return data;
  };

  useEffect(() => {
    const timeRanges: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };

    const data = generatePriceData(timeRanges[timeRange], basePrice, profitRate);
    setPriceData(data);

    // Update current price to parent
    if (onPriceUpdate && data.length > 0) {
      onPriceUpdate(data[data.length - 1].price);
    }
  }, [timeRange, bondId, basePrice, profitRate]);

  if (priceData.length === 0) return null;

  const currentPrice = priceData[priceData.length - 1].price;
  const previousPrice = priceData[priceData.length - 2].price;
  const priceChange = currentPrice - previousPrice;
  const percentChange = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const highPrice = Math.max(...priceData.map(d => d.price));
  const lowPrice = Math.min(...priceData.map(d => d.price));
  const avgPrice = (priceData.reduce((sum, d) => sum + d.price, 0) / priceData.length).toFixed(2);

  return (
    <Card 
      title={
        <Space>
          <LineChartOutlined style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            Token Price Fluctuation
          </span>
        </Space>
      }
      extra={
        <Select 
          value={timeRange} 
          onChange={setTimeRange}
          style={{ width: 120 }}
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]}
        />
      }
      style={{ marginBottom: 24 }}
    >
      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ background: '#fafafa' }}>
            <Statistic
              title="Current Price"
              value={currentPrice}
              precision={6}
              suffix="XRP"
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
            <Space style={{ marginTop: 8 }}>
              {isPositive ? (
                <ArrowUpOutlined style={{ color: '#52c41a' }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
              )}
              <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
                {percentChange}%
              </span>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#fafafa' }}>
            <Statistic
              title="Period High"
              value={highPrice}
              precision={6}
              suffix="XRP"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#fafafa' }}>
            <Statistic
              title="Period Low"
              value={lowPrice}
              precision={6}
              suffix="XRP"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#fafafa' }}>
            <Statistic
              title="Average Price"
              value={avgPrice}
              precision={6}
              suffix="XRP"
            />
          </Card>
        </Col>
      </Row>

      {/* Area Chart */}
      <Card 
        type="inner" 
        style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={priceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#999"
            />
            <YAxis
              domain={['dataMin * 0.99', 'dataMax * 1.01']}
              tick={{ fontSize: 12 }}
              stroke="#999"
              tickFormatter={(value) => value.toFixed(4)}
              label={{ value: 'Price (XRP)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
              formatter={(value: number | undefined) => {
                if (value === undefined) return ['', ''];
                return [`${value.toFixed(6)} XRP`, 'Price'];
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#1890ff" 
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={{ fill: '#1890ff', r: 3 }}
              activeDot={{ r: 5, fill: '#1890ff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Insight */}
      <div style={{ marginTop: 16, padding: '12px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
        <Space>
          <span style={{ fontWeight: 500 }}>💡 Insight:</span>
          <span>
            Token price has {isPositive ? 'increased' : 'decreased'} by {Math.abs(parseFloat(percentChange))}% in the last period.
            {isPositive ? ' Market sentiment is positive.' : ' Consider buying opportunities.'}
          </span>
        </Space>
      </div>
    </Card>
  );
}