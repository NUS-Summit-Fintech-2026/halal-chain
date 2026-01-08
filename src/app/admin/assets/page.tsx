'use client';

import { Card, Button, Table, Modal, Form, Input, InputNumber, Space, Tag, Popconfirm, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RocketOutlined, ReloadOutlined, EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/app/component/AdminGuard';

interface RealAsset {
  id: string;
  name: string;
  description: string;
  code: string;
  currencyCode: string | null;
  totalTokens: number;
  status: 'DRAFT' | 'PUBLISHED' | 'REALIZED';
  profitRate: number;
  currentValuationXrp: number | null;
  issuerAddress: string;
  treasuryAddress: string;
  createdAt: string;
}

export default function RealAssetManagementPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<RealAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRealizationModalOpen, setIsRealizationModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<RealAsset | null>(null);
  const [editingAsset, setEditingAsset] = useState<RealAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [realizationForm] = Form.useForm();

  // Fetch assets from API
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/realassets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        message.error('Failed to fetch assets');
      }
    } catch (error) {
      message.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = () => {
    setEditingAsset(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (asset: RealAsset) => {
    setEditingAsset(asset);
    form.setFieldsValue({
      name: asset.name,
      description: asset.description,
      code: asset.code,
      totalTokens: asset.totalTokens,
      profitRate: asset.profitRate,
      currentValuationXrp: asset.currentValuationXrp,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/realassets/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        message.success('Asset deleted successfully');
        fetchAssets();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to delete asset');
      }
    } catch (error) {
      message.error('Failed to delete asset');
    }
  };

  const handlePublish = (asset: RealAsset) => {
    router.push(`/admin/assets/publish?assetCode=${asset.code}`);
  };

  const handleViewTreasury = (asset: RealAsset) => {
    if (asset.treasuryAddress) {
      const explorerUrl = `https://testnet.xrpl.org/accounts/${asset.treasuryAddress}`;
      window.open(explorerUrl, '_blank');
    } else {
      message.error('Treasury address not available');
    }
  };

  const handleOpenRealizationModal = (asset: RealAsset) => {
    setSelectedAsset(asset);
    realizationForm.resetFields();
    setIsRealizationModalOpen(true);
  };

  const handleSimulateRealization = async () => {
    if (!selectedAsset) return;

    try {
      const values = await realizationForm.validateFields();
      setSubmitting(true);
      message.loading({ content: 'Simulating asset realization...', key: 'realization' });

      const res = await fetch(`/api/realassets/code/${selectedAsset.code}/simulate-realization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellingPriceXrp: values.sellingPriceXrp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        message.success({
          content: `Asset realized! Each token holder receives ${data.params.xrpPayoutPerToken.toFixed(6)} XRP per token`,
          key: 'realization',
          duration: 5,
        });
        setIsRealizationModalOpen(false);
        fetchAssets();
      } else {
        message.error({ content: data.error || 'Failed to simulate realization', key: 'realization' });
      }
    } catch (error) {
      message.error({ content: 'Failed to simulate realization', key: 'realization' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingAsset) {
        // Update existing asset
        const res = await fetch(`/api/realassets/${editingAsset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            totalTokens: values.totalTokens,
            profitRate: values.profitRate,
            currentValuationXrp: values.currentValuationXrp,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          message.success('Asset updated successfully');
          setIsModalOpen(false);
          form.resetFields();
          setEditingAsset(null);
          fetchAssets();
        } else {
          message.error(data.error || 'Failed to update asset');
        }
      } else {
        // Create new asset
        const res = await fetch('/api/realassets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            code: values.code,
            totalTokens: values.totalTokens,
            profitRate: values.profitRate,
            currentValuationXrp: values.currentValuationXrp,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          message.success('Asset created successfully');
          setIsModalOpen(false);
          form.resetFields();
          fetchAssets();
        } else {
          message.error(data.error || 'Failed to create asset');
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
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: RealAsset, b: RealAsset) => a.name.localeCompare(b.name),
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
      title: 'Expected Return',
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
          REALIZED: 'blue',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: RealAsset) => (
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
                title="Delete asset"
                description="Are you sure you want to delete this asset?"
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

              <Button
                type="link"
                icon={<DollarOutlined />}
                onClick={() => handleOpenRealizationModal(record)}
                style={{ color: '#faad14' }}
              >
                Simulate Realization
              </Button>
            </>
          )}

          {record.status === 'REALIZED' && (
            <>
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewTreasury(record)}
              >
                View Treasury
              </Button>
              <Tag color="blue">Realized @ {record.currentValuationXrp?.toLocaleString()} XRP</Tag>
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
              Real Asset Management
            </span>
          }
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
              onClick={fetchAssets}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Asset
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
            dataSource={assets}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingAsset ? 'Edit Real Asset' : 'Create New Real Asset'}
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
            label="Asset Name"
            rules={[{ required: true, message: 'Please enter asset name' }]}
          >
            <Input placeholder="e.g., Downtown Commercial Building" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              placeholder="Brief description of the real asset"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Asset Code"
            rules={[{ required: true, message: 'Please enter asset code' }]}
            extra="Unique identifier for the asset (will be used as currency code on XRPL)"
          >
            <Input
              placeholder="e.g., BLDG01"
              disabled={!!editingAsset}
            />
          </Form.Item>

          <Form.Item
            name="totalTokens"
            label="Total Tokens"
            rules={[{ required: true, message: 'Please enter total tokens' }]}
            extra="Number of tokens to create for this asset"
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
            label="Expected Return Rate"
            rules={[{ required: true, message: 'Please enter expected return rate' }]}
            extra="Expected return rate (e.g., 0.15 for 15%)"
          >
            <InputNumber
              placeholder="e.g., 0.15"
              min={0}
              max={10}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="currentValuationXrp"
            label="Current Valuation (XRP)"
            extra="Optional: Current estimated value of the asset in XRP"
          >
            <InputNumber
              placeholder="e.g., 1000000"
              min={0}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Realization Modal */}
      <Modal
        title="Simulate Asset Realization"
        open={isRealizationModalOpen}
        onOk={handleSimulateRealization}
        onCancel={() => {
          setIsRealizationModalOpen(false);
          realizationForm.resetFields();
        }}
        confirmLoading={submitting}
        okText="Realize Asset"
        okButtonProps={{ danger: true }}
      >
        <Form
          form={realizationForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <p style={{ marginBottom: 16 }}>
            Simulating realization for: <strong>{selectedAsset?.name}</strong>
          </p>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Total Tokens: {selectedAsset?.totalTokens.toLocaleString()}
          </p>

          <Form.Item
            name="sellingPriceXrp"
            label="Total Selling Price (XRP)"
            rules={[{ required: true, message: 'Please enter the selling price' }]}
            extra="Total amount received from selling the asset. This will be divided among all token holders proportionally."
          >
            <InputNumber
              placeholder="e.g., 1200000"
              min={0}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          {selectedAsset && realizationForm.getFieldValue('sellingPriceXrp') > 0 && (
            <p style={{ color: '#1890ff' }}>
              Payout per token: {(realizationForm.getFieldValue('sellingPriceXrp') / selectedAsset.totalTokens).toFixed(6)} XRP
            </p>
          )}
          </Form>
        </Modal>
      </div>
    </AdminGuard>
  );
}
