'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not admin
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      toast.error('You do not have permission to access the admin area');
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // No special layout needed, just protection
  return children;
} 