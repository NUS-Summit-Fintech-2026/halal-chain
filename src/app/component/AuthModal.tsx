'use client';

import { Modal, Form, Input, Button, message, Tabs } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [form] = Form.useForm();

  const handleSignIn = async (values: { email: string }) => {
    setLoading(true);
    const result = await signIn(values.email);
    setLoading(false);

    if (result.ok) {
      message.success('Signed in successfully!');
      form.resetFields();
      onClose();
    } else {
      message.error(result.error);
    }
  };

  const handleSignUp = async (values: { email: string }) => {
    setLoading(true);
    const result = await signUp(values.email);
    setLoading(false);

    if (result.ok) {
      message.success('Account created successfully! Wallet has been generated.');
      form.resetFields();
      onClose();
    } else {
      message.error(result.error);
    }
  };

  const handleSubmit = async (values: { email: string }) => {
    if (activeTab === 'signin') {
      await handleSignIn(values);
    } else {
      await handleSignUp(values);
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={[
          { key: 'signin', label: 'Sign In' },
          { key: 'signup', label: 'Sign Up' },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter your email"
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            {activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
        </Form.Item>

        {activeTab === 'signup' && (
          <div style={{ marginTop: 12, color: '#666', fontSize: 12, textAlign: 'center' }}>
            A new XRPL wallet will be created for you automatically.
          </div>
        )}
      </Form>
    </Modal>
  );
}
