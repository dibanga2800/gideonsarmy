import { ReactNode } from 'react';
import Header from '@/components/Header';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      {children}
    </div>
  );
} 