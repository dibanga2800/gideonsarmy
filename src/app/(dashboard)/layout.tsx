import { ReactNode } from 'react';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      {children}
    </div>
  );
} 