// 'use client';

// import { Button, Card, Input, Space, Typography, Divider, Form, message } from 'antd';
// import { SearchOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';

// const { Title, Paragraph, Text } = Typography;

// export default function Home() {
//   const [messageApi, contextHolder] = message.useMessage();

//   const handleClick = () => {
//     messageApi.success('Button clicked!');
//   };

//   const onFinish = (values: { username: string; password: string }) => {
//     messageApi.success(`Welcome, ${values.username}!`);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       {contextHolder}
//       <div className="max-w-4xl mx-auto">
//         <Title level={1}>Halal Chain</Title>
//         <Paragraph>
//           This is a sample page using Ant Design components with custom ConfigProvider theme.
//         </Paragraph>

//         <Divider />

//         <Space direction="vertical" size="large" className="w-full">
//           {/* Button Examples */}
//           <Card title="Button Examples">
//             <Space wrap>
//               <Button type="primary" onClick={handleClick}>
//                 Primary Button
//               </Button>
//               <Button onClick={handleClick}>Default Button</Button>
//               <Button type="dashed" onClick={handleClick}>
//                 Dashed Button
//               </Button>
//               <Button type="primary" icon={<SearchOutlined />}>
//                 Search
//               </Button>
//               <Button type="primary" danger>
//                 Danger
//               </Button>
//             </Space>
//           </Card>

//           {/* Input Examples */}
//           <Card title="Input Examples">
//             <Space direction="vertical" className="w-full" size="middle">
//               <Input placeholder="Basic Input" />
//               <Input prefix={<UserOutlined />} placeholder="Username" />
//               <Input.Password prefix={<LockOutlined />} placeholder="Password" />
//               <Input.Search placeholder="Search..." enterButton />
//             </Space>
//           </Card>

//           {/* Form Example */}
//           <Card title="Sample Login Form">
//             <Form
//               name="login"
//               layout="vertical"
//               onFinish={onFinish}
//               autoComplete="off"
//               style={{ maxWidth: 400 }}
//             >
//               <Form.Item
//                 label="Username"
//                 name="username"
//                 rules={[{ required: true, message: 'Please input your username!' }]}
//               >
//                 <Input prefix={<UserOutlined />} placeholder="Enter username" />
//               </Form.Item>

//               <Form.Item
//                 label="Password"
//                 name="password"
//                 rules={[{ required: true, message: 'Please input your password!' }]}
//               >
//                 <Input.Password prefix={<LockOutlined />} placeholder="Enter password" />
//               </Form.Item>

//               <Form.Item>
//                 <Button type="primary" htmlType="submit" block>
//                   Login
//                 </Button>
//               </Form.Item>
//             </Form>
//           </Card>

//           {/* Typography Example */}
//           <Card title="Typography Examples">
//             <Title level={2}>Heading Level 2</Title>
//             <Title level={3}>Heading Level 3</Title>
//             <Paragraph>
//               This is a paragraph with <Text strong>strong text</Text>,{' '}
//               <Text code>code text</Text>, and{' '}
//               <Text type="success">success text</Text>.
//             </Paragraph>
//             <Paragraph type="secondary">
//               This is secondary paragraph text for less emphasis.
//             </Paragraph>
//           </Card>
//         </Space>
//       </div>
//     </div>
//   );
// }

// src/app/page.tsx
'use client';

import { Card, Typography, Row, Col, Space, Spin, Divider } from 'antd';
import {
  SafetyOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  BankOutlined,
  HomeOutlined,
  HeartOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const whyHalal = [
    {
      icon: <SafetyOutlined style={{ fontSize: 40, color: '#52c41a' }} />,
      title: 'Shariah-Compliant',
      description: 'All investments follow Islamic finance principles - no riba (interest), no gharar (uncertainty), and full transparency in profit-sharing.',
    },
    {
      icon: <LockOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
      title: 'Secure & Trustworthy',
      description: 'Built on XRPL blockchain with clawback-enabled smart contracts ensuring your investments are protected and redeemable at maturity.',
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 40, color: '#faad14' }} />,
      title: 'Fast & Low Cost',
      description: 'XRPL settles transactions in 3-5 seconds with minimal fees (< $0.01), making tokenized investments accessible to everyone.',
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 40, color: '#722ed1' }} />,
      title: 'Fully Transparent',
      description: 'Every transaction is recorded on the public XRPL blockchain. View your holdings, trades, and redemptions anytime on the explorer.',
    },
  ];

  const platformFeatures = [
    {
      icon: <BankOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      title: 'Sukuk Bond Trading',
      description: 'Invest in tokenized Shariah-compliant bonds (Sukuk). Buy fractional ownership and earn halal returns upon maturity.',
      path: '/bond-marketplace',
    },
    {
      icon: <HomeOutlined style={{ fontSize: 36, color: '#52c41a' }} />,
      title: 'Real Asset Investment',
      description: 'Own fractions of real-world assets like properties and commodities. Receive proportional payouts when assets are sold.',
      path: '/asset-marketplace',
    },
    {
      icon: <HeartOutlined style={{ fontSize: 36, color: '#eb2f96' }} />,
      title: 'Zakat & Charity',
      description: 'Fulfill your Islamic obligations easily. Donate to verified charities directly from your wallet with transparent tracking.',
      path: '/charity',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Create Account',
      description: 'Sign up with your email. We automatically create and fund your XRPL wallet with testnet XRP.',
    },
    {
      step: '2',
      title: 'Browse Marketplace',
      description: 'Explore available Sukuk bonds and tokenized real assets. View expected returns, maturity dates, and documentation.',
    },
    {
      step: '3',
      title: 'Invest & Trade',
      description: 'Buy tokens at market price or place limit orders. Trade anytime on the decentralized order book.',
    },
    {
      step: '4',
      title: 'Earn Returns',
      description: 'Receive XRP payouts when bonds mature or assets are sold. All returns are distributed automatically on-chain.',
    },
  ];

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2d5a87 50%, #3d7ea6 100%)',
        padding: '60px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Title level={1} style={{ color: 'white', fontSize: '3rem', marginBottom: 16, fontWeight: 700 }}>
            Halal Chain
          </Title>
          <Paragraph style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: 24,
            lineHeight: 1.6,
          }}>
            Invest in Shariah-compliant bonds and real assets on the XRP Ledger.
            <br />
            Fractional ownership, transparent trading, and guaranteed redemption.
          </Paragraph>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            padding: '12px 24px',
            borderRadius: 8,
            backdropFilter: 'blur(10px)',
          }}>
            <Text style={{ color: 'white', fontSize: '1rem' }}>
              Powered by <strong>XRPL</strong> - Fast, Green, and Decentralized
            </Text>
          </div>
        </div>
      </div>

      {/* Why Halal Chain Section */}
      <div style={{ padding: '60px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
            Why Choose Halal Chain?
          </Title>
          <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: 48, fontSize: '1.1rem' }}>
            A platform designed for Muslim investors seeking ethical, transparent, and accessible investments
          </Paragraph>
          <Row gutter={[32, 32]}>
            {whyHalal.map((item, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card
                  bordered={false}
                  style={{
                    height: '100%',
                    borderRadius: 16,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      background: '#f0f5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {item.icon}
                    </div>
                    <Title level={4} style={{ margin: 0 }}>{item.title}</Title>
                    <Paragraph style={{ color: '#666', margin: 0, lineHeight: 1.6 }}>
                      {item.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Platform Features Section */}
      <div style={{ padding: '60px 24px', background: '#f5f7fa' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
            Platform Features
          </Title>
          <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: 48, fontSize: '1.1rem' }}>
            Everything you need to invest, trade, and manage your halal portfolio
          </Paragraph>
          <Row gutter={[24, 24]}>
            {platformFeatures.map((feature, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card
                  hoverable
                  onClick={() => router.push(feature.path)}
                  style={{
                    height: '100%',
                    borderRadius: 12,
                    border: '1px solid #e8e8e8',
                    cursor: 'pointer',
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}>
                      {feature.icon}
                    </div>
                    <Title level={5} style={{ margin: 0 }}>{feature.title}</Title>
                    <Paragraph style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
                      {feature.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{ padding: '60px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
            How It Works
          </Title>
          <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: 48, fontSize: '1.1rem' }}>
            Start investing in 4 simple steps
          </Paragraph>
          <Row gutter={[24, 24]}>
            {howItWorks.map((item, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a365d 0%, #2d5a87 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}>
                    {item.step}
                  </div>
                  <Title level={5} style={{ marginBottom: 8 }}>{item.title}</Title>
                  <Paragraph style={{ color: '#666', margin: 0 }}>
                    {item.description}
                  </Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* XRPL Benefits Section */}
      <div style={{
        padding: '48px 24px',
        background: 'linear-gradient(135deg, #1a365d 0%, #2d5a87 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Title level={3} style={{ color: 'white', marginBottom: 16 }}>
            Built on XRP Ledger
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: 24 }}>
            XRPL is one of the most sustainable and efficient blockchains, settling transactions in seconds with near-zero fees and minimal energy consumption.
          </Paragraph>
          <Row gutter={[48, 16]} justify="center">
            <Col>
              <Text style={{ color: 'white', fontSize: '1rem' }}>
                <ThunderboltOutlined style={{ marginRight: 8 }} />
                3-5 Second Settlement
              </Text>
            </Col>
            <Col>
              <Text style={{ color: 'white', fontSize: '1rem' }}>
                <CheckCircleOutlined style={{ marginRight: 8 }} />
                &lt; $0.01 Transaction Fee
              </Text>
            </Col>
            <Col>
              <Text style={{ color: 'white', fontSize: '1rem' }}>
                <SafetyOutlined style={{ marginRight: 8 }} />
                Carbon Neutral
              </Text>
            </Col>
          </Row>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '24px', textAlign: 'center', background: '#f5f7fa' }}>
        <Text type="secondary">
          Halal Chain - Shariah-Compliant Tokenization Platform on XRPL
        </Text>
      </div>
    </div>
  );
}