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

import { Card, Typography, Row, Col, Statistic, Button, Space, Spin } from 'antd';
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
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const { Title, Paragraph } = Typography;

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