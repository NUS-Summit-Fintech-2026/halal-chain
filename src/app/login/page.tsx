'use client';

import { App, Form, Input, Button } from 'antd';
import { MailOutlined, LoginOutlined, UserAddOutlined, BlockOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  // Redirect if already logged in
  if (user) {
    router.push('/bond-marketplace');
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
        router.push('/bond-marketplace');
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
      background: '#0a0a0a',
      position: 'relative',
      overflow: 'hidden',
      padding: 24,
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,191,99,0.08) 0%, transparent 70%)',
        top: '-10%',
        right: '-10%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,191,99,0.05) 0%, transparent 70%)',
        bottom: '-10%',
        left: '-10%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 32,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #00bf63, #00a855)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <BlockOutlined style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <h2 style={{ margin: '0 0 4px', color: '#f5f5f5', fontSize: 28, fontWeight: 700 }}>
            Amanah
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0 }}>
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          className="dark-input"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
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
              className="green-glow-btn"
              style={{ height: 48, borderRadius: 10, fontSize: 15, fontWeight: 600 }}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <Button
          type="link"
          onClick={() => {
            setIsSignUp(!isSignUp);
            form.resetFields();
          }}
          block
          icon={isSignUp ? <LoginOutlined /> : <UserAddOutlined />}
          style={{ color: '#00bf63' }}
        >
          {isSignUp ? 'Sign In Instead' : 'Create Account'}
        </Button>

        {isSignUp && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 0 }}>
            A new XRPL wallet will be automatically created for you with test funds.
          </p>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            type="link"
            onClick={() => router.push('/')}
            style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, padding: 0 }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
