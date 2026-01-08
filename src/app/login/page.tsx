'use client';

import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Redirect if already logged in
  if (user) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      const result = isSignUp
        ? await signUp(values.email)
        : await signIn(values.email);

      if (result.ok) {
        message.success(isSignUp ? 'Account created successfully!' : 'Welcome back!');
        router.push('/');
      } else {
        message.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24,
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Halal Chain
          </Title>
          <Text type="secondary">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Email address"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={isSignUp ? <UserAddOutlined /> : <LoginOutlined />}
              block
              style={{ height: 48 }}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
        </Divider>

        <Button
          type="link"
          onClick={() => {
            setIsSignUp(!isSignUp);
            form.resetFields();
          }}
          block
          icon={isSignUp ? <LoginOutlined /> : <UserAddOutlined />}
        >
          {isSignUp ? 'Sign In Instead' : 'Create Account'}
        </Button>

        {isSignUp && (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
            A new XRPL wallet will be automatically created for you with test funds.
          </Text>
        )}
      </Card>
    </div>
  );
}
