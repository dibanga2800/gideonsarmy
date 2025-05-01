/**
 * Formats a number as British Pounds (GBP)
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return '£0.00';
  }
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(num);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  // Handle dd/mm/yyyy format (which is how dates are stored in the sheet)
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    if (day && month && year) {
      return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }
  
  // Handle standard date formats
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
} 