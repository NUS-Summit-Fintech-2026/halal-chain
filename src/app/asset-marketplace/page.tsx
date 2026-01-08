'use client';

import { Card, Button, Table, Space, Tag, Spin, message } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RealAsset {
  id: string;
  name: string;
  description: string;
  code: string;
  currencyCode: string | null;
  totalTokens: number;
  status: 'DRAFT' | 'PUBLISHED' | 'REALIZED';
  profitRate: number;
  currentValuationXrp: number | null;
  issuerAddress: string;
  treasuryAddress: string;
  createdAt: string;
}

export default function RealAssetMarketplacePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<RealAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch published assets from API
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/realassets/published');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        message.error('Failed to fetch assets');
      }
    } catch (error) {
      message.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleViewAsset = (assetId: string) => {
    router.push(`/asset-trade/${assetId}`);
  };

  const columns = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: RealAsset, b: RealAsset) => a.name.localeCompare(b.name),
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
      title: 'Valuation',
      dataIndex: 'currentValuationXrp',
      key: 'currentValuationXrp',
      render: (value: number | null) => value ? `${value.toLocaleString()} XRP` : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: RealAsset) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewAsset(record.id)}
          >
            View & Trade
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
      <Card
        title={
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            Real Asset Marketplace
          </span>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAssets}
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
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#666' }}>
            No published real assets available for trading yet.
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={assets}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );
}
