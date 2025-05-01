'use client';

import React, { useState, useEffect } from 'react';
import MemberList from '@/components/MemberList';
import MemberForm from '@/components/MemberForm';
import PaymentForm from '@/components/PaymentForm';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Calculate stats
  const totalMembers = members.length;
  const totalDuesPaid = members.reduce((sum, member) => sum + (member.duesAmountPaid || 0), 0);
  const totalOutstanding = members.reduce((sum, member) => sum + (member.outstandingYTD || 0), 0);

  // Fetch all members on page load
  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter members when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(
      member => 
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.phoneNumber?.toLowerCase().includes(query)
    );
    
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/members');
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      
      // Map the data to match our component structure
      const processedMembers = data.map(member => ({
        id: member.id || '',
        name: member.name?.trim() || '',
        email: member.email?.trim() || '',
        phoneNumber: member.phoneNumber?.trim() || '',
        memberStatus: member.memberStatus?.toLowerCase() || 'inactive',
        duesAmountPaid: typeof member.duesAmountPaid === 'number' ? member.duesAmountPaid : 0,
        outstandingYTD: typeof member.outstandingYTD === 'number' ? member.outstandingYTD : 0,
        joinDate: member.joinDate?.trim() || '',
        birthday: member.birthday?.trim() || '',
        anniversary: member.anniversary?.trim() || '',
        year: member.year || new Date().getFullYear().toString()
      }));
      
      setMembers(processedMembers);
      setFilteredMembers(processedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (formData) => {
    try {
      const response = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add member');
      }
      
      const newMember = await response.json();
      setMembers(prev => [...prev, newMember]);
      toast.success(`${newMember.name} added successfully`);
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message);
    }
  };

  const handleEditMember = async (formData) => {
    try {
      if (!selectedMember) return;
      
      const response = await fetch(`/api/admin/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update member');
      }
      
      const updatedMember = await response.json();
      
      // Update the member in the local state
      setMembers(prev => 
        prev.map(member => 
          member.id === selectedMember.id ? {
            ...member,
            ...updatedMember,
            name: updatedMember.name || member.name,
            email: updatedMember.email || member.email,
            phoneNumber: updatedMember.phoneNumber || member.phoneNumber,
            memberStatus: updatedMember.memberStatus || member.memberStatus,
            duesAmountPaid: updatedMember.duesAmountPaid || member.duesAmountPaid,
            outstandingYTD: updatedMember.outstandingYTD || member.outstandingYTD,
            joinDate: updatedMember.joinDate || member.joinDate,
            birthday: updatedMember.birthday || member.birthday,
            anniversary: updatedMember.anniversary || member.anniversary,
            year: updatedMember.year || member.year
          } : member
        )
      );
      
      toast.success(`${updatedMember.name} updated successfully`);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete member');
      }
      
      setMembers(prev => prev.filter(member => member.id !== memberId));
      toast.success('Member deleted successfully');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error(error.message);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      const response = await fetch(`/api/admin/members/${paymentData.memberId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record payment');
      }
      
      const result = await response.json();
      
      // Update the member in the local state
      setMembers(prev => 
        prev.map(member => 
          member.id === paymentData.memberId ? result.member : member
        )
      );
      
      toast.success('Payment recorded successfully');
      setPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.message);
    }
  };

  const openAddDialog = () => {
    setSelectedMember(null);
    setAddDialogOpen(true);
  };

  const openEditDialog = (member) => {
    setSelectedMember(member);
    setEditDialogOpen(true);
  };

  const openPaymentDialog = (member) => {
    setSelectedMember(member);
    setPaymentDialogOpen(true);
  };

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h1 className="h3">Manage Members</h1>
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-primary" onClick={openAddDialog}>
            Add New Member
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Members</h6>
                  <h2 className="display-5 fw-bold">{totalMembers}</h2>
                </div>
                <div>
                  <i className="bi bi-people-fill fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Dues Paid (YTD)</h6>
                  <h2 className="display-5 fw-bold">{formatCurrency(totalDuesPaid)}</h2>
                </div>
                <div>
                  <i className="bi bi-cash-stack fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card bg-danger text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Outstanding (YTD)</h6>
                  <h2 className="display-5 fw-bold">{formatCurrency(totalOutstanding)}</h2>
                </div>
                <div>
                  <i className="bi bi-exclamation-circle fs-1"></i>
                </div>
              </div>
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
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <MemberList
          members={filteredMembers}
          onEdit={openEditDialog}
          onDelete={handleDeleteMember}
          onRecordPayment={openPaymentDialog}
        />
      )}

      <MemberForm
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddMember}
        isEditMode={false}
      />

      <MemberForm
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditMember}
        initialData={selectedMember}
        isEditMode={true}
      />

      <PaymentForm
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onSubmit={handleRecordPayment}
        member={selectedMember}
      />
    </div>
  );
} 