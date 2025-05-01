import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// Helper to generate unique IDs
const generateId = () => {
  return `MEM${Date.now().toString().substring(5)}${Math.floor(Math.random() * 1000)}`;
};

/**
 * Get all members from the Google Sheet
 */
export async function getAllMembers() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Members!A2:L',
    });

    const rows = response.data.values || [];
    
    // Log a row for debugging purposes
    if (rows.length > 0) {
      console.log('Sample member data from sheet:', rows[0]);
    }
    
    // Column mapping based on the Google Sheet:
    // A: Name, B: Email, C: Password, D: IsAdmin, E: Phone Number, F: Join Date,
    // G: Birthday, H: Anniversary, I: Status, J: Dues Amount, K: Outstanding, L: Year
    
    // Transform the row data into objects with proper type conversion
    return rows.map((row, index) => ({
      id: row[1] || `user-${index}`,       // Use email as ID (column B)
      rowIndex: index,                     // Store row index for update/delete operations
      name: row[0] || '',                  // A: Name
      email: row[1] || '',                 // B: Email
      password: row[2] || '',              // C: Password
      isAdmin: row[3] === 'TRUE',          // D: IsAdmin
      phone: row[4] || '',                 // E: Phone Number
      joinDate: row[5] || '',              // F: Join Date
      birthday: row[6] || '',              // G: Birthday
      anniversary: row[7] || '',           // H: Anniversary
      status: row[8] || 'active',          // I: Status
      amountPaid: parseFloat(row[9]?.toString().replace(/[^0-9.-]+/g, '') || '0'),  // J: Dues Amount
      balance: parseFloat(row[10]?.toString().replace(/[^0-9.-]+/g, '') || '0'),    // K: Outstanding
      year: row[11] || new Date().getFullYear().toString()  // L: Year
    }));
  } catch (error) {
    console.error('Error fetching members:', error);
    throw new Error('Failed to fetch members');
  }
}

/**
 * Get a single member by their ID (email)
 */
export async function getMemberById(id) {
  try {
    const members = await getAllMembers();
    const member = members.find(member => member.id === id || member.email === id);
    
    if (!member) return null;
    
    // Fetch payments for this member
    try {
      // Try to fetch payment records from Payments sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Payments!A2:H',
      });
      
      const rows = response.data.values || [];
      // Filter and transform payment records for this member
      // Column mapping based on standard payment sheet:
      // A: ID, B: MemberId, C: Amount, D: Date, E: Method, F: Month, G: Year, H: Status
      const payments = rows
        .filter(row => row[1] === member.id || row[1] === member.email)
        .map((row, index) => ({
          id: row[0] || `payment-${index}`,
          memberId: row[1],
          amount: parseFloat(row[2]) || 0,
          date: row[3] || '',
          method: row[4] || 'cash',
          month: row[5] || '',
          year: row[6] || '',
          status: row[7] || 'completed'
        }))
        .sort((a, b) => {
          // Sort by date descending (newest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      
      // Add payments to member object
      return {
        ...member,
        payments
      };
    } catch (error) {
      console.log('Could not fetch payment records, continuing with member data only:', error);
      // Return member without payments if payment fetch fails
      return member;
    }
  } catch (error) {
    console.error('Error fetching member:', error);
    throw new Error('Failed to fetch member');
  }
}

/**
 * Add a new member to the Google Sheet
 */
export async function addMember(memberData) {
  try {
    // Default values
    const currentYear = new Date().getFullYear().toString();
    const defaultPassword = 'supermen@123';
    
    const newRow = [
      memberData.name || '',                                // A: Name
      memberData.email || '',                               // B: Email
      memberData.password || defaultPassword,               // C: Password
      'FALSE',                                              // D: IsAdmin (always FALSE for new members)
      memberData.phone || '',                               // E: Phone Number
      memberData.joinDate || new Date().toLocaleDateString('en-GB'),  // F: Join Date (dd/mm/yyyy)
      memberData.birthday || '',                            // G: Birthday
      memberData.anniversary || '',                         // H: Anniversary
      memberData.status || 'active',                        // I: Status
      memberData.amountPaid?.toString() || '0',             // J: Dues Amount
      memberData.balance?.toString() || '0',                // K: Outstanding
      currentYear                                           // L: Year
    ];

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Members!A2:L',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [newRow]
      }
    });

    // Get all members to find the newly added one
    const members = await getAllMembers();
    return members[members.length - 1]; // Return the last member
  } catch (error) {
    console.error('Error adding member:', error);
    throw new Error('Failed to add member');
  }
}

/**
 * Update an existing member
 */
export async function updateMember(id, memberData) {
  try {
    const members = await getAllMembers();
    const member = members.find(member => member.id === id || member.email === id);
    
    if (!member) {
      throw new Error('Member not found');
    }

    // Get the row index from the member
    const rowIndex = member.rowIndex;
    
    // Row index is 0-based for the data, but A2 is the first data row in the sheet
    const sheetRowIndex = rowIndex + 2;

    // Helper function to format date from yyyy-mm-dd to dd/mm/yyyy
    const formatDateForSheet = (date) => {
      if (!date) return '';
      if (date.includes('-')) {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
      }
      return date;
    };
    
    const updatedRow = [
      memberData.name || member.name,                      // A: Name
      memberData.email || member.email,                    // B: Email
      memberData.password || member.password,              // C: Password
      member.isAdmin ? 'TRUE' : 'FALSE',                   // D: IsAdmin (preserve existing)
      memberData.phoneNumber || member.phone,              // E: Phone Number (handle UI phoneNumber)
      formatDateForSheet(memberData.joinDate) || member.joinDate,              // F: Join Date
      formatDateForSheet(memberData.birthday) || member.birthday,              // G: Birthday
      formatDateForSheet(memberData.anniversary) || member.anniversary,        // H: Anniversary
      memberData.memberStatus?.toLowerCase() || member.status,                 // I: Status (handle UI memberStatus)
      (memberData.duesAmountPaid?.toString() || member.amountPaid?.toString() || '0'),  // J: Dues Amount
      (memberData.outstandingYTD?.toString() || member.balance?.toString() || '0'),     // K: Outstanding
      memberData.year || member.year                       // L: Year
    ];

    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Members!A${sheetRowIndex}:L${sheetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [updatedRow]
      }
    });

    // Return the updated member with consistent field names for the UI
    return {
      ...member,
      ...memberData,
      phone: updatedRow[4],
      status: updatedRow[8],
      amountPaid: parseFloat(updatedRow[9]) || 0,
      balance: parseFloat(updatedRow[10]) || 0
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw new Error('Failed to update member');
  }
}

/**
 * Delete a member by ID
 */
export async function deleteMember(id) {
  try {
    const members = await getAllMembers();
    const member = members.find(member => member.id === id || member.email === id);
    
    if (!member) {
      throw new Error('Member not found');
    }

    // Get the row index from the member
    const rowIndex = member.rowIndex;
    
    // Row index is 0-based for the data, but A2 is the first data row in the sheet
    const sheetRowIndex = rowIndex + 2;
    
    // To delete, we clear the content of the row
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `Members!A${sheetRowIndex}:L${sheetRowIndex}`,
    });

    return { success: true, message: 'Member deleted successfully' };
  } catch (error) {
    console.error('Error deleting member:', error);
    throw new Error('Failed to delete member');
  }
}

/**
 * Record a new payment for a member
 */
export async function recordPayment(paymentData) {
  try {
    // Get the member to update
    const members = await getAllMembers();
    const member = members.find(m => m.id === paymentData.memberId || m.email === paymentData.memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }

    // Calculate new balance and amount paid
    const currentBalance = parseFloat(member.balance || member.outstandingYTD) || 0;
    const currentAmountPaid = parseFloat(member.amountPaid || member.duesAmountPaid) || 0;
    const paymentAmount = parseFloat(paymentData.amount) || 0;
    
    // Update amounts
    const newAmountPaid = currentAmountPaid + paymentAmount;
    const newBalance = Math.max(0, currentBalance - paymentAmount);

    // Update the member's payment info
    await updateMember(member.id, {
      amountPaid: newAmountPaid.toString(),
      duesAmountPaid: newAmountPaid.toString(),
      balance: newBalance.toString(),
      outstandingYTD: newBalance.toString()
    });

    // Record this payment in the Payments sheet
    try {
      // Generate payment ID
      const paymentId = `PMT${Date.now().toString().substring(7)}${Math.floor(Math.random() * 100)}`;
      
      // Get current date in ISO format
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Get month name from payment data or current month
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = paymentData.month || monthNames[new Date().getMonth()];
      const year = paymentData.year || new Date().getFullYear().toString();
      
      // Create payment row
      const paymentRow = [
        paymentId,                       // A: ID
        member.email,                    // B: MemberId (use email for consistency)
        paymentAmount.toString(),        // C: Amount
        paymentData.date || currentDate, // D: Date
        paymentData.method || 'cash',    // E: Method
        month,                           // F: Month
        year,                           // G: Year
        'completed'                      // H: Status
      ];
      
      // Check if Payments sheet exists, create if not
      try {
        await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Payments!A1',
        });
      } catch (error) {
        // Sheet might not exist, create it with headers
        // First get the sheet ID to check if it exists
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId
        });
        
        const paymentsSheetExists = spreadsheet.data.sheets.some(
          sheet => sheet.properties.title === 'Payments'
        );
        
        if (!paymentsSheetExists) {
          // Create the sheet
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [{
                addSheet: {
                  properties: {
                    title: 'Payments'
                  }
                }
              }]
            }
          });
          
          // Add headers
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Payments!A1:H1',
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: [[
                'ID', 'MemberId', 'Amount', 'Date', 'Method', 'Month', 'Year', 'Status'
              ]]
            }
          });
        }
      }
      
      // Add payment record
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Payments!A2',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [paymentRow]
        }
      });
      
      // Create payment object to return
      const paymentRecord = {
        id: paymentId,
        memberId: member.id,
        amount: paymentAmount,
        date: paymentData.date || currentDate,
        method: paymentData.method || 'cash',
        month: month,
        year: year,
        status: 'completed'
      };
      
      // Fetch updated member with payments included
      const updatedMember = await getMemberById(member.id);
      
      return {
        success: true,
        payment: paymentRecord,
        member: updatedMember || {
          ...member,
          amountPaid: newAmountPaid,
          duesAmountPaid: newAmountPaid,
          balance: newBalance,
          outstandingYTD: newBalance,
          payments: [paymentRecord]
        }
      };
    } catch (paymentError) {
      console.error('Error recording payment to Payments sheet:', paymentError);
      // Still return success since member was updated
      return {
        success: true,
        member: {
          ...member,
          amountPaid: newAmountPaid,
          duesAmountPaid: newAmountPaid,
          balance: newBalance,
          outstandingYTD: newBalance
        },
        warning: 'Member updated but payment history not recorded'
      };
    }
  } catch (error) {
    console.error('Error recording payment:', error);
    throw new Error('Failed to record payment');
  }
}

/**
 * Authenticates a user against the Members sheet
 */
export async function authenticateUser(email, password) {
  try {
    const members = await getAllMembers();
    const user = members.find(
      m => m.email === email && m.password === password
    );
    
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      }
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw new Error('Authentication failed');
  }
} 