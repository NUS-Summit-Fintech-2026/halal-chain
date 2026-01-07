'use client';

import { Card, Descriptions, Tag, Space, Button, Timeline } from 'antd';
import { CopyOutlined, ExportOutlined } from '@ant-design/icons';
import { message } from 'antd';

export default function TokenPage({ params }: { params: { uid: string } }) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  return (
    <div style={{ marginLeft: 20, padding: '24px' }}>
      <Card 
        title={
          <Space>
            <span style={{ fontSize: '20px', fontWeight: 600 }}>
              Token Details
            </span>
            <Tag color="green">Active</Tag>
          </Space>
        }
        extra={
          <Button icon={<ExportOutlined />}>
            Export Details
          </Button>
        }
      >
        <Descriptions 
          bordered
          column={2}
          style={{ marginBottom: 32 }}
        >
          <Descriptions.Item label="Token UID" span={2}>
            <Space>
              {params.uid}
              <Button 
                type="link" 
                icon={<CopyOutlined />}
                onClick={() => handleCopy(params.uid)}
              />
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Bond Name">
            Government Sukuk 2026
          </Descriptions.Item>
          <Descriptions.Item label="Issuer">
            Ministry of Finance
          </Descriptions.Item>
          
          <Descriptions.Item label="Owner Wallet">
            <Space>
              rN7n...4xQk
              <Button 
                type="link" 
                icon={<CopyOutlined />}
                onClick={() => handleCopy('rN7n7otQDd6FczFgLdVJB4')}
              />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Token Value">
            100 RLUSD
          </Descriptions.Item>
          
          <Descriptions.Item label="Purchase Date">
            January 5, 2026
          </Descriptions.Item>
          <Descriptions.Item label="Maturity Date">
            December 31, 2026
          </Descriptions.Item>
          
          <Descriptions.Item label="Current Yield">
            5% annually
          </Descriptions.Item>
          <Descriptions.Item label="Accrued Interest">
            0.27 RLUSD
          </Descriptions.Item>
        </Descriptions>

        <Card 
          type="inner" 
          title="Transaction History"
          style={{ background: '#fafafa' }}
        >
          <Timeline
            items={[
              {
                color: 'green',
                children: (
                  <>
                    <p style={{ margin: 0, fontWeight: 500 }}>Token Purchased</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      January 5, 2026 - 100 RLUSD
                    </p>
                  </>
                ),
              },
              {
                color: 'blue',
                children: (
                  <>
                    <p style={{ margin: 0, fontWeight: 500 }}>Token Minted</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      January 1, 2026
                    </p>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </Card>
    </div>
  );
}

