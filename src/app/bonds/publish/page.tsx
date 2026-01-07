'use client';

import { Card, Button, Descriptions, Space, message, Steps } from 'antd';
import { RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';

export default function PublishBondPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    // Simulate publishing process
    setTimeout(() => {
      setCurrentStep(1);
      setTimeout(() => {
        setCurrentStep(2);
        setIsPublishing(false);
        message.success('Bond published and tokenized successfully!');
      }, 1500);
    }, 1500);
  };

  return (
    <div style={{ marginLeft: 20, padding: '24px'}}>
      <Card 
        title={
          <span style={{ fontSize: '20px', fontWeight: 600 }}>
            Publish Bond
          </span>
        }
      >
        <Steps
          current={currentStep}
          style={{ marginBottom: 32 }}
          items={[
            {
              title: 'Review',
              description: 'Review bond details',
            },
            {
              title: 'Tokenize',
              description: 'Create blockchain tokens',
            },
            {
              title: 'Publish',
              description: 'Make available for purchase',
            },
          ]}
        />

        <Descriptions 
          bordered
          column={2}
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="Bond Name" span={2}>
            Government Sukuk 2026
          </Descriptions.Item>
          <Descriptions.Item label="Issuer">
            Ministry of Finance
          </Descriptions.Item>
          <Descriptions.Item label="Total Value">
            1,000,000 RLUSD
          </Descriptions.Item>
          <Descriptions.Item label="Price per Token">
            100 RLUSD
          </Descriptions.Item>
          <Descriptions.Item label="Total Tokens">
            10,000
          </Descriptions.Item>
          <Descriptions.Item label="Maturity Date">
            December 31, 2026
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <span style={{ color: '#faad14', fontWeight: 500 }}>Draft</span>
          </Descriptions.Item>
        </Descriptions>

        <Space>
          <Button 
            type="primary" 
            size="large"
            icon={<RocketOutlined />}
            onClick={handlePublish}
            loading={isPublishing}
            disabled={currentStep === 2}
          >
            {currentStep === 2 ? 'Published' : 'Publish & Tokenize'}
          </Button>
          
          {currentStep === 2 && (
            <Button 
              type="default"
              size="large"
              icon={<CheckCircleOutlined />}
            >
              View Published Bond
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
}
