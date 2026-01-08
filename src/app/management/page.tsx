'use client';

import { Card, Button, Table, Modal, Form, Input, Select, Space, Tag, Popconfirm, message, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, FileOutlined, RocketOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UploadFile, UploadProps } from 'antd';

interface Bond {
  key: string;
  name: string;
  code: string;
  status: 'draft' | 'active' | 'completed';
  value: number;
  maturityDate: string;
  documents?: UploadFile[];
}

export default function BondsPage() {
  const router = useRouter();
  const [bonds, setBonds] = useState<Bond[]>([
    {
      key: '1',
      name: 'Government Sukuk 2026',
      code: 'US092189AC02',
      status: 'active',
      value: 1000000,
      maturityDate: '2026-12-31',
      documents: [],
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBond, setEditingBond] = useState<Bond | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const handleCreate = () => {
    setEditingBond(null);
    setFileList([]);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (bond: Bond) => {
    setEditingBond(bond);
    setFileList(bond.documents || []);
    form.setFieldsValue(bond);
    setIsModalOpen(true);
  };

  const handleDelete = (key: string) => {
    setBonds(bonds.filter(bond => bond.key !== key));
    message.success('Bond deleted successfully');
  };

  const handlePublish = (bond: Bond) => {
    // Navigate to publish page with bond data
    router.push(`/bonds/publish?bondId=${bond.key}`);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingBond) {
        // Update existing bond
        setBonds(bonds.map(bond => 
          bond.key === editingBond.key 
            ? { ...bond, ...values, documents: fileList }
            : bond
        ));
        message.success('Bond updated successfully');
      } else {
        // Create new bond
        const newBond: Bond = {
          key: Date.now().toString(),
          ...values,
          documents: fileList,
        };
        setBonds([...bonds, newBond]);
        message.success('Bond created successfully');
      }
      
      setIsModalOpen(false);
      setFileList([]);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // Check file size (max 10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB');
        return false;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        message.error('You can only upload PDF, DOC, DOCX, JPG, or PNG files');
        return false;
      }

      setFileList([...fileList, file]);
      return false; // Prevent auto upload
    },
    fileList,
    multiple: true,
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
      title: 'Value (XRP)',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Maturity Date',
      dataIndex: 'maturityDate',
      key: 'maturityDate',
    },
    {
      title: 'Documents',
      dataIndex: 'documents',
      key: 'documents',
      render: (documents: UploadFile[]) => (
        <Space>
          <FileOutlined />
          <span>{documents?.length || 0} file(s)</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          draft: 'default',
          active: 'success',
          completed: 'blue',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Bond) => (
        <Space>
          {/* <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: 'Bond Details',
                width: 600,
                content: (
                  <div style={{ marginTop: 16 }}>
                    <p><strong>Name:</strong> {record.name}</p>
                    <p><strong>Code:</strong> {record.code}</p>
                    <p><strong>Value:</strong> {record.value.toLocaleString()} XRP</p>
                    <p><strong>Maturity Date:</strong> {record.maturityDate}</p>
                    <p><strong>Status:</strong> {record.status.toUpperCase()}</p>
                    {record.documents && record.documents.length > 0 && (
                      <>
                        <p><strong>Documents:</strong></p>
                        <ul>
                          {record.documents.map((file, index) => (
                            <li key={index}>{file.name}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ),
              });
            }}
          >
            View
          </Button> */}
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          
        {record.status === 'active' && (
          <Button
            type="primary"
            icon={<RocketOutlined style={{ color: '#fff' }} />}
            onClick={() => handlePublish(record)}
            style={{
              backgroundColor: '#1677ff', // AntD primary blue
              borderColor: '#1677ff',
              color: '#fff',
            }}
          >
            Publish
          </Button>
        )}

          <Popconfirm
            title="Delete bond"
            description="Are you sure you want to delete this bond?"
            onConfirm={() => handleDelete(record.key)}
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
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Create Bond
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={bonds}
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Modal
        title={editingBond ? 'Edit Bond' : 'Create New Bond'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          setFileList([]);
          form.resetFields();
        }}
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
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter code' }]}
          >
            <Input placeholder="e.g., US092189AC02" />
          </Form.Item>

          <Form.Item
            name="value"
            label="Total Value (XRP)"
            rules={[{ required: true, message: 'Please enter value' }]}
          >
            <Input type="number" placeholder="e.g., 1000000" />
          </Form.Item>

          <Form.Item
            name="maturityDate"
            label="Maturity Date"
            rules={[{ required: true, message: 'Please select maturity date' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Upload Documents"
            extra="Support PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select Files</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}