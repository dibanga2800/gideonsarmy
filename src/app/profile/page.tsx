'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User } from '@/types';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as User | undefined;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="text-center px-4">
          <h2 className="text-danger mb-4">Unauthorized Access</h2>
          <p className="mb-4">Please sign in to view your profile.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="btn btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="row mb-4">
          <div className="col">
            <h1 className="h3 mb-0">Profile</h1>
            <p className="text-muted">Manage your account information</p>
          </div>
        </div>

        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white py-3">
            <h2 className="h5 mb-0">Account Information</h2>
          </div>
          <div className="card-body">
            <div className="row align-items-center mb-4">
              <div className="col-auto">
                {user.image ? (
                  <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                    <Image
                      src={user.image}
                      alt={user.name || 'Profile picture'}
                      fill
                      className="rounded-circle object-fit-cover"
                    />
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary"
                       style={{ width: '100px', height: '100px' }}>
                    <span className="h1 mb-0">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="col">
                <h3 className="h5 mb-1">{user.name || 'User'}</h3>
                <p className="text-muted mb-0">{user.email}</p>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label text-muted small">Account Type</label>
                <div className="h6">
                  <span className={`badge ${user.isAdmin ? 'bg-primary' : 'bg-success'}`}>
                    {user.isAdmin ? 'Administrator' : 'Member'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-center">
          <button
            onClick={() => router.push(user.isAdmin ? '/admin' : '/dashboard')}
            className="btn btn-primary"
          >
            Back to {user.isAdmin ? 'Admin' : 'Member'} Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 