import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Sample data for seeding
const sampleMembers = [
  {
    id: 'M001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'Password123',
    joinDate: '2024-01-01',
    memberStatus: 'active',
    birthday: '1985-05-15',
    anniversaryDate: '2010-06-20',
    duesAmountPaid: 5000,
    outstandingYTD: 1000,
    year: '2024'
  },
  {
    id: 'M002',
    name: 'James Smith',
    email: 'james.smith@example.com',
    password: 'Password123',
    joinDate: '2024-02-01',
    memberStatus: 'active',
    birthday: '1990-03-10',
    anniversaryDate: '2015-09-15',
    duesAmountPaid: 3000,
    outstandingYTD: 3000,
    year: '2024'
  }
];

const users = [
  {
    email: 'dibanga2800@gmail.com',
    password: 'Admin@123',
    name: 'Admin User',
    isAdmin: true
  }
];

async function initializeSheets() {
  try {
    console.log('Initializing Google Sheets...');
    
    const auth = await getAuth();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheet ID not configured');
    }

    // Get existing sheets
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId,
    });

    const existingSheets = response.data.sheets || [];
    const sheetTitles = existingSheets.map(sheet => sheet.properties?.title);

    // Create batch update requests
    const requests = [];

    // Create Members sheet if it doesn't exist
    if (!sheetTitles.includes('Members')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Members',
            gridProperties: {
              rowCount: 1000,
              columnCount: 12
            }
          }
        }
      });
    }

    // Create Users sheet if it doesn't exist
    if (!sheetTitles.includes('Users')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Users',
            gridProperties: {
              rowCount: 1000,
              columnCount: 4
            }
          }
        }
      });
    }

    // Execute batch update if there are any requests
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        auth,
        spreadsheetId,
        requestBody: {
          requests
        }
      });
    }

    // Clear existing data from Members sheet
    if (sheetTitles.includes('Members')) {
      await sheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: 'Members!A:K'
      });
    }

    // Clear existing data from Users sheet
    if (sheetTitles.includes('Users')) {
      await sheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: 'Users!A:D'
      });
    }

    // Add headers to Members sheet
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: 'Members!A1:K1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Id',
          'Name',
          'Email',
          'Password',
          'Join Date',
          'Member Status',
          'Birthday',
          'Anniversary Date',
          'Dues Amount Paid',
          'Outstanding YTD',
          'Year'
        ]]
      }
    });

    // Add headers to Users sheet
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: 'Users!A1:D1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Email', 'Password', 'Name', 'IsAdmin']]
      }
    });

    // Seed Members data
    const memberRows = await Promise.all(sampleMembers.map(async member => {
      const hashedPassword = await bcrypt.hash(member.password, 10);
      return [
        member.id,
        member.name,
        member.email,
        hashedPassword,
        member.joinDate,
        member.memberStatus,
        member.birthday,
        member.anniversaryDate,
        member.duesAmountPaid,
        member.outstandingYTD,
        member.year
      ];
    }));

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Members!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: memberRows
      }
    });

    // Seed Users data
    const userRows = await Promise.all(users.map(async user => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return [
        user.email,
        hashedPassword,
        user.name,
        user.isAdmin ? 'true' : 'false'
      ];
    }));

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Users!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: userRows
      }
    });

    console.log('Sheets initialized and seeded successfully!');
  } catch (error) {
    console.error('Error initializing sheets:', error);
    throw error;
  }
}

// Run the initialization
initializeSheets(); 