'use client';

import { Select } from 'antd';
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

  const generatePriceData = (days: number, base: number, rate: number): PriceData[] => {
    const cacheKey = `${bondId}-${days}-${base}-${rate}`;
    if (generatedRef.current[cacheKey]) return generatedRef.current[cacheKey];

    const data: PriceData[] = [];
    let currentPrice = base;
    const fluctuationRange = base * rate;
    const minPrice = base * (1 - rate);
    const maxPrice = base * (1 + rate);

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
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
    const timeRanges: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const data = generatePriceData(timeRanges[timeRange], basePrice, profitRate);
    setPriceData(data);
    if (onPriceUpdate && data.length > 0) onPriceUpdate(data[data.length - 1].price);
  }, [timeRange, bondId, basePrice, profitRate]);

  if (priceData.length === 0) return null;

  const currentPrice = priceData[priceData.length - 1].price;
  const previousPrice = priceData[priceData.length - 2].price;
  const priceChange = currentPrice - previousPrice;
  const percentChange = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const highPrice = Math.max(...priceData.map(d => d.price));
  const lowPrice = Math.min(...priceData.map(d => d.price));
  const avgPrice = (priceData.reduce((sum, d) => sum + d.price, 0) / priceData.length).toFixed(6);

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
  };

  const statCard: React.CSSProperties = {
    padding: '16px 18px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    flex: '1 1 140px',
  };

  return (
    <div style={{ ...glassCard, padding: 24, marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: 'rgba(0, 191, 99, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <LineChartOutlined style={{ color: '#00bf63', fontSize: 18 }} />
          </div>
          <span style={{ color: '#f5f5f5', fontSize: 17, fontWeight: 700 }}>Token Price</span>
        </div>
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 130 }}
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]}
          styles={{ popup: { root: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' } } }}
        />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ ...statCard, borderColor: isPositive ? 'rgba(0,191,99,0.15)' : 'rgba(255,77,77,0.15)' }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            Current Price
          </div>
          <div style={{ color: '#f5f5f5', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            {currentPrice.toFixed(6)}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 400, marginLeft: 4 }}>XRP</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isPositive
              ? <ArrowUpOutlined style={{ color: '#00bf63', fontSize: 11 }} />
              : <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: 11 }} />}
            <span style={{ color: isPositive ? '#00bf63' : '#ff4d4f', fontSize: 12, fontWeight: 600 }}>
              {percentChange}%
            </span>
          </div>
        </div>

        <div style={statCard}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            Period High
          </div>
          <div style={{ color: '#00bf63', fontSize: 18, fontWeight: 700 }}>
            {highPrice.toFixed(6)}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 400, marginLeft: 4 }}>XRP</span>
          </div>
        </div>

        <div style={statCard}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            Period Low
          </div>
          <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 700 }}>
            {lowPrice.toFixed(6)}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 400, marginLeft: 4 }}>XRP</span>
          </div>
        </div>

        <div style={statCard}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            Average Price
          </div>
          <div style={{ color: '#f5f5f5', fontSize: 18, fontWeight: 700 }}>
            {avgPrice}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 400, marginLeft: 4 }}>XRP</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 8px 8px',
        marginBottom: 16,
      }}>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={priceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00bf63" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00bf63" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              domain={['dataMin * 0.99', 'dataMax * 1.01']}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toFixed(4)}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: '#f5f5f5',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value.toFixed(6)} XRP`, 'Price']}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00bf63"
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={false}
              activeDot={{ r: 4, fill: '#00bf63', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      <div style={{
        padding: '10px 14px',
        background: isPositive ? 'rgba(0, 191, 99, 0.06)' : 'rgba(255, 77, 79, 0.06)',
        borderRadius: 8,
        border: `1px solid ${isPositive ? 'rgba(0, 191, 99, 0.15)' : 'rgba(255, 77, 79, 0.15)'}`,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
      }}>
        <span style={{ color: isPositive ? '#00bf63' : '#ff4d4f', fontWeight: 600 }}>
          {isPositive ? '↑' : '↓'} Insight:
        </span>{' '}
        Token price has {isPositive ? 'increased' : 'decreased'} by {Math.abs(parseFloat(percentChange))}% in the last period.
        {isPositive ? ' Market sentiment is positive.' : ' Consider buying opportunities.'}
      </div>
    </div>
  );
}
