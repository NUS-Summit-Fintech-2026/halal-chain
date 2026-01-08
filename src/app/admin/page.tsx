'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminPage() {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (admin) {
        // Authenticated - redirect to bonds management
        router.replace('/admin/bonds');
      } else {
        // Not authenticated - redirect to login
        router.replace('/admin/login');
      }
    }
  }, [admin, isLoading, router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}>
      <Spin size="large" />
    </div>
  );
}
