'use client';

import { Card, Button, Table, Modal, Form, Input, InputNumber, Select, Space, Tag, Popconfirm, message, Spin, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, EditOutlined, DeleteOutlined, RocketOutlined, ReloadOutlined, EyeOutlined, ClockCircleOutlined, BankOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/app/component/AdminGuard';

interface Bond {
  id: string;
  name: string;
  description: string;
  code: string;
  currencyCode: string | null;
  totalTokens: number;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED';
  profitRate: number;
  maturityAt: string | null;
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
  const [isExpirationModalOpen, setIsExpirationModalOpen] = useState(false);
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const [editingBond, setEditingBond] = useState<Bond | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [expirationForm] = Form.useForm();

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
      maturityAt: bond.maturityAt ? dayjs(bond.maturityAt) : null,
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
    router.push(`/admin/bonds/publish?bondCode=${bond.code}`);
  };

  const handleViewTreasury = (bond: Bond) => {
    if (bond.treasuryAddress) {
      const explorerUrl = `https://testnet.xrpl.org/accounts/${bond.treasuryAddress}`;
      window.open(explorerUrl, '_blank');
    } else {
      message.error('Treasury address not available');
    }
  };

  const handleViewIssuer = (bond: Bond) => {
    if (bond.issuerAddress) {
      const explorerUrl = `https://testnet.xrpl.org/accounts/${bond.issuerAddress}`;
      window.open(explorerUrl, '_blank');
    } else {
      message.error('Issuer address not available');
    }
  };

  const handleOpenExpirationModal = (bond: Bond) => {
    setSelectedBond(bond);
    expirationForm.setFieldsValue({
      principalPerTokenXrp: 1,
    });
    setIsExpirationModalOpen(true);
  };

  const handleSimulateExpired = async () => {
    if (!selectedBond) return;

    try {
      const values = await expirationForm.validateFields();
      setSubmitting(true);
      message.loading({ content: 'Simulating bond expiry and redeeming all holders...', key: 'simulate' });

      const profitMultiplier = 1 + selectedBond.profitRate;
      const xrpPayoutPerToken = values.principalPerTokenXrp * profitMultiplier;

      const res = await fetch(`/api/bonds/code/${selectedBond.code}/simulate-expired`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalPerTokenXrp: values.principalPerTokenXrp,
          profitMultiplier: profitMultiplier,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        message.success({
          content: `Bond expired! Each token holder receives ${data.params.xrpPayoutPerToken.toFixed(6)} XRP per token`,
          key: 'simulate',
          duration: 5,
        });
        setIsExpirationModalOpen(false);
        fetchBonds(); // Refresh list
      } else {
        message.error({ content: data.error || 'Failed to simulate expiry', key: 'simulate' });
      }
    } catch (error) {
      message.error({ content: 'Network error. Please try again.', key: 'simulate' });
    } finally {
      setSubmitting(false);
    }
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
            maturityAt: values.maturityAt ? values.maturityAt.toISOString() : null,
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
            maturityAt: values.maturityAt ? values.maturityAt.toISOString() : null,
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
      title: 'Maturity Date',
      dataIndex: 'maturityAt',
      key: 'maturityAt',
      render: (value: string | null) => value ? dayjs(value).format('YYYY-MM-DD') : '-',
      sorter: (a: Bond, b: Bond) => {
        if (!a.maturityAt) return 1;
        if (!b.maturityAt) return -1;
        return new Date(a.maturityAt).getTime() - new Date(b.maturityAt).getTime();
      },
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
          EXPIRED: 'blue',
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
                icon={<BankOutlined />}
                onClick={() => handleViewIssuer(record)}
              >
                View Issuer
              </Button>

              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewTreasury(record)}
              >
                View Treasury
              </Button>

              <Button
                type="link"
                icon={<ClockCircleOutlined />}
                onClick={() => handleOpenExpirationModal(record)}
                style={{ color: '#faad14' }}
              >
                Simulate Expired
              </Button>
            </>
          )}

          {record.status === 'EXPIRED' && (
            <>
              <Button
                type="link"
                icon={<BankOutlined />}
                onClick={() => handleViewIssuer(record)}
              >
                View Issuer
              </Button>

              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewTreasury(record)}
              >
                View Treasury
              </Button>
              <Tag color="blue">Expired</Tag>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminGuard>
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

          <Form.Item
            name="maturityAt"
            label="Maturity Date"
            extra="The date when the bond matures and can be redeemed"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Select maturity date"
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Form>
        </Modal>

        <Modal
          title="Simulate Bond Expiry"
          open={isExpirationModalOpen}
          onOk={handleSimulateExpired}
          onCancel={() => {
            setIsExpirationModalOpen(false);
            expirationForm.resetFields();
          }}
          confirmLoading={submitting}
          okText="Expire Bond & Redeem All"
          okButtonProps={{ danger: true }}
        >
          <Form
            form={expirationForm}
            layout="vertical"
            style={{ marginTop: 24 }}
          >
            {selectedBond && (
              <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <p><strong>Bond:</strong> {selectedBond.name}</p>
                <p><strong>Code:</strong> {selectedBond.code}</p>
                <p><strong>Currency Code:</strong> {selectedBond.currencyCode}</p>
                <p><strong>Profit Rate:</strong> {(selectedBond.profitRate * 100).toFixed(1)}%</p>
              </div>
            )}

            <Form.Item
              name="principalPerTokenXrp"
              label="Principal Per Token (XRP)"
              rules={[{ required: true, message: 'Please enter principal per token' }]}
              extra="The base XRP value per token before profit is applied"
            >
              <InputNumber
                placeholder="e.g., 1"
                min={0.000001}
                step={0.1}
                style={{ width: '100%' }}
              />
            </Form.Item>

            {selectedBond && (
              <div style={{ marginTop: 16, padding: 16, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
                <p style={{ margin: 0 }}>
                  <strong>Payout Calculation:</strong><br />
                  Each token holder will receive: Principal × (1 + {(selectedBond.profitRate * 100).toFixed(1)}%) = <strong>{(1 * (1 + selectedBond.profitRate)).toFixed(6)} XRP</strong> per token
                </p>
              </div>
            )}
          </Form>
        </Modal>
      </div>
    </AdminGuard>
  );
}
