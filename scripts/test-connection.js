const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Testing Google Sheets connection...\n');
    
    // Log environment variables (partially hidden)
    console.log('Environment Variables:');
    console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID);
    console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL);
    console.log('GOOGLE_PRIVATE_KEY:', 'Set (hidden)');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/^'|'$/g, ''),  // Remove single quotes
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Try to get spreadsheet info
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    console.log('\n✅ Successfully connected to Google Sheets!');
    console.log('Spreadsheet title:', response.data.properties.title);
    console.log('Sheets:', response.data.sheets.map(sheet => sheet.properties.title).join(', '));

  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    if (error.errors) {
      console.error('Detailed error:', JSON.stringify(error.errors, null, 2));
    }
  }
}

testConnection(); 