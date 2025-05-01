const { google } = require('googleapis');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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

async function migrateUsers() {
  try {
    const auth = await getAuth();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheet ID not configured');
    }

    // Get existing users
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Users!A:D',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.log('No users found to migrate');
      return;
    }

    // Hash passwords and update users
    const updatedUsers = await Promise.all(rows.map(async (row) => {
      const [email, password, isAdmin, name] = row;
      
      // Skip if password is already hashed (starts with $2b$)
      if (password.startsWith('$2b$')) {
        return row;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      return [email, hashedPassword, isAdmin, name];
    }));

    // Update the sheet with hashed passwords
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: 'Users!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: updatedUsers
      }
    });

    console.log('Successfully migrated users to secure password storage');
  } catch (error) {
    console.error('Error migrating users:', error);
    process.exit(1);
  }
}

migrateUsers(); 