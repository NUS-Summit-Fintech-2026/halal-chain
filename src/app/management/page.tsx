'use client';

import { Card, Button, Table, Modal, Form, Input, InputNumber, Select, Space, Tag, Popconfirm, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RocketOutlined, ReloadOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Bond {
  id: string;
  name: string;
  description: string;
  code: string;
  currencyCode: string | null;
  totalTokens: number;
  status: 'DRAFT' | 'PUBLISHED';
  profitRate: number;
  fileUrl: string | null;
  issuerAddress: string;
  treasuryAddress: string;
  createdAt: string;
}

export default function BondsPage() {
  const router = useRouter();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBond, setEditingBond] = useState<Bond | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Fetch bonds from API
  const fetchBonds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bonds');
      if (res.ok) {
        const data = await res.json();
        setBonds(data);
      } else {
        message.error('Failed to fetch bonds');
      }
    } catch (error) {
      message.error('Failed to fetch bonds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonds();
  }, []);

  const handleCreate = () => {
    setEditingBond(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (bond: Bond) => {
    setEditingBond(bond);
    form.setFieldsValue({
      name: bond.name,
      description: bond.description,
      code: bond.code,
      totalTokens: bond.totalTokens,
      profitRate: bond.profitRate,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bonds/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        message.success('Bond deleted successfully');
        fetchBonds(); // Refresh list
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to delete bond');
      }
    } catch (error) {
      message.error('Failed to delete bond');
    }
  };

  const handlePublish = (bond: Bond) => {
    router.push(`/publish?bondCode=${bond.code}`);
  };

  const handleViewTreasury = (bond: Bond) => {
    if (bond.treasuryAddress) {
      const explorerUrl = `https://testnet.xrpl.org/accounts/${bond.treasuryAddress}`;
      window.open(explorerUrl, '_blank');
    } else {
      message.error('Treasury address not available');
    }
  };

  const handleSimulateExpired = async (bond: Bond) => {
    // TODO: Implement simulate expired functionality
    message.info('Simulate expired - Coming soon');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingBond) {
        // Update existing bond via API
        const res = await fetch(`/api/bonds/${editingBond.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            totalTokens: values.totalTokens,
            profitRate: values.profitRate,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          message.success('Bond updated successfully');
          setIsModalOpen(false);
          form.resetFields();
          setEditingBond(null);
          fetchBonds(); // Refresh list
        } else {
          message.error(data.error || 'Failed to update bond');
        }
      } else {
        // Create new bond via API
        const res = await fetch('/api/bonds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            code: values.code,
            totalTokens: values.totalTokens,
            profitRate: values.profitRate,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          message.success('Bond created successfully');
          setIsModalOpen(false);
          form.resetFields();
          fetchBonds(); // Refresh list
        } else {
          message.error(data.error || 'Failed to create bond');
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Bond Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Bond, b: Bond) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Profit Rate',
      dataIndex: 'profitRate',
      key: 'profitRate',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Currency Code',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
      render: (value: string | null) => value || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          DRAFT: 'default',
          PUBLISHED: 'success',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Bond) => (
        <Space>
          {record.status === 'DRAFT' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>

              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={() => handlePublish(record)}
              >
                Publish
              </Button>

              <Popconfirm
                title="Delete bond"
                description="Are you sure you want to delete this bond?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                >
                  Delete
                </Button>
              </Popconfirm>
            </>
          )}

          {record.status === 'PUBLISHED' && (
            <>
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewTreasury(record)}
              >
                View Treasury
              </Button>

              <Popconfirm
                title="Simulate Bond Expiry"
                description="This will simulate the bond reaching maturity. Are you sure?"
                onConfirm={() => handleSimulateExpired(record)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="link"
                  icon={<ClockCircleOutlined />}
                  style={{ color: '#faad14' }}
                >
                  Simulate Expired
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
      <Card
        title={
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            Bond Management
          </span>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBonds}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Bond
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={bonds}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      <Modal
        title={editingBond ? 'Edit Bond' : 'Create New Bond'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Bond Name"
            rules={[{ required: true, message: 'Please enter bond name' }]}
          >
            <Input placeholder="e.g., Government Sukuk 2026" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              placeholder="Brief description of the bond"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Bond Code"
            rules={[{ required: true, message: 'Please enter bond code' }]}
            extra="Unique identifier for the bond (will be used as currency code on XRPL)"
          >
            <Input
              placeholder="e.g., SUKUK01"
              disabled={!!editingBond}
            />
          </Form.Item>

          <Form.Item
            name="totalTokens"
            label="Total Tokens"
            rules={[{ required: true, message: 'Please enter total tokens' }]}
            extra="Number of tokens to create for this bond"
          >
            <InputNumber
              placeholder="e.g., 100000"
              min={1}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="profitRate"
            label="Profit Rate"
            rules={[{ required: true, message: 'Please enter profit rate' }]}
            extra="Expected return rate (e.g., 0.05 for 5%)"
          >
            <InputNumber
              placeholder="e.g., 0.05"
              min={0}
              max={1}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
