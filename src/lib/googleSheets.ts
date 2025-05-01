import { google } from 'googleapis';
import { Member, Payment, UserCredentials, PaymentMethod, PaymentStatus, MemberStatus } from '@/types';
import bcrypt from 'bcryptjs';

// Initialize the sheets API
const sheets = google.sheets('v4');

// Create JWT client using service account credentials
const getAuth = async () => {
  try {
    // Log environment check (safe to log)
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Sheet ID available:', !!process.env.GOOGLE_SHEET_ID);
    console.log('Client email available:', !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log('Private key available:', !!process.env.GOOGLE_PRIVATE_KEY);
    
    // Log the first few characters of each credential (safely)
    console.log('Sheet ID prefix:', process.env.GOOGLE_SHEET_ID?.substring(0, 5));
    console.log('Client email prefix:', process.env.GOOGLE_CLIENT_EMAIL?.substring(0, 5));
    console.log('Private key format check:', {
      hasHeader: process.env.GOOGLE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY'),
      hasFooter: process.env.GOOGLE_PRIVATE_KEY?.includes('END PRIVATE KEY'),
      containsNewlines: process.env.GOOGLE_PRIVATE_KEY?.includes('\n'),
      length: process.env.GOOGLE_PRIVATE_KEY?.length
    });

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error('Missing required Google Sheets credentials');
    }

    // Format private key by adding proper line breaks
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // Check if the key needs to be formatted
    if (!privateKey.includes('\n')) {
      // Add line break after header
      privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
      // Add line break before footer
      privateKey = privateKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
      // Add line breaks every 64 characters between header and footer
      const keyBody = privateKey.replace('-----BEGIN PRIVATE KEY-----\n', '').replace('\n-----END PRIVATE KEY-----', '');
      const formattedBody = keyBody.match(/.{1,64}/g)?.join('\n');
      privateKey = `-----BEGIN PRIVATE KEY-----\n${formattedBody}\n-----END PRIVATE KEY-----`;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Test the auth configuration
    console.log('Attempting to get client...');
    const client = await auth.getClient();
    console.log('Google Auth client created successfully');

    return auth;
  } catch (error) {
    console.error('Detailed Google Sheets Authentication Error:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : 'Unknown error type',
      env: process.env.NODE_ENV,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      privateKeyCheck: process.env.GOOGLE_PRIVATE_KEY ? {
        length: process.env.GOOGLE_PRIVATE_KEY.length,
        startsWithDashes: process.env.GOOGLE_PRIVATE_KEY.startsWith('-----'),
        hasNewlines: process.env.GOOGLE_PRIVATE_KEY.includes('\n')
      } : 'No private key found'
    });
    throw new Error('Failed to initialize Google Sheets client');
  }
};

// Spreadsheet IDs and ranges
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const MEMBERS_RANGE = 'Members!A2:K';
const PAYMENTS_RANGE = 'Payments!A2:H';
const USERS_RANGE = 'Users!A2:D';

// Column indices for Members sheet (0-based)
const MEMBER_COLUMNS = {
  NAME: 0,           // Column A
  EMAIL: 1,          // Column B
  PASSWORD: 2,       // Column C
  IS_ADMIN: 3,       // Column D
  PHONE: 4,          // Column E
  JOIN_DATE: 5,      // Column F
  BIRTHDAY: 6,       // Column G
  ANNIVERSARY: 7,    // Column H
  STATUS: 8,         // Column I
  DUES_PAID: 9,      // Column J
  OUTSTANDING: 10,   // Column K
  YEAR: 11          // Column L
} as const;

// Helper function to normalize boolean values
const normalizeBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

// Helper function to format boolean values for Google Sheets
const formatBoolean = (value: boolean): string => {
  return value ? 'true' : 'false';
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const logError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  } else {
    // In production, log only the error message without sensitive details
    console.error(message);
  }
};

export const getUserByEmail = async (email: string): Promise<UserCredentials | null> => {
  try {
    console.log('Attempting to get auth for getUserByEmail');
    const auth = await getAuth();
    console.log('Auth successful, attempting to fetch user data');
    
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
    });

    console.log('Sheets API response received:', {
      hasValues: !!response.data.values,
      rowCount: response.data.values?.length || 0
    });

    const rows = response.data.values || [];
    const userRow = rows.find((row) => row[0] === email);
    
    if (!userRow) {
      console.log('No user found with email:', email);
      return null;
    }
    
    console.log('User found, returning credentials');
    return {
      id: userRow[0],         // Email (Column A)
      email: userRow[0],      // Email (Column A)
      password: userRow[1],   // Password (Column B)
      isAdmin: normalizeBoolean(userRow[2]), // IsAdmin (Column C)
      name: userRow[3] || ''  // Name (Column D)
    };
  } catch (error) {
    console.error('Detailed error in getUserByEmail:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error type',
      email,
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE
    });
    throw new Error('Failed to fetch user details');
  }
};

export const getMembers = async (requestingUserEmail?: string, isAdmin = false): Promise<Member[]> => {
  try {
    const auth = await getAuth();
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: MEMBERS_RANGE,
    });

    const rows = response.data.values || [];
    const members = rows.map((row) => ({
      id: row[MEMBER_COLUMNS.EMAIL] || '', // Using email as ID
      name: row[MEMBER_COLUMNS.NAME]?.trim() || '',
      email: row[MEMBER_COLUMNS.EMAIL]?.trim() || '',
      phoneNumber: row[MEMBER_COLUMNS.PHONE]?.trim() || '',
      joinDate: row[MEMBER_COLUMNS.JOIN_DATE] || '',
      memberStatus: (row[MEMBER_COLUMNS.STATUS] || 'inactive').toLowerCase() as MemberStatus,
      birthday: row[MEMBER_COLUMNS.BIRTHDAY] || '',
      anniversary: row[MEMBER_COLUMNS.ANNIVERSARY] || '',
      duesAmountPaid: parseFloat(row[MEMBER_COLUMNS.DUES_PAID]) || 0,
      outstandingYTD: parseFloat(row[MEMBER_COLUMNS.OUTSTANDING]) || 0,
      year: row[MEMBER_COLUMNS.YEAR] || new Date().getFullYear().toString(),
      isAdmin: row[MEMBER_COLUMNS.IS_ADMIN] === 'true',
      totalDuesOwed: parseFloat(row[MEMBER_COLUMNS.OUTSTANDING]) || 0
    }));

    // Clean up the data
    members.forEach(member => {
      // Ensure dates are in the correct format (dd/mm/yyyy)
      const formatDate = (date: string) => {
        if (!date) return '';
        // If already in correct format, return as is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
        // If in ISO format, convert to dd/mm/yyyy
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          }
        } catch (e) {}
        return date;
      };

      member.joinDate = formatDate(member.joinDate);
      member.birthday = formatDate(member.birthday);
      member.anniversary = formatDate(member.anniversary);
    });

    // If user is not admin, only return their own record
    if (!isAdmin && requestingUserEmail) {
      return members.filter(member => member.email === requestingUserEmail);
    }

    return members;
  } catch (error) {
    logError('Failed to fetch members list', error);
    throw new Error('Failed to fetch members list');
  }
};

export const getMemberById = async (id: string, requestingUserEmail?: string, isAdmin = false): Promise<Member | null> => {
  try {
    const members = await getMembers();
    const member = members.find((m) => m.email === id);
    
    if (!member) return null;

    // If user is not admin, only allow access to their own record
    if (!isAdmin && requestingUserEmail && member.email !== requestingUserEmail) {
      throw new Error('Access denied');
    }
    
    return member;
  } catch (error) {
    logError('Error fetching member by ID', error);
    throw new Error('Failed to fetch member details');
  }
};

export const getMemberByEmail = async (email: string, requestingUserEmail?: string, isAdmin = false): Promise<Member | null> => {
  try {
    const members = await getMembers();
    const member = members.find((m) => m.email === email);
    
    if (!member) return null;

    // If user is not admin, only allow access to their own record
    if (!isAdmin && requestingUserEmail && member.email !== requestingUserEmail) {
      throw new Error('Access denied');
    }
    
    return member;
  } catch (error) {
    logError('Error fetching member by email', error);
    throw new Error('Failed to fetch member details');
  }
};

export const createUser = async (userData: { email: string; password: string; name: string; isAdmin: boolean }) => {
  try {
    const auth = await getAuth();
    
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);
    
    // First, check if user already exists
    const checkResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A:A',
    });

    const userEmails = checkResponse.data.values || [];
    const userExists = userEmails.some(row => row[0] === userData.email);

    if (userExists) {
      throw new Error('User with this email already exists');
    }
    
    // Add user to the Users sheet
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          userData.email,
          hashedPassword,
          formatBoolean(userData.isAdmin),
          userData.name
        ]]
      }
    });

    // Also add to Members sheet if not exists
    const membersCheckResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Members!B:B', // Email column
    });

    const memberEmails = membersCheckResponse.data.values || [];
    const memberExists = memberEmails.some(row => row[0] === userData.email);

    if (!memberExists) {
      const today = new Date().toISOString().split('T')[0];
      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: SPREADSHEET_ID,
        range: 'Members!A:K',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            userData.name,           // A: Name
            userData.email,          // B: Email
            '',                      // C: Password (empty in Members sheet)
            formatBoolean(userData.isAdmin), // D: IsAdmin
            '',                      // E: Phone Number
            today,                   // F: Join Date
            '',                      // G: Birthday
            '',                      // H: Anniversary
            'active',                // I: Status
            '0',                     // J: Dues Amount
            '120',                   // K: Outstanding
            new Date().getFullYear().toString() // L: Year
          ]]
        }
      });
    }

    return {
      email: userData.email,
      name: userData.name,
      isAdmin: userData.isAdmin
    };
  } catch (error) {
    logError('Error creating user', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create user');
  }
};

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const auth = await getAuth();
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: PAYMENTS_RANGE,
    });

    const rows = response.data.values || [];
    
    return rows.map((row) => ({
      id: row[0],
      memberId: row[1],
      amount: parseFloat(row[2]) || 0,
      date: row[3],
      method: row[4] as PaymentMethod,
      month: row[5],
      year: row[6],
      status: row[7]?.toLowerCase() === 'completed' ? 'completed' : 'pending'
    }));
  } catch (error) {
    logError('Error fetching payments', error);
    throw new Error('Failed to fetch payments from Google Sheets');
  }
};

export const getMemberPayments = async (memberId: string): Promise<Payment[]> => {
  try {
    const payments = await getPayments();
    return payments.filter((payment) => payment.memberId === memberId);
  } catch (error) {
    logError('Error fetching member payments', error);
    throw new Error('Failed to fetch member payments');
  }
};

export const addPayment = async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
  try {
    const auth = await getAuth();
    const id = `PMT${Date.now()}`;
    
    // Create a new payment with id
    const newPayment: Payment = {
      id,
      ...payment
    };
    
    const values = [
      [
        newPayment.id,
        newPayment.memberId,
        newPayment.amount.toString(),
        newPayment.date,
        newPayment.method,
        newPayment.month,
        newPayment.year,
        newPayment.status,
      ],
    ];
    
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: PAYMENTS_RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    
    // Update member's total dues owed
    const member = await getMemberByEmail(payment.memberId);
    if (member) {
      await updateMemberDues(
        member.email, 
        (member.duesAmountPaid || 0) + payment.amount, 
        member.outstandingYTD || 0, 
        member.year || new Date().getFullYear().toString()
      );
    }
    
    return newPayment;
  } catch (error) {
    logError('Error adding payment', error);
    throw new Error('Failed to add payment to Google Sheets');
  }
};

export const updateMemberDues = async (id: string, newDuesAmount: number, outstandingYTD: number, year: string): Promise<void> => {
  try {
    const auth = await getAuth();
    
    // Get all members to find the row to update
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: MEMBERS_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[MEMBER_COLUMNS.EMAIL] === id);
    
    if (rowIndex === -1) {
      throw new Error('Member not found');
    }

    // Get current row data
    const currentRow = rows[rowIndex];
    
    // Prepare the update with all columns to maintain data integrity
    const updatedRow = [
      currentRow[MEMBER_COLUMNS.NAME],           // A: Name
      currentRow[MEMBER_COLUMNS.EMAIL],          // B: Email
      currentRow[MEMBER_COLUMNS.EMAIL],          // C: Email (duplicate since we don't store password)
      currentRow[MEMBER_COLUMNS.IS_ADMIN],       // D: IsAdmin
      currentRow[MEMBER_COLUMNS.PHONE],          // E: Phone Number
      currentRow[MEMBER_COLUMNS.JOIN_DATE],      // F: Join Date
      currentRow[MEMBER_COLUMNS.BIRTHDAY],       // G: Birthday
      currentRow[MEMBER_COLUMNS.ANNIVERSARY],    // H: Anniversary
      currentRow[MEMBER_COLUMNS.STATUS],         // I: Status
      newDuesAmount.toString(),                  // J: Dues Amount
      outstandingYTD.toString(),                 // K: Outstanding
      year                                       // L: Year
    ];

    // Update the entire row
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: `Members!A${rowIndex + 2}:L${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    // Verify the update
    const verifyResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: `Members!A${rowIndex + 2}:L${rowIndex + 2}`,
    });

    if (!verifyResponse.data.values?.[0]) {
      throw new Error('Failed to verify member dues update');
    }

  } catch (error) {
    logError('Error updating member dues', error);
    throw new Error('Failed to update member dues');
  }
};

export const getDashboardStats = async () => {
  try {
    const members = await getMembers();
    const payments = await getPayments();
    
    // Calculate member statistics
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.memberStatus === 'active').length;
    const inactiveMembers = totalMembers - activeMembers;
    
    // Generate recent activities
    const recentActivities = payments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(payment => {
        const member = members.find(m => m.email === payment.memberId);
        return {
          id: payment.id,
          type: 'payment',
          memberName: member?.name || 'Unknown Member',
          timestamp: payment.date
        };
      });
    
    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      recentActivities
    };
  } catch (error) {
    logError('Error getting dashboard stats', error);
    throw new Error('Failed to get dashboard statistics');
  }
};

// Function to initialize the Google Sheet structure
export const initializeGoogleSheet = async () => {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set');
    }
    
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL environment variable is not set');
    }
    
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('GOOGLE_PRIVATE_KEY environment variable is not set');
    }
    
    const auth = await getAuth();
    
    // Check if sheet exists and has the required tabs
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheetTitles = response.data.sheets?.map(sheet => sheet.properties?.title) || [];
    
    // Create sheets if they don't exist
    const requests: Array<{ addSheet: { properties: { title: string } } }> = [];
    ['Members', 'Payments', 'Users'].forEach(sheetName => {
      if (!sheetTitles.includes(sheetName)) {
        requests.push({
          addSheet: {
            properties: { title: sheetName }
          }
        });
      }
    });

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        auth,
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests },
      });
    }
    
    // Add headers to Members sheet with correct column order
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Members!A1:L1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Name',           // A
          'Email',          // B
          'Password',       // C
          'IsAdmin',        // D
          'Phone Number',   // E
          'Join Date',      // F
          'Birthday',       // G
          'Anniversary',    // H
          'Status',         // I
          'Dues Amount',    // J
          'Outstanding',    // K
          'Year'           // L
        ]]
      },
    });

    // Format the header row
    const formatRequests = [
      // Make header row bold
      {
        repeatCell: {
          range: {
            sheetId: response.data.sheets?.find(s => s.properties?.title === 'Members')?.properties?.sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true
              },
              backgroundColor: {
                red: 0.9,
                green: 0.9,
                blue: 0.9
              }
            }
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)'
        }
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: response.data.sheets?.find(s => s.properties?.title === 'Members')?.properties?.sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 12 // Number of columns (A to L)
          }
        }
      }
    ];

    // Apply formatting
    await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: formatRequests
      }
    });
    
    // Add headers to Payments sheet
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Payments!A1:H1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'ID',
          'Member Email',
          'Amount',
          'Date',
          'Method',
          'Month',
          'Year',
          'Status'
        ]]
      },
    });
    
    // Add headers to Users sheet
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A1:D1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Email',
          'Password',
          'Name',
          'IsAdmin'
        ]]
      },
    });

    // Format Payments and Users sheets headers
    const otherSheetsFormatRequests = ['Payments', 'Users'].map(sheetName => ({
      repeatCell: {
        range: {
          sheetId: response.data.sheets?.find(s => s.properties?.title === sheetName)?.properties?.sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            },
            backgroundColor: {
              red: 0.9,
              green: 0.9,
              blue: 0.9
            }
          }
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor)'
      }
    }));

    // Apply formatting to other sheets
    await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: otherSheetsFormatRequests
      }
    });
    
    return {
      message: 'Google Sheet structure initialized successfully',
    };
  } catch (error) {
    logError('Error initializing Google Sheet structure', error);
    throw new Error(`Failed to initialize Google Sheet structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update the insertDummyData function to initialize sheet first
export const insertDummyData = async () => {
  try {
    const auth = await getAuth();
    
    // First initialize the Google Sheet structure
    await initializeGoogleSheet();

    // Insert dummy members with correct column order:
    // A: Name
    // B: Email
    // C: Password
    // D: IsAdmin
    // E: Phone Number
    // F: Join Date
    // G: Birthday
    // H: Anniversary
    // I: Status
    // J: Dues Amount
    // K: Outstanding
    // L: Year
    const memberValues = [
      [
        'John Doe',                // Name
        'john.doe@example.com',    // Email
        '',                        // Password
        'FALSE',                   // IsAdmin
        '1234567890',             // Phone Number
        '2024-01-15',             // Join Date
        '1990-05-15',             // Birthday
        '2020-06-20',             // Anniversary
        'active',                  // Status
        '5000',                   // Dues Amount
        '0',                      // Outstanding
        '2024'                    // Year
      ],
      [
        'Jane Smith',
        'jane.smith@example.com',
        '',
        'FALSE',
        '1987654321',
        '2024-02-01',
        '1988-03-10',
        '2019-08-15',
        'active',
        '3000',
        '0',
        '2024'
      ],
      [
        'Mike Johnson',
        'mike.johnson@example.com',
        '',
        'FALSE',
        '1122334455',
        '2024-01-10',
        '1992-11-20',
        '2021-02-10',
        'inactive',
        '7500',
        '0',
        '2024'
      ],
      [
        'Sarah Williams',
        'sarah.williams@example.com',
        '',
        'FALSE',
        '1555666777',
        '2024-02-15',
        '1995-07-25',
        '2022-04-05',
        'active',
        '2000',
        '0',
        '2024'
      ],
      [
        'David Ibanga',
        'dibanga2800@gmail.com',
        '',
        'FALSE',
        '2348012345678',
        '2024-01-20',
        '1993-09-30',
        '2023-01-15',
        'active',
        '0',
        '120',
        '2024'
      ]
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Members!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: memberValues,
      },
    });

    // Insert dummy payments
    // A: ID
    // B: Member Email
    // C: Amount
    // D: Date
    // E: Method
    // F: Month
    // G: Year
    // H: Status
    const paymentValues = [
      [
        'PMT1',                    // ID
        'john.doe@example.com',    // Member Email
        '2000',                    // Amount
        '2024-02-20',             // Date
        'cash',                    // Method
        'February',                // Month
        '2024',                    // Year
        'completed'                // Status
      ],
      [
        'PMT2',
        'jane.smith@example.com',
        '1500',
        '2024-02-19',
        'transfer',
        'February',
        '2024',
        'completed'
      ],
      [
        'PMT3',
        'sarah.williams@example.com',
        '1000',
        '2024-02-18',
        'cash',
        'February',
        '2024',
        'completed'
      ],
      [
        'PMT4',
        'john.doe@example.com',
        '1500',
        '2024-01-15',
        'transfer',
        'January',
        '2024',
        'completed'
      ],
      [
        'PMT5',
        'jane.smith@example.com',
        '1000',
        '2024-01-10',
        'cash',
        'January',
        '2024',
        'completed'
      ]
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Payments!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: paymentValues,
      },
    });

    // Insert dummy users
    // A: Email
    // B: Password
    // C: IsAdmin
    // D: Name
    const userValues = [
      [
        'dibanga2800@gmail.com',       // Email
        await hashPassword('password123'),                // Password
        'true',                        // IsAdmin
        'David Ibanga'                 // Name
      ],
      [
        'admin@mensfellowship.com',
        await hashPassword('admin123'),
        'true',
        'Admin'
      ],
   
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: userValues,
      },
    });

    return {
      message: 'Dummy data inserted successfully',
      membersCount: memberValues.length,
      paymentsCount: paymentValues.length,
      usersCount: userValues.length
    };
  } catch (error) {
    logError('Error inserting dummy data', error);
    throw new Error('Failed to insert dummy data');
  }
};

interface ExtendedMemberData extends Omit<Member, 'id' | 'duesAmountPaid' | 'outstandingYTD'> {
  password?: string;
}

export const createMember = async (memberData: ExtendedMemberData): Promise<Member> => {
  try {
    const auth = await getAuth();
    
    // Generate new member ID (using email as ID)
    const newMember: Member = {
      id: memberData.email, // Using email as ID
      ...memberData,
      duesAmountPaid: 0,
      outstandingYTD: 120, // Initial outstanding amount
      totalDuesOwed: 120,
      memberStatus: memberData.memberStatus || 'inactive'
    };

    // Add member to the Members sheet in correct column order
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: MEMBERS_RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          newMember.name,            // A: Name
          newMember.email,           // B: Email
          '',                        // C: Password (empty in Members sheet)
          formatBoolean(memberData.isAdmin || false), // D: IsAdmin
          newMember.phoneNumber,     // E: Phone Number
          newMember.joinDate,        // F: Join Date
          newMember.birthday,        // G: Birthday
          newMember.anniversary,     // H: Anniversary
          newMember.memberStatus,    // I: Status
          newMember.duesAmountPaid,  // J: Dues Amount
          newMember.outstandingYTD,  // K: Outstanding
          newMember.year            // L: Year
        ]]
      }
    });

    return newMember;
  } catch (error) {
    logError('Error creating member', error);
    throw new Error('Failed to create member');
  }
};

export const updateMember = async (id: string, updates: Partial<Member>): Promise<Member> => {
  try {
    const auth = await getAuth();
    
    // Get all members to find the row to update
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: MEMBERS_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[MEMBER_COLUMNS.EMAIL] === id);
    
    if (rowIndex === -1) {
      throw new Error('Member not found');
    }

    // Get current member data
    const currentMember = await getMemberById(id);
    if (!currentMember) {
      throw new Error('Member not found');
    }

    // Merge updates with current data
    const updatedMember = {
      ...currentMember,
      ...updates,
      // Ensure required fields
      memberStatus: (updates.memberStatus || currentMember.memberStatus || 'inactive').toLowerCase(),
      duesAmountPaid: updates.duesAmountPaid ?? currentMember.duesAmountPaid ?? 0,
      outstandingYTD: updates.outstandingYTD ?? currentMember.outstandingYTD ?? 0,
      totalDuesOwed: updates.outstandingYTD ?? currentMember.outstandingYTD ?? 0
    };

    // Update the row in the sheet
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: `Members!A${rowIndex + 2}:L${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          updatedMember.name,            // A: Name
          updatedMember.email,           // B: Email
          '',                            // C: Password (empty in Members sheet)
          formatBoolean(updatedMember.isAdmin || false), // D: IsAdmin
          updatedMember.phoneNumber,     // E: Phone Number
          updatedMember.joinDate,        // F: Join Date
          updatedMember.birthday,        // G: Birthday
          updatedMember.anniversary,     // H: Anniversary
          updatedMember.memberStatus,    // I: Status
          updatedMember.duesAmountPaid,  // J: Dues Amount
          updatedMember.outstandingYTD,  // K: Outstanding
          updatedMember.year             // L: Year
        ]]
      }
    });

    return updatedMember;
  } catch (error) {
    logError('Error updating member', error);
    throw new Error('Failed to update member');
  }
};

export const deleteMember = async (id: string): Promise<void> => {
  try {
    const auth = await getAuth();
    
    // Get all members to find the row to delete
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: MEMBERS_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[MEMBER_COLUMNS.EMAIL] === id);
    
    if (rowIndex === -1) {
      throw new Error('Member not found');
    }

    // Clear the row
    await sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: `Members!A${rowIndex + 2}:K${rowIndex + 2}`,
    });
  } catch (error) {
    logError('Error deleting member', error);
    throw new Error('Failed to delete member');
  }
};

export const getUsers = async (): Promise<UserCredentials[]> => {
  try {
    const auth = await getAuth();
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      id: row[0],          // Email (Column A)
      email: row[0],       // Email (Column A)
      password: row[1],    // Password (Column B)
      isAdmin: normalizeBoolean(row[2]), // IsAdmin (Column C)
      name: row[3] || ''   // Name (Column D)
    }));
  } catch (error) {
    logError('Error fetching users', error);
    throw new Error('Failed to fetch users from Google Sheets');
  }
};

export const updateUser = async (email: string, updates: { name?: string; isAdmin?: boolean; password?: string }) => {
  try {
    const auth = await getAuth();
    
    // Get all users to find the row to update
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === email);
    
    if (rowIndex === -1) {
      throw new Error('User not found');
    }

    // Get current user data
    const currentUser = rows[rowIndex];
    
    // Prepare the update with all columns to maintain data integrity
    const updatedRow = [
      email,                                          // Email (A)
      updates.password ? await hashPassword(updates.password) : currentUser[1], // Password (B)
      updates.isAdmin !== undefined ? formatBoolean(updates.isAdmin) : currentUser[2], // IsAdmin (C)
      updates.name || currentUser[3],                 // Name (D)
    ];

    // Update the row
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!A${rowIndex + 2}:D${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    return {
      email,
      name: updatedRow[3],
      isAdmin: normalizeBoolean(updatedRow[2])
    };
  } catch (error) {
    logError('Error updating user', error);
    throw error;
  }
};

export const deleteUser = async (email: string): Promise<void> => {
  try {
    const auth = await getAuth();
    
    // Get all users to find the row to delete
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === email);
    
    if (rowIndex === -1) {
      throw new Error('User not found');
    }

    // Clear the row from Users sheet
    await sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!A${rowIndex + 2}:D${rowIndex + 2}`,
    });

    // Also check if user exists in Members sheet
    try {
      const membersResponse = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId: SPREADSHEET_ID,
        range: MEMBERS_RANGE,
      });

      const memberRows = membersResponse.data.values || [];
      const memberRowIndex = memberRows.findIndex(row => row[MEMBER_COLUMNS.EMAIL] === email);
      
      // If found in Members sheet, also clear that row
      if (memberRowIndex !== -1) {
        await sheets.spreadsheets.values.clear({
          auth,
          spreadsheetId: SPREADSHEET_ID,
          range: `Members!A${memberRowIndex + 2}:L${memberRowIndex + 2}`,
        });
      }
    } catch (memberError) {
      logError('Error checking/deleting member record', memberError);
      // Continue with user deletion even if member deletion fails
    }
  } catch (error) {
    logError('Error deleting user', error);
    throw new Error('Failed to delete user');
  }
}; 