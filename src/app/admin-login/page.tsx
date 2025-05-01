'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInitializeAndLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Initialize Google Sheet structure
      const initResponse = await fetch('/api/admin/initialize', {
        method: 'POST',
      });

      if (!initResponse.ok) {
        console.warn('Google Sheet initialization failed, but continuing with login');
      } else {
        console.log('Google Sheet initialized successfully');
      }

      // Step 2: Log in with hardcoded admin credentials
      const result = await signIn('credentials', {
        redirect: false,
        email: 'dibanga2800@gmail.com',
        password: 'password123',
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h1 className="card-title text-center mb-4">Admin Quick Access</h1>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <p className="mb-4 text-center">
                This page allows you to initialize the application and log in as an admin.
              </p>
              
              <div className="d-grid">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleInitializeAndLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Setting up...
                    </>
                  ) : (
                    'Initialize & Log In as Admin'
                  )}
                </button>
              </div>
              
              <div className="mt-3 text-center">
                <small className="text-muted">
                  This will automatically log you in as the admin user and initialize the required data structures.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 