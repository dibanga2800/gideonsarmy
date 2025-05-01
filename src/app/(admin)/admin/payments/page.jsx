'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Fetch all members on page load to extract payments
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPayments();
    }
  }, [status]);

  // Filter payments when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPayments(payments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = payments.filter(
      payment => 
        payment.memberName.toLowerCase().includes(query) || 
        payment.memberEmail.toLowerCase().includes(query) ||
        payment.amount.toString().includes(query)
    );
    
    setFilteredPayments(filtered);
  }, [searchQuery, payments]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/members');
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const members = await response.json();
      
      // For this demo, we'll create fake payment records
      // In a real app, you would have a proper payment history API
      const allPayments = [];
      let paymentId = 1;
      let totalPayments = 0;
      
      members.forEach(member => {
        if (parseFloat(member.amountPaid) > 0) {
          // Create a payment record for each member
          const paymentAmount = parseFloat(member.amountPaid);
          const payment = {
            id: `payment-${paymentId++}`,
            memberId: member.id,
            memberName: member.name,
            memberEmail: member.email,
            amount: paymentAmount,
            date: member.joinDate || new Date().toLocaleDateString('en-GB'), // Use join date as payment date for demo
            status: 'completed'
          };
          
          allPayments.push(payment);
          totalPayments += paymentAmount;
        }
      });
      
      // Add some additional demo payments
      const demoPayments = [
        {
          id: `payment-${paymentId++}`,
          memberId: members[0]?.id || '1',
          memberName: members[0]?.name || 'John Doe',
          memberEmail: members[0]?.email || 'john@example.com',
          amount: 15000,
          date: '26/04/2023',
          status: 'completed'
        },
        {
          id: `payment-${paymentId++}`,
          memberId: members[1]?.id || '2',
          memberName: members[1]?.name || 'Jane Smith',
          memberEmail: members[1]?.email || 'jane@example.com',
          amount: 10000,
          date: '25/04/2023',
          status: 'completed'
        },
        {
          id: `payment-${paymentId++}`,
          memberId: members[2]?.id || '3',
          memberName: members[2]?.name || 'David Ibanga',
          memberEmail: members[2]?.email || 'david@example.com',
          amount: 12000,
          date: '24/04/2023',
          status: 'completed'
        }
      ];
      
      allPayments.push(...demoPayments);
      totalPayments += demoPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Sort payments by date (newest first)
      allPayments.sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return new Date(dateB) - new Date(dateA);
      });
      
      setPayments(allPayments);
      setFilteredPayments(allPayments);
      setTotalAmount(totalPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h1 className="h3">Payment History</h1>
          <p className="text-muted">Track all member payments</p>
        </div>
        <div className="col-md-6 text-end">
          <div className="card bg-success text-white">
            <div className="card-body p-3">
              <h6 className="mb-1">Total Payments</h6>
              <h3 className="mb-0">{formatCurrency(totalAmount)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No payment records found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>
                        <div>
                          <div className="fw-medium">{payment.memberName}</div>
                          <div className="small text-muted">{payment.memberEmail}</div>
                        </div>
                      </td>
                      <td>
                        <span className="fw-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td>{formatDate(payment.date)}</td>
                      <td>
                        <span className="badge bg-success">Completed</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 