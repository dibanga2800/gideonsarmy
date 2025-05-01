import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function UserForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  isEditMode = false 
}) {
  const defaultValues = {
    name: '',
    email: '',
    isAdmin: false,
    password: '',
  };

  const [formData, setFormData] = useState(defaultValues);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Don't include password when editing
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        isAdmin: initialData.isAdmin || false,
        password: '', // Always reset password field
      });
    } else {
      setFormData(defaultValues);
    }
  }, [initialData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    
    // Require password for new users
    if (!isEditMode && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }
    
    try {
      setLoading(true);
      
      // Remove password field if empty (when editing)
      const dataToSubmit = {...formData};
      if (isEditMode && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditMode ? 'Edit User' : 'Add New User'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Name</label>
                <input 
                  type="text"
                  className="form-control" 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter user's name"
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email *</label>
                <input 
                  type="email"
                  className="form-control" 
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter user's email"
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  {isEditMode ? 'Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input 
                  type="password"
                  className="form-control" 
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!isEditMode}
                  placeholder={isEditMode ? "••••••••" : "Enter user's password"}
                />
              </div>
              
              <div className="mb-3 form-check">
                <input 
                  type="checkbox"
                  className="form-check-input" 
                  id="isAdmin"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="isAdmin">
                  Administrator access
                </label>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : isEditMode ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 