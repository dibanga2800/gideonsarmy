import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = 'dibanga2800@gmail.com';
const ADMIN_PASSWORD = 'Admin@123'; // This should be changed after first login
const ADMIN_NAME = 'Admin User';

// Initialize the sheets API
const sheets = google.sheets('v4');

// Create JWT client using service account credentials
const getAuth = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
};

async function initializeSheet(auth, spreadsheetId) {
  try {
    // Check if sheet exists and has the required tabs
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId,
    });

    const sheetTitles = response.data.sheets?.map(sheet => sheet.properties?.title) || [];

    // Create sheet requests array
    const requests = [];

    // Add Users sheet if it doesn't exist
    if (!sheetTitles.includes('Users')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Users',
          }
        }
      });
    }

    // Execute the requests to create sheets if needed
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        auth,
        spreadsheetId,
        requestBody: {
          requests,
        },
      });
    }

    // Add headers to Users sheet
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: 'Users!A1:D1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Email', 'Password', 'IsAdmin', 'Name']],
      },
    });

    console.log('Sheet structure initialized successfully');
  } catch (error) {
    console.error('Error initializing sheet structure:', error);
    throw error;
  }
}

async function addAdminUser() {
  try {
    console.log('Adding admin user to Google Sheet...');

    const auth = await getAuth();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheet ID not configured');
    }

    // Initialize sheet structure
    await initializeSheet(auth, spreadsheetId);

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // First, check if user already exists
    const checkResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Users!A2:A',
    });

    const userEmails = checkResponse.data.values || [];
    const userExists = userEmails.some(row => row[0] === ADMIN_EMAIL);

    if (userExists) {
      console.log('Admin user already exists in the sheet');
      return;
    }

    // Add user to the Users sheet
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Users!A2:D2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[ADMIN_EMAIL, hashedPassword, 'true', ADMIN_NAME]]
      }
    });

    console.log('\n======= ADMIN USER ADDED SUCCESSFULLY =======');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Name:', ADMIN_NAME);
    console.log('==========================================\n');

    console.log('Please change the password after first login.');
  } catch (error) {
    console.error('Error adding admin user:', error);
    process.exit(1);
  }
}

// Run the script
addAdminUser(); 