'use client';

import { Card, Row, Col, Statistic, Space, Select } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, LineChartOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useState } from 'react';

export default function TokenPricesPage() {
  const [timeRange, setTimeRange] = useState('7d');

  // Generate dummy data for different time ranges
  const generateData = (days: number) => {
    const data = [];
    const basePrice = 100;
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random price fluctuation between -2 and +2
      const change = (Math.random() - 0.5) * 4;
      currentPrice = Math.max(95, Math.min(105, currentPrice + change));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: parseFloat(currentPrice.toFixed(2)),
      });
    }
    return data;
  };

  const timeRanges: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const data = generateData(timeRanges[timeRange]);
  
  const currentPrice = data[data.length - 1].price;
  const previousPrice = data[data.length - 2].price;
  const priceChange = currentPrice - previousPrice;
  const percentChange = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const highPrice = Math.max(...data.map(d => d.price));
  const lowPrice = Math.min(...data.map(d => d.price));
  const avgPrice = (data.reduce((sum, d) => sum + d.price, 0) / data.length).toFixed(2);

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
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
      >
        {/* Statistics Row */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ background: '#fafafa' }}>
              <Statistic
                title="Current Price"
                value={currentPrice}
                precision={2}
                suffix="RLUSD"
                valueStyle={{ color: '#1890ff', fontSize: '28px' }}
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
                title="24h High"
                value={highPrice}
                precision={2}
                suffix="RLUSD"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#fafafa' }}>
              <Statistic
                title="24h Low"
                value={lowPrice}
                precision={2}
                suffix="RLUSD"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#fafafa' }}>
              <Statistic
                title="Average Price"
                value={avgPrice}
                precision={2}
                suffix="RLUSD"
              />
            </Card>
          </Col>
        </Row>

        {/* Line Chart */}
        <Card 
          type="inner" 
          style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 12 }}
                stroke="#999"
                label={{ value: 'Price (RLUSD)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
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
                    return [`${value.toFixed(2)} RLUSD`, 'Price'];
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

        {/* Additional Info */}
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
    </div>
  );
}