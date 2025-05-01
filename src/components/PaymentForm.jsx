import React, { useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export default function PaymentForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  member 
}) {
  const [formData, setFormData] = useState({
    amount: '',
    method: 'cash',
    month: new Date().toLocaleString('en-US', { month: 'long' }),
    year: new Date().getFullYear().toString()
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Only allow valid number input
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    try {
      setLoading(true);
      
      await onSubmit({
        memberId: member.id,
        amount: parseFloat(formData.amount),
        date: new Date().toLocaleDateString('en-GB'), // dd/mm/yyyy
        method: formData.method,
        month: formData.month,
        year: formData.year,
        status: 'completed'
      });
      
      setFormData(prev => ({ ...prev, amount: '' }));
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
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
            <h5 className="modal-title">Record Payment for {member?.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="current-outstanding" className="form-label d-flex justify-content-between">
                  Outstanding Amount
                  <span className="text-muted small">
                    {formatCurrency(member?.outstandingYTD || 0)}
                  </span>
                </label>
                <input 
                  type="text"
                  className="form-control"
                  id="current-outstanding"
                  value={formatCurrency(member?.outstandingYTD || 0)}
                  disabled
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="amount" className="form-label">Payment Amount *</label>
                <input 
                  type="text"
                  className="form-control"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="method" className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleInputChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="month" className="form-label">Month *</label>
                  <select
                    className="form-select"
                    id="month"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = new Date(2024, i).toLocaleString('en-US', { month: 'long' });
                      return (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="year" className="form-label">Year *</label>
                  <select
                    className="form-select"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = (new Date().getFullYear() - 2 + i).toString();
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="new-outstanding" className="form-label d-flex justify-content-between">
                  New Outstanding Amount
                  <span className="text-muted small">
                    After payment
                  </span>
                </label>
                <input 
                  type="text"
                  className="form-control"
                  id="new-outstanding"
                  value={formatCurrency(Math.max(0, (member?.outstandingYTD || 0) - parseFloat(formData.amount || 0)))}
                  disabled
                />
              </div>
              
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
                      Processing...
                    </>
                  ) : (
                    'Record Payment'
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