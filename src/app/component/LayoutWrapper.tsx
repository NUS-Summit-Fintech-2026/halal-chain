'use client';

import { Layout } from 'antd';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Check if we're on a login page
  const isLoginPage = pathname === '/login' || pathname === '/admin/login';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: isLoginPage ? 0 : 220 }}>
        {children}
      </Layout>
    </Layout>
  );
}
