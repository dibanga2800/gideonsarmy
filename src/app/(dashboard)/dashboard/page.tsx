'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Payment, PaymentStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

// Constants
const MONTHLY_DUES = 10; // £10 per month

// Dashboard Member interface
interface Member {
  id: string;
  name: string;
  email: string;
  joinDate: string | null;
  duesAmountPaid: number;
  outstandingYTD?: number; 
  birthday?: string | null;
  anniversaryDate?: string | null;
  anniversary?: string | null;
  memberStatus?: string;
  phoneNumber?: string;
  year?: string;
  payments?: Payment[];
}

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(5);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Get the currently logged in user's email
    const userEmail = session.user?.email;
    
    if (!userEmail) {
      console.error('No user email found in session');
      return;
    }
    
    // Fetch member details using email as ID
    fetch(`/api/members/${userEmail}`)
      .then(res => {
        if (!res.ok) {
          console.error('Server response error:', res.status);
          throw new Error('Failed to fetch member data');
        }
        return res.json();
      })
      .then(data => {
        // Ensure all required fields have default values
        setMember({
          ...data,
          id: data.id || data.email,
          name: data.name || 'N/A',
          email: data.email || 'N/A',
          joinDate: data.joinDate || null,
          duesAmountPaid: data.duesAmountPaid || 0,
          outstandingYTD: data.outstandingYTD || 0,
          birthday: data.birthday || null,
          anniversary: data.anniversary || null,
          memberStatus: data.memberStatus || 'Active',
          payments: data.payments || [],
          year: data.year || new Date().getFullYear().toString()
        });
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching member data:', error);
        setIsLoading(false);
      });
  }, [session, status, router]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not provided';
    
    try {
      // Check if date is in ISO format (YYYY-MM-DD)
      if (dateString.includes('-') && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
      }
      
      // Check if date has slashes (likely DD/MM/YYYY format)
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        // Ensure we have a proper date format with day/month/year
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          }
        }
      }
      
      // Try direct parsing as a fallback
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric',
        });
      }
      
      // If date can't be parsed, return as is
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };
  
  const getPaymentStatus = (month: string, year: string) => {
    if (!member) return 'Not Paid';
    
    // Check if there is a direct payment for this month/year
    if (member.payments && member.payments.length > 0) {
      const payment = member.payments.find(
        p => p.month === month && p.year === year
      );
      
      if (payment && payment.status === 'completed') {
        return 'Paid';
      }
    }
    
    // Get the month index (0-based) and year
    const monthIndex = months.findIndex(m => m === month);
    const currentYear = parseInt(year);
    
    if (monthIndex === -1) return 'Not Paid';
    
    // Parse join date to determine if member should pay for this month
    if (member.joinDate) {
      const joinDate = new Date(member.joinDate);
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth(); // 0-based
      
      // If checking a month before the join date, no payment is required
      if ((currentYear < joinYear) || 
          (currentYear === joinYear && monthIndex < joinMonth)) {
        return 'N/A'; // Not applicable for months before joining
      }
    }
    
    // Calculate number of months member has been with the organization in the current year
    let totalMonthsToPayThisYear = 0;
    
    if (member.joinDate) {
      const joinDate = new Date(member.joinDate);
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth(); // 0-based
      
      if (currentYear === joinYear) {
        // If joined this year, only count months since joining
        totalMonthsToPayThisYear = monthIndex - joinMonth + 1;
      } else if (currentYear > joinYear) {
        // If checking future years, count all months up to current month
        totalMonthsToPayThisYear = monthIndex + 1;
      }
    } else {
      // If no join date, default to counting all months
      totalMonthsToPayThisYear = monthIndex + 1;
    }
    
    // Only process if there are months to pay
    if (totalMonthsToPayThisYear <= 0) {
      return 'N/A';
    }
    
    // Get payments specifically for this year
    const currentYearPayments = member.payments?.filter(p => p.year === year) || [];
    const totalPaidThisYear = currentYearPayments.reduce((sum, payment) => 
      sum + (payment.status === 'completed' ? payment.amount : 0), 0);
    
    // If no specific payments found, use the duesAmountPaid
    const effectivePayment = totalPaidThisYear > 0 ? totalPaidThisYear : member.duesAmountPaid;
    
    // Calculate how many months the payment covers
    const monthsCovered = Math.floor(effectivePayment / MONTHLY_DUES);
    
    // Check if payment covers this specific month
    return (monthsCovered >= totalMonthsToPayThisYear) ? 'Paid' : 'Not Paid';
  };

  // Get available years from payments
  const getAvailableYears = () => {
    if (!member?.payments) return [new Date().getFullYear().toString()];
    const yearsSet = new Set(member.payments.map(p => p.year));
    return Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
  };

  // Filter payments by year and paginate
  const filteredPayments = member?.payments?.filter(p => p.year === selectedYear) || [];
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);

  // Generate pagination numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  if (isLoading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Loading your information...</p>
        </div>
      </div>
    );
  }
  
  if (!member) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="text-center px-4">
          <h2 className="text-danger mb-4">Error Loading Profile</h2>
          <p className="mb-4">We couldn't load your profile information. Please try again later or contact an administrator for help.</p>
          <button 
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Generate list of months for the current year
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="row mb-4">
          <div className="col">
            <h1 className="h3 mb-0">Member Dashboard</h1>
            <p className="text-muted">Welcome back, {member.name}</p>
          </div>
        </div>
        
        {/* Member Information Card */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white py-3">
            <h2 className="h5 mb-0">Member Information</h2>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label text-muted small">Name</label>
                <div className="h6">{member.name}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small">Email</label>
                <div className="h6">{member.email}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small">Join Date</label>
                <div className="h6">{formatDate(member.joinDate)}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small">Dues Paid</label>
                <div className="h6 fw-bold text-success">
                  {formatCurrency(member.duesAmountPaid || 0)}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small">Birthday</label>
                <div className="h6">{formatDate(member.birthday)}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small">Wedding Anniversary</label>
                <div className="h6">{formatDate(member.anniversary)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment History Card */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="h5 mb-0">Payment History</h2>
              <select 
                className="form-select form-select-sm w-auto"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {getAvailableYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-body">
            {currentPayments.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPayments.map((payment: Payment) => (
                        <tr key={payment.id}>
                          <td>{formatDate(payment.date)}</td>
                          <td>{formatCurrency(payment.amount || 0)}</td>
                          <td className="text-capitalize">{payment.method?.replace('_', ' ') || 'N/A'}</td>
                          <td>{payment.month} {payment.year}</td>
                          <td>
                            <span className={`badge ${
                              payment.status === 'completed' 
                                ? 'bg-success' 
                                : 'bg-warning'
                            }`}>
                              {payment.status === 'completed' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <nav aria-label="Payment history pagination" className="mt-4">
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </button>
                    </li>
                    {pageNumbers.map(number => (
                      <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(number)}
                        >
                          {number}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </>
            ) : (
              <p className="text-muted fst-italic text-center py-4">No payment history available for {selectedYear}.</p>
            )}
          </div>
        </div>
        
        {/* Monthly Payment Status Card */}
        <div className="card shadow-sm">
          <div className="card-header bg-white py-3">
            <h2 className="h5 mb-0">Payment Status for {selectedYear}</h2>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {months.map(month => (
                <div key={month} className="col-sm-6 col-md-4 col-lg-3">
                  <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-white shadow-sm">
                    <span className="small fw-medium">{month}</span>
                    <span 
                      className={`badge ${
                        getPaymentStatus(month, selectedYear) === 'Paid'
                          ? 'bg-success'
                          : getPaymentStatus(month, selectedYear) === 'N/A'
                            ? 'bg-secondary'
                            : 'bg-danger'
                      }`}
                      title={
                        getPaymentStatus(month, selectedYear) === 'N/A' 
                          ? 'No payment required for months before joining the fellowship'
                          : `Monthly dues are £${MONTHLY_DUES}. Payment status is based on dues paid since joining.`
                      }
                    >
                      {getPaymentStatus(month, selectedYear)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 