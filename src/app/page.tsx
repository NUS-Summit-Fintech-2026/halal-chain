'use client';

import { Button, Card, Input, Space, Typography, Divider, Form, message } from 'antd';
import { SearchOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const [messageApi, contextHolder] = message.useMessage();

  const handleClick = () => {
    messageApi.success('Button clicked!');
  };

  const onFinish = (values: { username: string; password: string }) => {
    messageApi.success(`Welcome, ${values.username}!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {contextHolder}
      <div className="max-w-4xl mx-auto">
        <Title level={1}>Halal Chain</Title>
        <Paragraph>
          This is a sample page using Ant Design components with custom ConfigProvider theme.
        </Paragraph>

        <Divider />

        <Space direction="vertical" size="large" className="w-full">
          {/* Button Examples */}
          <Card title="Button Examples">
            <Space wrap>
              <Button type="primary" onClick={handleClick}>
                Primary Button
              </Button>
              <Button onClick={handleClick}>Default Button</Button>
              <Button type="dashed" onClick={handleClick}>
                Dashed Button
              </Button>
              <Button type="primary" icon={<SearchOutlined />}>
                Search
              </Button>
              <Button type="primary" danger>
                Danger
              </Button>
            </Space>
          </Card>

          {/* Input Examples */}
          <Card title="Input Examples">
            <Space direction="vertical" className="w-full" size="middle">
              <Input placeholder="Basic Input" />
              <Input prefix={<UserOutlined />} placeholder="Username" />
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              <Input.Search placeholder="Search..." enterButton />
            </Space>
          </Card>

          {/* Form Example */}
          <Card title="Sample Login Form">
            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              style={{ maxWidth: 400 }}
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please input your username!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Enter username" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Typography Example */}
          <Card title="Typography Examples">
            <Title level={2}>Heading Level 2</Title>
            <Title level={3}>Heading Level 3</Title>
            <Paragraph>
              This is a paragraph with <Text strong>strong text</Text>,{' '}
              <Text code>code text</Text>, and{' '}
              <Text type="success">success text</Text>.
            </Paragraph>
            <Paragraph type="secondary">
              This is secondary paragraph text for less emphasis.
            </Paragraph>
          </Card>
        </Space>
      </div>
    </div>
  );
}
