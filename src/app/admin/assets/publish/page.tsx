'use client';

import { Card, Button, Descriptions, Space, message, Steps, InputNumber, Form, Spin, Tag, Result } from 'antd';
import { RocketOutlined, ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminGuard from '@/app/component/AdminGuard';

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
}

interface PublishResult {
  asset: RealAsset;
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

function PublishAssetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetCode = searchParams.get('assetCode');

  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<RealAsset | null>(null);
  const [pricePerToken, setPricePerToken] = useState<number>(1);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch asset data
  useEffect(() => {
    if (!assetCode) {
      message.error('No asset selected');
      router.push('/admin/assets');
      return;
    }

    async function fetchAsset() {
      try {
        const res = await fetch(`/api/realassets/code/${assetCode}`);
        if (res.ok) {
          const data = await res.json();
          setAsset(data);

          // If already published, go to step 2
          if (data.status === 'PUBLISHED' || data.status === 'REALIZED') {
            setCurrentStep(2);
          }
        } else {
          message.error('Asset not found');
          router.push('/admin/assets');
        }
      } catch (err) {
        message.error('Failed to fetch asset');
        router.push('/admin/assets');
      } finally {
        setLoading(false);
      }
    }

    fetchAsset();
  }, [assetCode, router]);

  const handlePublish = async () => {
    if (!asset || !pricePerToken || pricePerToken <= 0) {
      message.error('Please enter a valid price per token');
      return;
    }

    setIsPublishing(true);
    setCurrentStep(1);
    setError(null);

    try {
      const res = await fetch(`/api/realassets/code/${asset.code}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerToken }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setPublishResult(data);
        setAsset(data.asset);
        setCurrentStep(2);
        message.success('Asset published and tokenized successfully!');
      } else {
        setError(data.error || 'Failed to publish asset');
        setCurrentStep(0);
        message.error(data.error || 'Failed to publish asset');
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
    router.push('/admin/assets');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!asset) {
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
              Publish Real Asset
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
              description: 'Review asset details',
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
            title="Asset Published Successfully!"
            subTitle={`Your real asset has been tokenized on XRPL and is now available for trading.`}
            extra={[
              <Button type="primary" key="management" onClick={handleGoBack}>
                Back to Management
              </Button>,
              <Button key="trade" onClick={() => router.push(`/asset-trade/${asset.id}`)}>
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
        ) : asset.status !== 'DRAFT' ? (
          <Result
            status="success"
            title={asset.status === 'REALIZED' ? 'Asset Already Realized' : 'Asset Already Published'}
            subTitle={asset.status === 'REALIZED'
              ? 'This asset has been realized and is no longer tradable.'
              : 'This asset has already been tokenized and published.'}
            extra={[
              <Button type="primary" key="management" onClick={handleGoBack}>
                Back to Management
              </Button>,
              asset.status === 'PUBLISHED' && (
                <Button key="trade" onClick={() => router.push(`/asset-trade/${asset.id}`)}>
                  View Trading Page
                </Button>
              ),
            ]}
          >
            <Descriptions bordered column={1} style={{ marginTop: 24 }}>
              <Descriptions.Item label="Currency Code">
                <Tag color="blue">{asset.currencyCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Tokens">
                {asset.totalTokens.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={asset.status === 'REALIZED' ? 'blue' : 'green'}>{asset.status}</Tag>
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
              <Descriptions.Item label="Asset Name" span={2}>
                {asset.name}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {asset.description}
              </Descriptions.Item>
              <Descriptions.Item label="Asset Code">
                <Tag>{asset.code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Tokens">
                {asset.totalTokens.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Return">
                {(asset.profitRate * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="orange">{asset.status}</Tag>
              </Descriptions.Item>
              {asset.currentValuationXrp && (
                <Descriptions.Item label="Current Valuation" span={2}>
                  {asset.currentValuationXrp.toLocaleString()} XRP
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Issuer Address" span={2}>
                <a
                  href={`https://testnet.xrpl.org/accounts/${asset.issuerAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {asset.issuerAddress}
                  <LinkOutlined style={{ marginLeft: 4 }} />
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Treasury Address" span={2}>
                <a
                  href={`https://testnet.xrpl.org/accounts/${asset.treasuryAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {asset.treasuryAddress}
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
                  extra="This will be the initial sell price when the asset is listed on the XRPL DEX"
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
                  Total Value: <strong>{(asset.totalTokens * pricePerToken).toLocaleString()} XRP</strong>
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

export default function PublishAssetPage() {
  return (
    <AdminGuard>
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </div>
      }>
        <PublishAssetContent />
      </Suspense>
    </AdminGuard>
  );
}
