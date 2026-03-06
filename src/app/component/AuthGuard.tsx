'use client';

// UI PREVIEW MODE: Auth bypass enabled on ui-preview branch
interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>;
}
