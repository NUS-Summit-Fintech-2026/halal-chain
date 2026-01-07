'use client';

import { ConfigProvider } from 'antd';
import { ReactNode } from 'react';

// Custom theme configuration
const theme = {
  token: {
    // Primary color - customize as needed
    colorPrimary: '#1890ff',
    // Border radius
    borderRadius: 6,
    // Font family
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Button: {
      // Customize button styles
      controlHeight: 40,
      paddingContentHorizontal: 24,
    },
    Input: {
      // Customize input styles
      controlHeight: 40,
    },
    Card: {
      // Customize card styles
      paddingLG: 24,
    },
  },
};

interface AntdProviderProps {
  children: ReactNode;
}

export default function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}
