'use client';

import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LoginOutlined, UserAddOutlined, SettingOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';

const { Title, Text } = Typography;

export default function AdminLoginPage() {
  const router = useRouter();
  const { admin, isLoading, signIn, signUp } = useAdminAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && admin) {
      router.push('/admin/bonds');
    }
  }, [admin, isLoading, router]);

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      const result = isSignUp
        ? await signUp(values.email)
        : await signIn(values.email);

      if (result.ok) {
        message.success(isSignUp ? 'Admin account created!' : 'Welcome back, Admin!');
        router.push('/admin/bonds');
      } else {
        message.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (admin) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: 24,
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SettingOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Admin Portal
          </Title>
          <Text type="secondary">
            {isSignUp ? 'Create admin account' : 'Sign in to manage'}
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
              { required: true, message: 'Please enter admin name' },
            ]}
            extra="Your admin ID will be: [name]@admin"
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Admin name (e.g., john)"
              suffix={<Text type="secondary">@admin</Text>}
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
              {isSignUp ? 'Create Admin Account' : 'Sign In'}
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
          {isSignUp ? 'Sign In Instead' : 'Create Admin Account'}
        </Button>
      </Card>
    </div>
  );
}
