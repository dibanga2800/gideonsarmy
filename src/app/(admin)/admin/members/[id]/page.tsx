'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Member, Payment } from '@/types';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  // const { data: session, status } = useSession();
  
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const memberId = params.id;
  
  useEffect(() => {
    // Removing auth checks temporarily
    /*if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      if (!session.user.isAdmin) {
        router.push('/dashboard');
        return;
      }*/
      
    // Fetch member details
    fetch(`/api/members/${memberId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch member data');
        }
        return res.json();
      })
      .then(data => {
        setMember(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching member data:', error);
        setError(error.message || 'Failed to load member information');
        setIsLoading(false);
      });
    //}
  }, [/*status, session,*/ router, memberId]);
  
  // Format dates for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Send payment reminder
  const handleSendReminder = async () => {
    if (!member) return;
    
    try {
      const response = await fetch(`/api/admin/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: member.id }),
      });
      
      if (response.ok) {
        alert('Payment reminder sent successfully');
      } else {
        const error = await response.json();
        alert(`Failed to send reminder: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder due to an error');
    }
  };
  
  if (isLoading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Loading member information...</p>
        </div>
      </div>
    );
  }
  
  if (error || !member) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="text-center px-4">
          <h2 className="text-danger mb-4">Error Loading Member</h2>
          <p className="mb-4">{error || 'Member not found'}</p>
          <button 
            onClick={() => router.push('/admin')}
            className="btn btn-primary"
          >
            Return to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">Member Profile</h1>
          <button
            onClick={() => router.push('/admin')}
            className="btn btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
        
        {/* Member Information Card */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h2 className="h5 mb-0">Member Information</h2>
            <div className="d-flex gap-2">
              <Link
                href={`/admin/payments/new?memberId=${member.id}`}
                className="btn btn-primary"
              >
                Record Payment
              </Link>
              {member.totalDuesOwed > 0 && (
                <button
                  onClick={handleSendReminder}
                  className="btn btn-warning"
                >
                  Send Reminder
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-muted">Name</label>
                <div className="h6">{member.name}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted">Email</label>
                <div className="h6">{member.email}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted">Join Date</label>
                <div className="h6">{formatDate(member.joinDate)}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted">Total Dues Owed</label>
                <div className={`h6 fw-bold ${
                  member.totalDuesOwed > 0 ? 'text-danger' : 'text-success'
                }`}>
                  ${member.totalDuesOwed.toFixed(2)}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted">Birthday</label>
                <div className="h6">{formatDate(member.birthday)}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted">Wedding Anniversary</label>
                <div className="h6">{formatDate(member.anniversary)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment History Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="h5 mb-0">Payment History</h2>
          </div>
          <div className="card-body">
            {member.payments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Period</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {member.payments.map((payment: Payment) => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.date)}</td>
                        <td>${payment.amount.toFixed(2)}</td>
                        <td className="text-capitalize">
                          {payment.method.replace('_', ' ')}
                        </td>
                        <td>{payment.month} {payment.year}</td>
                        <td>
                          <span className={`badge ${
                            payment.status === 'paid' 
                              ? 'bg-success' 
                              : payment.status === 'pending'
                                ? 'bg-warning'
                                : 'bg-danger'
                          }`}>
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : 'Overdue'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted fst-italic">No payment history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 