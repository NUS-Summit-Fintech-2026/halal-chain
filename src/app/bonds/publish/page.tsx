// 'use client';

// import { Card, Button, Descriptions, Space, message, Steps } from 'antd';
// import { RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';
// import { useState } from 'react';

// export default function PublishBondPage() {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [isPublishing, setIsPublishing] = useState(false);

//   const handlePublish = async () => {
//     setIsPublishing(true);
    
//     // Simulate publishing process
//     setTimeout(() => {
//       setCurrentStep(1);
//       setTimeout(() => {
//         setCurrentStep(2);
//         setIsPublishing(false);
//         message.success('Bond published and tokenized successfully!');
//       }, 1500);
//     }, 1500);
//   };

//   return (
//     <div style={{ marginLeft: 20, padding: '24px'}}>
//       <Card 
//         title={
//           <span style={{ fontSize: '20px', fontWeight: 600 }}>
//             Publish Bond
//           </span>
//         }
//       >
//         <Steps
//           current={currentStep}
//           style={{ marginBottom: 32 }}
//           items={[
//             {
//               title: 'Review',
//               description: 'Review bond details',
//             },
//             {
//               title: 'Tokenize',
//               description: 'Create blockchain tokens',
//             },
//             {
//               title: 'Publish',
//               description: 'Make available for purchase',
//             },
//           ]}
//         />

//         <Descriptions 
//           bordered
//           column={2}
//           style={{ marginBottom: 24 }}
//         >
//           <Descriptions.Item label="Bond Name" span={2}>
//             Government Sukuk 2026
//           </Descriptions.Item>
//           <Descriptions.Item label="Issuer">
//             Ministry of Finance
//           </Descriptions.Item>
//           <Descriptions.Item label="Total Value">
//             1,000,000 RLUSD
//           </Descriptions.Item>
//           <Descriptions.Item label="Price per Token">
//             100 RLUSD
//           </Descriptions.Item>
//           <Descriptions.Item label="Total Tokens">
//             10,000
//           </Descriptions.Item>
//           <Descriptions.Item label="Maturity Date">
//             December 31, 2026
//           </Descriptions.Item>
//           <Descriptions.Item label="Status">
//             <span style={{ color: '#faad14', fontWeight: 500 }}>Draft</span>
//           </Descriptions.Item>
//         </Descriptions>

//         <Space>
//           <Button 
//             type="primary" 
//             size="large"
//             icon={<RocketOutlined />}
//             onClick={handlePublish}
//             loading={isPublishing}
//             disabled={currentStep === 2}
//           >
//             {currentStep === 2 ? 'Published' : 'Publish & Tokenize'}
//           </Button>
          
//           {currentStep === 2 && (
//             <Button 
//               type="default"
//               size="large"
//               icon={<CheckCircleOutlined />}
//             >
//               View Published Bond
//             </Button>
//           )}
//         </Space>
//       </Card>
//     </div>
//   );
// }

'use client';

import { Card, Button, Descriptions, Space, message, Steps } from 'antd';
import { RocketOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PublishBondPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bondId = searchParams.get('bondId');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  // Mock bond data - in real app, fetch based on bondId
  const [bondData] = useState({
    name: 'Government Sukuk 2026',
    code: 'US092189AC02',
    issuer: 'Ministry of Finance',
    value: 1000000,
    pricePerToken: 100,
    totalTokens: 10000,
    maturityDate: 'December 31, 2026',
  });

  useEffect(() => {
    if (!bondId) {
      message.error('No bond selected');
      router.push('/bonds/management');
    }
  }, [bondId, router]);

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

  const handleGoBack = () => {
    router.push('/bonds/management');
  };

  return (
    <div style={{ marginLeft: 20, padding: '24px'}}>
      <Card 
        title={
          <Space>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleGoBack}
            />
            <span style={{ fontSize: '20px', fontWeight: 600 }}>
              Publish Bond
            </span>
          </Space>
        }
      >
        <Steps
          current={currentStep}
          style={{ marginBottom: 32 }}
          items={[
            {
              title: 'Review',
              content: 'Review bond details',
            },
            {
              title: 'Tokenize',
              content: 'Create blockchain tokens',
            },
            {
              title: 'Publish',
              content: 'Make available for purchase',
            },
          ]}
        />

        <Descriptions 
          bordered
          column={2}
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="Bond Name" span={2}>
            {bondData.name}
          </Descriptions.Item>
          <Descriptions.Item label="Code">
            {bondData.code}
          </Descriptions.Item>
          <Descriptions.Item label="Issuer">
            {bondData.issuer}
          </Descriptions.Item>
          <Descriptions.Item label="Total Value">
            {bondData.value.toLocaleString()} XRP
          </Descriptions.Item>
          <Descriptions.Item label="Price per Token">
            {bondData.pricePerToken} XRP
          </Descriptions.Item>
          <Descriptions.Item label="Total Tokens">
            {bondData.totalTokens.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Maturity Date">
            {bondData.maturityDate}
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
              onClick={handleGoBack}
            >
              Back to Management
            </Button>
          )}
          
          {currentStep < 2 && (
            <Button 
              size="large"
              onClick={handleGoBack}
            >
              Cancel
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
}