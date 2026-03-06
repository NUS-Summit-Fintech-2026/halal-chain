'use client';

import { App, ConfigProvider } from 'antd';
import { ReactNode } from 'react';

// Custom theme configuration
const theme = {
  token: {
    colorPrimary: '#00bf63',
    borderRadius: 8,
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 40,
      paddingContentHorizontal: 24,
    },
    Input: {
      controlHeight: 40,
    },
    Card: {
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
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
