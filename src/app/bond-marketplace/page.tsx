'use client';

import { Card, Button, Table, Space, Tag, Spin, message } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/app/component/AuthGuard';

interface Bond {
  id: string;
  name: string;
  description: string;
  code: string;
  currencyCode: string | null;
  totalTokens: number;
  status: 'DRAFT' | 'PUBLISHED';
  profitRate: number;
  issuerAddress: string;
  treasuryAddress: string;
  createdAt: string;
}

export default function BondMarketplacePage() {
  const router = useRouter();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch published bonds from API
  const fetchBonds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bonds/published');
      if (res.ok) {
        const data = await res.json();
        setBonds(data);
      } else {
        message.error('Failed to fetch bonds');
      }
    } catch (error) {
      message.error('Failed to fetch bonds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonds();
  }, []);

  const handleViewBond = (bondId: string) => {
    router.push(`/trade/${bondId}`);
  };

  const columns = [
    {
      title: 'Bond Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Bond, b: Bond) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Currency Code',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
      render: (value: string | null) => value ? <Tag color="blue">{value}</Tag> : '-',
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Expected Return',
      dataIndex: 'profitRate',
      key: 'profitRate',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Bond) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewBond(record.id)}
          >
            View & Trade
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AuthGuard>
      <div style={{ marginLeft: 20, padding: '24px' }}>
        <Card
          title={
            <span style={{ fontSize: '20px', fontWeight: 600 }}>
              Bond Marketplace
            </span>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBonds}
              loading={loading}
            >
              Refresh
            </Button>
          }
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : bonds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, color: '#666' }}>
              No published bonds available for trading yet.
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={bonds}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}
