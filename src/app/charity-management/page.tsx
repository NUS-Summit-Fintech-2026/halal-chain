'use client';

import { Card, Button, Table, Modal, Form, Input, Space, Popconfirm, message, Spin, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

interface Charity {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  totalReceived: number;
  createdAt: string;
  _count?: {
    donations: number;
  };
}

export default function CharityManagementPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharity, setEditingCharity] = useState<Charity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Fetch charities from API
  const fetchCharities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/charities');
      if (res.ok) {
        const data = await res.json();
        setCharities(data);
      } else {
        message.error('Failed to fetch charities');
      }
    } catch (error) {
      message.error('Failed to fetch charities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharities();
  }, []);

  const handleCreate = () => {
    setEditingCharity(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (charity: Charity) => {
    setEditingCharity(charity);
    form.setFieldsValue({
      name: charity.name,
      description: charity.description,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/charities/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        message.success('Charity deleted successfully');
        fetchCharities();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to delete charity');
      }
    } catch (error) {
      message.error('Failed to delete charity');
    }
  };

  const handleViewWallet = (charity: Charity) => {
    const explorerUrl = `https://testnet.xrpl.org/accounts/${charity.walletAddress}`;
    window.open(explorerUrl, '_blank');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingCharity) {
        // Update existing charity
        const res = await fetch(`/api/charities/${editingCharity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          message.success('Charity updated successfully');
          setIsModalOpen(false);
          form.resetFields();
          setEditingCharity(null);
          fetchCharities();
        } else {
          message.error(data.error || 'Failed to update charity');
        }
      } else {
        // Create new charity
        const res = await fetch('/api/charities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          message.success('Charity created successfully with new wallet');
          setIsModalOpen(false);
          form.resetFields();
          fetchCharities();
        } else {
          message.error(data.error || 'Failed to create charity');
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
      title: 'Charity Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a: Charity, b: Charity) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Total Received',
      dataIndex: 'totalReceived',
      key: 'totalReceived',
      width: 130,
      render: (value: number) => (
        <Tag color="green">{value.toFixed(2)} XRP</Tag>
      ),
      sorter: (a: Charity, b: Charity) => a.totalReceived - b.totalReceived,
    },
    {
      title: 'Donations',
      key: 'donations',
      width: 100,
      render: (_: any, record: Charity) => (
        <Tag color="blue">{record._count?.donations || 0}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_: any, record: Charity) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewWallet(record)}
          >
            Wallet
          </Button>

          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete charity"
            description="Are you sure you want to delete this charity?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
      <Card
        title={
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            Charity Management
          </span>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCharities}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Charity
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
            dataSource={charities}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCharity ? 'Edit Charity' : 'Add New Charity'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Charity Name"
            rules={[{ required: true, message: 'Please enter charity name' }]}
          >
            <Input placeholder="e.g., Red Crescent Society" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              placeholder="Brief description of the charity's mission"
              rows={4}
            />
          </Form.Item>

          {!editingCharity && (
            <div style={{ color: '#666', fontSize: 12, marginTop: -8 }}>
              A new XRPL wallet will be automatically created for this charity to receive donations.
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
