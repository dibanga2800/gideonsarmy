import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function MemberForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  isEditMode = false 
}) {
  const defaultValues = {
    name: '',
    email: '',
    password: '', // Only used for new members
    isAdmin: false,
    phoneNumber: '',
    joinDate: new Date().toISOString().substring(0, 10),
    birthday: '',
    anniversary: '',
    memberStatus: 'active',
    duesAmountPaid: 0,
    outstandingYTD: 120, // Default outstanding amount for new members
    year: new Date().getFullYear().toString()
  };

  const [formData, setFormData] = useState(defaultValues);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Format dates for date input field if they exist
      const formattedData = { ...initialData };
      
      // Convert dates from dd/mm/yyyy to yyyy-mm-dd for the date input
      if (formattedData.joinDate) {
        const [day, month, year] = formattedData.joinDate.split('/');
        if (day && month && year) {
          formattedData.joinDate = `${year}-${month}-${day}`;
        }
      }
      
      if (formattedData.birthday) {
        const [day, month, year] = formattedData.birthday.split('/');
        if (day && month && year) {
          formattedData.birthday = `${year}-${month}-${day}`;
        }
      }
      
      if (formattedData.anniversary) {
        const [day, month, year] = formattedData.anniversary.split('/');
        if (day && month && year) {
          formattedData.anniversary = `${year}-${month}-${day}`;
        }
      }
      
      setFormData(formattedData);
    } else {
      setFormData(defaultValues);
    }
  }, [initialData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    const newValue = type === 'checkbox' ? checked : 
                    type === 'number' ? parseFloat(value) || 0 : 
                    value;
                    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // If creating new member, require password
    if (!isEditMode && !formData.password) {
      toast.error('Password is required for new members');
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert dates from yyyy-mm-dd to dd/mm/yyyy for storage
      const processedData = { ...formData };
      
      if (processedData.joinDate) {
        const [year, month, day] = processedData.joinDate.split('-');
        if (year && month && day) {
          processedData.joinDate = `${day}/${month}/${year}`;
        }
      }
      
      if (processedData.birthday) {
        const [year, month, day] = processedData.birthday.split('-');
        if (year && month && day) {
          processedData.birthday = `${day}/${month}/${year}`;
        }
      }
      
      if (processedData.anniversary) {
        const [year, month, day] = processedData.anniversary.split('-');
        if (year && month && day) {
          processedData.anniversary = `${day}/${month}/${year}`;
        }
      }
      
      await onSubmit(processedData);
      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditMode ? 'Edit Member' : 'Add New Member'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label">Name *</label>
                  <input 
                    type="text"
                    className="form-control" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input 
                    type="email"
                    className="form-control" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              {!isEditMode && (
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="password" className="form-label">Password *</label>
                    <input 
                      type="password"
                      className="form-control" 
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="isAdmin" className="form-label d-block">Admin Status</label>
                    <div className="form-check">
                      <input 
                        type="checkbox"
                        className="form-check-input" 
                        id="isAdmin"
                        name="isAdmin"
                        checked={formData.isAdmin}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="isAdmin">
                        Is Admin User
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                  <input 
                    type="text"
                    className="form-control" 
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="memberStatus" className="form-label">Member Status</label>
                  <select
                    className="form-select"
                    id="memberStatus"
                    name="memberStatus"
                    value={formData.memberStatus}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on leave">On Leave</option>
                  </select>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-4">
                  <label htmlFor="joinDate" className="form-label">Join Date</label>
                  <input 
                    type="date"
                    className="form-control" 
                    id="joinDate"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="col-md-4">
                  <label htmlFor="birthday" className="form-label">Birthday</label>
                  <input 
                    type="date"
                    className="form-control" 
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="col-md-4">
                  <label htmlFor="anniversary" className="form-label">Anniversary</label>
                  <input 
                    type="date"
                    className="form-control" 
                    id="anniversary"
                    name="anniversary"
                    value={formData.anniversary}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              {isEditMode && (
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label htmlFor="duesAmountPaid" className="form-label">Dues Amount Paid</label>
                    <input 
                      type="number"
                      className="form-control" 
                      id="duesAmountPaid"
                      name="duesAmountPaid"
                      value={formData.duesAmountPaid}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="col-md-4">
                    <label htmlFor="outstandingYTD" className="form-label">Outstanding YTD</label>
                    <input 
                      type="number"
                      className="form-control" 
                      id="outstandingYTD"
                      name="outstandingYTD"
                      value={formData.outstandingYTD}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="col-md-4">
                    <label htmlFor="year" className="form-label">Year</label>
                    <input 
                      type="text"
                      className="form-control" 
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      pattern="\d{4}"
                      maxLength="4"
                    />
                  </div>
                </div>
              )}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 