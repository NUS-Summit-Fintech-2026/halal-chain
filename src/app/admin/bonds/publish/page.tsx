'use client';

import { Card, Button, Descriptions, Space, message, Steps, InputNumber, Form, Spin, Tag, Result } from 'antd';
import { RocketOutlined, CheckCircleOutlined, ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminGuard from '@/app/component/AdminGuard';

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
}

interface PublishResult {
  bond: Bond;
  tokenize: {
    currencyCode: string;
    totalTokens: number;
    issuer: string;
    treasury: string;
  };
  initialSellOffer: {
    txHash: string;
    tokenAmount: number;
    pricePerToken: number;
    totalXrp: number;
  };
}

function PublishBondContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bondCode = searchParams.get('bondCode');

  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bond, setBond] = useState<Bond | null>(null);
  const [pricePerToken, setPricePerToken] = useState<number>(1);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch bond data
  useEffect(() => {
    if (!bondCode) {
      message.error('No bond selected');
      router.push('/admin/bonds');
      return;
    }

    async function fetchBond() {
      try {
        const res = await fetch(`/api/bonds/code/${bondCode}`);
        if (res.ok) {
          const data = await res.json();
          setBond(data);

          // If already published, go to step 2
          if (data.status === 'PUBLISHED') {
            setCurrentStep(2);
          }
        } else {
          message.error('Bond not found');
          router.push('/admin/bonds');
        }
      } catch (err) {
        message.error('Failed to fetch bond');
        router.push('/admin/bonds');
      } finally {
        setLoading(false);
      }
    }

    fetchBond();
  }, [bondCode, router]);

  const handlePublish = async () => {
    if (!bond || !pricePerToken || pricePerToken <= 0) {
      message.error('Please enter a valid price per token');
      return;
    }

    setIsPublishing(true);
    setCurrentStep(1); // Move to tokenizing step
    setError(null);

    try {
      const res = await fetch(`/api/bonds/code/${bond.code}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerToken }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setPublishResult(data);
        setBond(data.bond);
        setCurrentStep(2);
        message.success('Bond published and tokenized successfully!');
      } else {
        setError(data.error || 'Failed to publish bond');
        setCurrentStep(0); // Go back to review step
        message.error(data.error || 'Failed to publish bond');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setCurrentStep(0);
      message.error('Network error. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGoBack = () => {
    router.push('/management');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!bond) {
    return null;
  }

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
            />
            <span style={{ fontSize: '20px', fontWeight: 600 }}>
              Publish Bond
            </span>
          </Space>
        }
      >
        <Steps
          current={currentStep}
          style={{ marginBottom: 32 }}
          items={[
            {
              title: 'Review',
              description: 'Review bond details',
            },
            {
              title: 'Tokenize',
              description: 'Create blockchain tokens',
            },
            {
              title: 'Published',
              description: 'Available for purchase',
            },
          ]}
        />

        {currentStep === 2 && publishResult ? (
          <Result
            status="success"
            title="Bond Published Successfully!"
            subTitle={`Your bond has been tokenized on XRPL and is now available for trading.`}
            extra={[
              <Button type="primary" key="management" onClick={handleGoBack}>
                Back to Management
              </Button>,
              <Button key="trade" onClick={() => router.push(`/trade/${bond.id}`)}>
                View Trading Page
              </Button>,
            ]}
          >
            <Descriptions bordered column={1} style={{ marginTop: 24 }}>
              <Descriptions.Item label="Currency Code">
                <Tag color="blue">{publishResult.tokenize.currencyCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Tokens">
                {publishResult.tokenize.totalTokens.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Price per Token">
                {publishResult.initialSellOffer.pricePerToken} XRP
              </Descriptions.Item>
              <Descriptions.Item label="Initial Sell Offer">
                {publishResult.initialSellOffer.tokenAmount.toLocaleString()} tokens @ {publishResult.initialSellOffer.pricePerToken} XRP
              </Descriptions.Item>
              <Descriptions.Item label="Transaction Hash">
                <a
                  href={`https://testnet.xrpl.org/transactions/${publishResult.initialSellOffer.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {publishResult.initialSellOffer.txHash.slice(0, 20)}...
                  <LinkOutlined style={{ marginLeft: 4 }} />
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Issuer Address">
                <a
                  href={`https://testnet.xrpl.org/accounts/${publishResult.tokenize.issuer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {publishResult.tokenize.issuer.slice(0, 20)}...
                  <LinkOutlined style={{ marginLeft: 4 }} />
                </a>
              </Descriptions.Item>
            </Descriptions>
          </Result>
        ) : bond.status === 'PUBLISHED' ? (
          <Result
            status="success"
            title="Bond Already Published"
            subTitle="This bond has already been tokenized and published."
            extra={[
              <Button type="primary" key="management" onClick={handleGoBack}>
                Back to Management
              </Button>,
              <Button key="trade" onClick={() => router.push(`/trade/${bond.id}`)}>
                View Trading Page
              </Button>,
            ]}
          >
            <Descriptions bordered column={1} style={{ marginTop: 24 }}>
              <Descriptions.Item label="Currency Code">
                <Tag color="blue">{bond.currencyCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Tokens">
                {bond.totalTokens.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Result>
        ) : (
          <>
            <Descriptions
              bordered
              column={2}
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Bond Name" span={2}>
                {bond.name}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {bond.description}
              </Descriptions.Item>
              <Descriptions.Item label="Bond Code">
                <Tag>{bond.code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Tokens">
                {bond.totalTokens.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Profit Rate">
                {(bond.profitRate * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="orange">{bond.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Issuer Address" span={2}>
                <a
                  href={`https://testnet.xrpl.org/accounts/${bond.issuerAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {bond.issuerAddress}
                  <LinkOutlined style={{ marginLeft: 4 }} />
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Treasury Address" span={2}>
                <a
                  href={`https://testnet.xrpl.org/accounts/${bond.treasuryAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {bond.treasuryAddress}
                  <LinkOutlined style={{ marginLeft: 4 }} />
                </a>
              </Descriptions.Item>
            </Descriptions>

            <Card
              type="inner"
              title="Set Initial Price"
              style={{ marginBottom: 24 }}
            >
              <Form layout="vertical">
                <Form.Item
                  label="Price per Token (XRP)"
                  extra="This will be the initial sell price when the bond is listed on the XRPL DEX"
                  required
                >
                  <InputNumber
                    value={pricePerToken}
                    onChange={(val) => setPricePerToken(val || 0)}
                    min={0.000001}
                    step={0.1}
                    style={{ width: 200 }}
                    addonAfter="XRP"
                  />
                </Form.Item>
                <div style={{ color: '#666', marginTop: 8 }}>
                  Total Value: <strong>{(bond.totalTokens * pricePerToken).toLocaleString()} XRP</strong>
                </div>
              </Form>
            </Card>

            {error && (
              <div style={{ color: 'red', marginBottom: 16 }}>
                Error: {error}
              </div>
            )}

            <Space>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={handlePublish}
                loading={isPublishing}
              >
                {isPublishing ? 'Publishing...' : 'Publish & Tokenize'}
              </Button>

              <Button size="large" onClick={handleGoBack}>
                Cancel
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
}

export default function PublishBondPage() {
  return (
    <AdminGuard>
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </div>
      }>
        <PublishBondContent />
      </Suspense>
    </AdminGuard>
  );
}
