import { ReactNode } from 'react';
import Header from '@/components/Header';

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <main>{children}</main>
    </div>
  );
} 