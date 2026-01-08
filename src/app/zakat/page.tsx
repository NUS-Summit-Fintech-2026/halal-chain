'use client';

import { Card, Button, List, Typography, Spin, message, Modal, Result, Statistic, Row, Col, Tag } from 'antd';
import { HeartOutlined, WalletOutlined, ReloadOutlined, CheckCircleOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/app/component/AuthGuard';

const { Title, Text, Paragraph } = Typography;

const ZAKAT_RATE = 0.025; // 2.5%

interface Charity {
  id: string;
  did?: string;
  name: string;
  description: string;
  walletAddress: string;
  totalReceived: number;
  _count?: {
    donations: number;
  };
}

interface DonationResult {
  id: string;
  charityName: string;
  xrpAmount: number;
  txHash: string;
  zakatRate: string;
  donorBalance: number;
  donateableBalance: number;
}

export default function ZakatDonationPage() {
  const { user, isLoading: authLoading, getAuthHeader } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [xrpBalance, setXrpBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [donating, setDonating] = useState<string | null>(null);
  const [donationResult, setDonationResult] = useState<DonationResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [copiedDid, setCopiedDid] = useState<string | null>(null);

  const handleCopyDid = async (did: string) => {
    try {
      await navigator.clipboard.writeText(did);
      setCopiedDid(did);
      message.success('DID copied to clipboard!');
      setTimeout(() => setCopiedDid(null), 2000);
    } catch {
      message.error('Failed to copy');
    }
  };

  const reserveBuffer = 15;
  const donateableBalance = Math.max(0, xrpBalance - reserveBuffer);
  // Round to 2 decimal places to avoid XRP precision issues
  const zakatAmount = Math.round(donateableBalance * ZAKAT_RATE * 100) / 100;

  // Fetch charities
  const fetchCharities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/charities');
      if (res.ok) {
        const data = await res.json();
        setCharities(data);
      }
    } catch (error) {
      message.error('Failed to fetch charities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's XRP balance
  const fetchBalance = async () => {
    if (!user) return;

    setBalanceLoading(true);
    try {
      const res = await fetch('/api/me/balance', {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        const xrp = data.balances?.find((b: any) => b.currency === 'XRP');
        setXrpBalance(xrp ? parseFloat(xrp.value) : 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchCharities();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const handleDonate = async (charityId: string) => {
    if (!user) {
      message.error('Please sign in to donate');
      return;
    }

    if (zakatAmount < 0.01) {
      message.error('Insufficient balance to donate Zakat (minimum 0.01 XRP)');
      return;
    }

    setDonating(charityId);
    try {
      const res = await fetch('/api/zakat/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ charityId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDonationResult(data.donation);
        setResultModalOpen(true);
        fetchBalance();
        fetchCharities();
      } else {
        message.error(data.error || 'Failed to process donation');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setDonating(null);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div style={{ marginLeft: 20, padding: '24px' }}>
        {/* Header Card with Balance Info */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row gutter={24} align="middle">
          <Col span={16}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              <HeartOutlined style={{ marginRight: 12 }} />
              Zakat Donation
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8, marginBottom: 0, fontSize: 16 }}>
              Zakat is one of the Five Pillars of Islam. It requires Muslims to donate 2.5% of their qualifying wealth to those in need.
            </Paragraph>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            {user ? (
              <Card size="small" style={{ display: 'inline-block', minWidth: 200 }}>
                <Statistic
                  title="Your XRP Balance"
                  value={xrpBalance}
                  precision={2}
                  suffix="XRP"
                  loading={balanceLoading}
                  prefix={<WalletOutlined />}
                />
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                  onClick={fetchBalance}
                  loading={balanceLoading}
                  size="small"
                >
                  Refresh
                </Button>
              </Card>
            ) : (
              <Card size="small" style={{ display: 'inline-block' }}>
                <Text type="secondary">Sign in to view balance</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      {/* Zakat Calculation Card */}
      {user && (
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>Your Zakat Calculation</Title>
          <Row gutter={24}>
            <Col span={6}>
              <Statistic
                title="Total Balance"
                value={xrpBalance}
                precision={2}
                suffix="XRP"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Reserve (Locked)"
                value={reserveBuffer}
                suffix="XRP"
                valueStyle={{ color: '#999' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Donateable Balance"
                value={donateableBalance}
                precision={2}
                suffix="XRP"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={`Zakat (${ZAKAT_RATE * 100}%)`}
                value={zakatAmount}
                precision={2}
                suffix="XRP"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Charity List */}
      <Card
        title={
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            Select a Charity
          </span>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCharities}
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
        ) : charities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#666' }}>
            No charities available yet.
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={charities}
            renderItem={(charity) => (
              <List.Item
                actions={[
                  <Button
                    key="donate"
                    type="primary"
                    icon={<HeartOutlined />}
                    onClick={() => handleDonate(charity.id)}
                    loading={donating === charity.id}
                    disabled={!user || zakatAmount < 0.01 || donating !== null}
                  >
                    {donating === charity.id ? 'Donating...' : `Donate ${zakatAmount.toFixed(2)} XRP`}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <HeartOutlined style={{ color: '#fff', fontSize: 24 }} />
                    </div>
                  }
                  title={
                    <span style={{ fontSize: 16 }}>
                      {charity.name}
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        {charity.totalReceived.toFixed(2)} XRP received
                      </Tag>
                      <Tag color="blue">
                        {charity._count?.donations || 0} donations
                      </Tag>
                    </span>
                  }
                  description={
                    <>
                      <Paragraph style={{ marginBottom: 4 }}>{charity.description}</Paragraph>
                      {charity.did && (
                        <div style={{ marginBottom: 4 }}>
                          <Tag
                            color={copiedDid === charity.did ? 'green' : 'purple'}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 10,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onClick={() => handleCopyDid(charity.did!)}
                          >
                            {charity.did}
                            <CopyOutlined style={{ marginLeft: 6 }} />
                          </Tag>
                        </div>
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Wallet:{' '}
                        <a
                          href={`https://testnet.xrpl.org/accounts/${charity.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {charity.walletAddress.slice(0, 12)}...{charity.walletAddress.slice(-8)}
                          <LinkOutlined style={{ marginLeft: 4 }} />
                        </a>
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Success Modal */}
      <Modal
        open={resultModalOpen}
        footer={[
          <Button key="close" type="primary" onClick={() => setResultModalOpen(false)}>
            Close
          </Button>,
        ]}
        onCancel={() => setResultModalOpen(false)}
        width={500}
      >
        {donationResult && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Zakat Donated Successfully!"
            subTitle={`May Allah accept your Zakat and bless you abundantly.`}
            extra={[
              <div key="details" style={{ textAlign: 'left', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                <p><strong>Charity:</strong> {donationResult.charityName}</p>
                <p><strong>Amount:</strong> {donationResult.xrpAmount.toFixed(2)} XRP</p>
                <p><strong>Zakat Rate:</strong> {donationResult.zakatRate}</p>
                <p>
                  <strong>Transaction:</strong>{' '}
                  <a
                    href={`https://testnet.xrpl.org/transactions/${donationResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on XRPL Explorer <LinkOutlined />
                  </a>
                </p>
              </div>,
            ]}
          />
        )}
      </Modal>
      </div>
    </AuthGuard>
  );
}
