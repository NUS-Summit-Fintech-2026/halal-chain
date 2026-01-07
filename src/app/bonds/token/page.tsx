'use client';

import { Card, Button, Table, Space, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Bond {
  key: string;
  name: string;
  code: string;
  status: 'draft' | 'active' | 'completed';
  value: number;
  maturityDate: string;
  issuer: string;
  expectedReturn: string;
}

export default function BondMarketplacePage() {
  const router = useRouter();
  
  // Sample bonds data - only showing active bonds for marketplace
  const [bonds] = useState<Bond[]>([
    {
      key: '1',
      name: 'Government Sukuk 2026',
      code: 'US092189AC02',
      status: 'active',
      value: 1000000,
      maturityDate: '2026-12-31',
      issuer: 'Ministry of Finance',
      expectedReturn: '5% annually',
    },
    {
      key: '2',
      name: 'Corporate Green Bond 2027',
      code: 'GB123456XY78',
      status: 'active',
      value: 2500000,
      maturityDate: '2027-06-30',
      issuer: 'Green Energy Corp',
      expectedReturn: '6.5% annually',
    },
    {
      key: '3',
      name: 'Infrastructure Bond 2028',
      code: 'INF789012ZW34',
      status: 'active',
      value: 5000000,
      maturityDate: '2028-03-31',
      issuer: 'National Infrastructure Bank',
      expectedReturn: '7% annually',
    },
  ]);

  const handleViewBond = (bondId: string) => {
    router.push(`/bonds/trade/${bondId}`);
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
      title: 'Issuer',
      dataIndex: 'issuer',
      key: 'issuer',
    },
    {
      title: 'Total Value (XRP)',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Maturity Date',
      dataIndex: 'maturityDate',
      key: 'maturityDate',
    },
    {
      title: 'Expected Return',
      dataIndex: 'expectedReturn',
      key: 'expectedReturn',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'success',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Bond) => (
        <Space>
          <Button 
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewBond(record.key)}
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
            Bond Marketplace
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={bonds}
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
}