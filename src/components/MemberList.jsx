import React, { useState } from 'react';
import { formatCurrency } from "@/lib/utils";
import { toast } from 'sonner';

export default function MemberList({ members, onEdit, onDelete, onRecordPayment }) {
  const [deleteModal, setDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMemberId, setEmailMemberId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10;

  // Calculate pagination
  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = members.slice(indexOfFirstMember, indexOfLastMember);
  const totalPages = Math.ceil(members.length / membersPerPage);

  // Change page
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      onDelete(memberToDelete.id);
      setDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  const handleSendDuesEmail = async (member) => {
    if (!member?.email) {
      toast.error('This member does not have an email address');
      return;
    }

    setEmailMemberId(member.id);
    setSendingEmail(true);
    
    try {
      const response = await fetch('/api/email/dues-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: member.id
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Dues status email sent successfully');
      } else {
        throw new Error(data.message || 'Failed to send dues status email');
      }
    } catch (error) {
      // Only log minimal error info
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send dues email:', error);
      }
      toast.error(error.message || 'An error occurred while sending email');
    } finally {
      setSendingEmail(false);
      setEmailMemberId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    const statusMap = {
      'active': 'bg-success',
      'inactive': 'bg-danger',
      'on leave': 'bg-warning text-dark'
    };

    const badgeClass = statusMap[statusLower] || 'bg-secondary';
    const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown';

    return (
      <span className={`badge ${badgeClass}`}>
        {displayStatus}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    
    // Handle ISO date format
    if (dateString.includes('-')) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // Handle dd/mm/yyyy format
    const [day, month, year] = dateString.split('/');
    if (!day || !month || !year) return 'Invalid Date';
    
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Dues Paid</th>
                <th>Outstanding</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentMembers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No members found
                  </td>
                </tr>
              ) : (
                currentMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="fw-medium">{member.name || 'Not Set'}</td>
                    <td>{member.email || 'Not Set'}</td>
                    <td>{member.phoneNumber || 'Not Set'}</td>
                    <td>{getStatusBadge(member.memberStatus)}</td>
                    <td>{formatCurrency(member.duesAmountPaid || 0)}</td>
                    <td>{formatCurrency(member.outstandingYTD || 0)}</td>
                    <td>{member.joinDate ? formatDate(member.joinDate) : 'Not Set'}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-outline-info btn-sm"
                          onClick={() => handleSendDuesEmail(member)}
                          disabled={sendingEmail && emailMemberId === member.id}
                          title="Send dues status email"
                        >
                          {sendingEmail && emailMemberId === member.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <i className="bi bi-envelope"></i>
                          )}
                        </button>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => onRecordPayment(member)}
                        >
                          Pay Dues
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => onEdit(member)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteClick(member)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {members.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
              Showing {indexOfFirstMember + 1} to {Math.min(indexOfLastMember, members.length)} of {members.length} members
            </div>
            <nav aria-label="Member list pagination">
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {pageNumbers.map(number => (
                  <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(number)}
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete {memberToDelete?.name}? This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setDeleteModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 