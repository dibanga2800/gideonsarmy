'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SetupPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      setSuccess(null);

      const initResponse = await fetch('/api/admin/initialize', {
        method: 'POST',
      });

      const data = await initResponse.json();
      
      if (data.usingMockData) {
        setUsingMockData(true);
        setSuccess('Using mock data since Google Sheets is not configured.');
      } else if (!initResponse.ok) {
        throw new Error(data.message || 'Failed to initialize Google Sheet');
      } else {
        setSuccess('Google Sheet structure initialized successfully!');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize Google Sheet';
      setError(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/seed', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.usingMockData) {
        setUsingMockData(true);
        setSuccess('Using mock data since Google Sheets is not configured.');
      } else if (!response.ok) {
        throw new Error(data.message || 'Failed to seed data');
      } else {
        setSuccess('Data seeded successfully!');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to seed data';
      setError(errorMsg);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);

      const result = await signIn('credentials', {
        redirect: false,
        email: 'dibanga2800@gmail.com',
        password: 'password123',
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push('/admin');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to log in');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Setup Application</h2>

              {usingMockData && (
                <div className="alert alert-info mb-4">
                  <h5 className="alert-heading">Using Mock Data</h5>
                  <p className="mb-0">
                    Google Sheets is not configured. The application will use mock data for demonstration purposes.
                    To use real data, please configure your Google Sheets credentials in the .env file.
                  </p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger mb-4">
                  <h5 className="alert-heading">Error</h5>
                  <p className="mb-0">{error}</p>
                </div>
              )}

              {success && (
                <div className="alert alert-success mb-4">
                  <h5 className="alert-heading">Success</h5>
                  <p className="mb-0">{success}</p>
                </div>
              )}

              <div className="list-group mb-4">
                <div className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">1. Initialize Application</h5>
                      <p className="mb-0 text-secondary">Set up necessary structure</p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleInitialize}
                      disabled={isInitializing}
                    >
                      {isInitializing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Initializing...
                        </>
                      ) : (
                        'Initialize'
                      )}
                    </button>
                  </div>
                </div>

                <div className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">2. Seed Test Data</h5>
                      <p className="mb-0 text-secondary">Add sample data for testing</p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSeedData}
                      disabled={isSeeding}
                    >
                      {isSeeding ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Seeding...
                        </>
                      ) : (
                        'Seed Data'
                      )}
                    </button>
                  </div>
                </div>

                <div className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">3. Log In as Admin</h5>
                      <p className="mb-0 text-secondary">Access the admin dashboard</p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Logging in...
                        </>
                      ) : (
                        'Log In'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/" className="btn btn-link">Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 