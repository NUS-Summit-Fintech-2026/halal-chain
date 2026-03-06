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
  const isLoginPage = pathname === '/login' || pathname === '/admin/login' || pathname === '/';

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Sidebar />
      <Layout style={{ marginLeft: isLoginPage ? 0 : 240, background: '#0a0a0a' }}>
        {children}
      </Layout>
    </Layout>
  );
}
