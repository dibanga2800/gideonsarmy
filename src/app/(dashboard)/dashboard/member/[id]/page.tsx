'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import PaymentForm from '@/components/PaymentForm';
import { Member, Payment } from '@/types';

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  useEffect(() => {
    if (memberId) {
      fetchMember();
    }
  }, [memberId]);
  
  const fetchMember = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${memberId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch member details');
      }
      
      const data = await response.json();
      setMember(data);
    } catch (error) {
      console.error('Error fetching member:', error);
      toast.error('Failed to load member details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRecordPayment = async (paymentData: Partial<Payment>) => {
    try {
      const response = await fetch(`/api/members/${paymentData.memberId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to record payment');
      }
      
      const result = await response.json();
      
      // Update the member state with the updated data
      setMember(result.member);
      
      // Refresh the member data
      fetchMember();
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  };
  
  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!member) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Member not found or you do not have permission to view this member.
        </div>
      </div>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <span className="badge bg-success">Active</span>;
      case 'inactive':
        return <span className="badge bg-danger">Inactive</span>;
      case 'on leave':
        return <span className="badge bg-warning text-dark">On Leave</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };
  
  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h1 className="h3">Member Details</h1>
        </div>
        <div className="col-md-6 text-end">
          <button 
            className="btn btn-primary" 
            onClick={() => setPaymentDialogOpen(true)}
          >
            Record Payment
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body text-center">
              <div className="mb-3">
                <span className="display-1 text-muted">
                  <i className="bi bi-person-circle"></i>
                </span>
              </div>
              <h5 className="card-title">{member.name}</h5>
              <p className="card-text">
                {getStatusBadge(member.memberStatus || 'Unknown')}
              </p>
              <p className="card-text">
                Member since {formatDate(member.joinDate)}
              </p>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              Financial Summary
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6 className="text-muted">Paid</h6>
                  <h5>{formatCurrency(member.duesAmountPaid || 0)}</h5>
                </div>
                <div className="col-6">
                  <h6 className="text-muted">Outstanding</h6>
                  <h5>{formatCurrency(member.outstandingYTD || 0)}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              Contact Information
            </div>
            <div className="card-body">
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">Email:</label>
                <div className="col-sm-9">
                  <p className="pt-2">{member.email}</p>
                </div>
              </div>
              
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">Phone:</label>
                <div className="col-sm-9">
                  <p className="pt-2">{member.phoneNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              Personal Information
            </div>
            <div className="card-body">
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">Birthday:</label>
                <div className="col-sm-9">
                  <p className="pt-2">{member.birthday ? formatDate(member.birthday) : 'N/A'}</p>
                </div>
              </div>
              
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">Anniversary:</label>
                <div className="col-sm-9">
                  <p className="pt-2">{member.anniversary ? formatDate(member.anniversary) : 'N/A'}</p>
                </div>
              </div>
              
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">Year:</label>
                <div className="col-sm-9">
                  <p className="pt-2">{member.year}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PaymentForm
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onSubmit={handleRecordPayment}
        member={member}
      />
    </div>
  );
} 