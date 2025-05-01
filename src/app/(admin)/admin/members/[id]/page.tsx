'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Member, Payment } from '@/types';

// Utility functions
const formatDate = (date: string | null | undefined): string => {
  if (!date) return 'Not provided';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number): string => {
  return `£${amount.toFixed(2)}`;
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  // const { data: session, status } = useSession();
  
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const memberId = params?.id;
  
  useEffect(() => {
    if (!memberId) {
      setError('Member ID is required');
      return;
    }
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
    const fetchMember = async () => {
      try {
        const response = await fetch(`/api/admin/members/${memberId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch member details');
        }
        const data = await response.json();
        
        // Ensure required fields have default values
        setMember({
          ...data,
          duesAmountPaid: data.duesAmountPaid || 0,
          outstandingYTD: data.outstandingYTD || 0,
          totalDuesOwed: data.outstandingYTD || 0,
          payments: data.payments || []
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMember();
    //}
  }, [/*status, session,*/ router, memberId]);
  
  // Send payment reminder
  const handleSendReminder = async () => {
    if (!member) return;
    
    try {
      const response = await fetch('/api/admin/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: member.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      alert('Reminder sent successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reminder');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading member information...</p>
        </div>
      </div>
    );
  }
  
  if (error || !member) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Member</h2>
          <p className="mb-4 text-gray-700">{error || 'Member not found'}</p>
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
  
  const totalPaid = member.payments?.reduce((sum, payment) => 
    payment.status === 'completed' ? sum + payment.amount : sum, 0) ?? 0;

  const pendingAmount = member.payments?.reduce((sum, payment) => 
    payment.status === 'pending' ? sum + payment.amount : sum, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Member Profile</h1>
          <button
            onClick={() => router.push('/admin')}
            className="btn btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
        
        {/* Member Information Card */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Member Information</h2>
              <div className="flex gap-3">
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
                    Send Payment Reminder
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="text-gray-900 font-medium">{member.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="text-gray-900 font-medium">{member.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Join Date</label>
                <p className="text-gray-900 font-medium">{formatDate(member.joinDate)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Total Dues Owed</label>
                <p className={`font-medium ${
                  member.totalDuesOwed > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(member.totalDuesOwed)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Birthday</label>
                <p className="text-gray-900 font-medium">{formatDate(member.birthday)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Wedding Anniversary</label>
                <p className="text-gray-900 font-medium">{formatDate(member.anniversary)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment History Card */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment History</h2>
            
            {member.payments && member.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {member.payments.map((payment: Payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {payment.method.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.month} {payment.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No payment history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 