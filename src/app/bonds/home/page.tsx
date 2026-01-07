// src/app/page.tsx
'use client';

import { Card, Typography, Row, Col, Statistic, Button, Space } from 'antd';
import {
  BankOutlined,
  RocketOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  SafetyOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: <SafetyOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      title: 'Secure & Compliant',
      description: 'Built with Shariah-compliant principles ensuring ethical investments',
    },
    {
      icon: <GlobalOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: 'Global Access',
      description: 'Access halal investment opportunities from anywhere in the world',
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      title: 'Fast Transactions',
      description: 'Lightning-fast bond tokenization and settlement',
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      title: 'Transparent',
      description: 'Complete transparency in all transactions and holdings',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Bonds',
      description: 'Create and manage your bond portfolio',
      icon: <BankOutlined />,
      path: '/bonds/management',
      color: '#1890ff',
    },
    {
      title: 'Publish Bond',
      description: 'List your bonds for investors',
      icon: <RocketOutlined />,
      path: '/bonds/publish',
      color: '#52c41a',
    },
    {
      title: 'Purchase Bond',
      description: 'Invest in available bonds',
      icon: <ShoppingCartOutlined />,
      path: '/bonds/purchase',
      color: '#faad14',
    },
    {
      title: 'Price Analytics',
      description: 'Track token price movements',
      icon: <LineChartOutlined />,
      path: '/bonds/table',
      color: '#722ed1',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #66aceaff 0%, #4b5ca2ff 100%)' }}>
      {/* Hero Section */}
      <div className="p-8 md:p-16">
        <div className="max-w-7xl mx-auto text-center text-white">
          <Title level={1} style={{ color: 'white', fontSize: '3.5rem', marginBottom: 24 }}>
            🕌 Halal Chain
          </Title>
          <Paragraph style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.95)', maxWidth: 800, margin: '0 auto 48px' }}>
            The Future of Shariah-Compliant Bond Tokenization
          </Paragraph>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              style={{ height: 48, fontSize: 16, background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => router.push('/bonds/management')}
            >
              Get Started
            </Button>
            <Button
              size="large"
              style={{ height: 48, fontSize: 16, background: 'rgba(255,255,255,0.2)', borderColor: 'white', color: 'white' }}
              onClick={() => router.push('/bonds/purchase')}
            >
              Explore Bonds
            </Button>
          </Space>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
                <Statistic
                  title="Total Bonds"
                  value={127}
                  valueStyle={{ color: '#1890ff', fontSize: 36, fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
                <Statistic
                  title="Total Volume"
                  value={45.2}
                  suffix="M"
                  prefix="$"
                  valueStyle={{ color: '#52c41a', fontSize: 36, fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
                <Statistic
                  title="Active Investors"
                  value={2840}
                  valueStyle={{ color: '#faad14', fontSize: 36, fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
                <Statistic
                  title="Avg. Return"
                  value={8.5}
                  suffix="%"
                  valueStyle={{ color: '#722ed1', fontSize: 36, fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Title level={2} className="text-center text-white mb-8">
            Quick Actions
          </Title>
          <Row gutter={[24, 24]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card
                  hoverable
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 12,
                    height: '100%',
                    border: `2px solid ${action.color}`,
                  }}
                  onClick={() => router.push(action.path)}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div style={{ fontSize: 48, color: action.color }}>
                      {action.icon}
                    </div>
                    <Title level={4} style={{ margin: 0 }}>
                      {action.title}
                    </Title>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                      {action.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Title level={2} className="text-center text-white mb-8">
            Why Choose Halal Chain?
          </Title>
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 12,
                    height: '100%',
                    textAlign: 'center',
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>{feature.icon}</div>
                    <Title level={4} style={{ margin: 0 }}>
                      {feature.title}
                    </Title>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                      {feature.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 16,
              textAlign: 'center',
              padding: '24px',
            }}
          >
            <Title level={3}>Ready to Start Your Halal Investment Journey?</Title>
            <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
              Join thousands of investors who trust Halal Chain for ethical and transparent bond tokenization
            </Paragraph>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => router.push('/bonds/management')}
                style={{ height: 48, fontSize: 16 }}
              >
                Start Now
              </Button>
              <Button
                size="large"
                icon={<LineChartOutlined />}
                onClick={() => router.push('/bonds/table')}
                style={{ height: 48, fontSize: 16 }}
              >
                View Analytics
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
}