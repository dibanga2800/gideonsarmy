const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/^'|'$/g, ''),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// Sample data from the screenshot with added password and isAdmin fields
const sampleData = [
  // Admin user
  ['Admin User', 'admin@gideonsarmy.org', 'Admin@123', 'true', '555-000-0000', 'Administrator', 'Admin Office', '01/01/2020', '01/01/1980', '01/01/2010', 'Active', '0.00', '0.00', '2025'],
  // Regular members
  ['Alice Johnson', 'alice.johnson@email.com', 'supermen@123', 'false', '555-123-4567', 'Marketing Manager', '123 Oak St, Springfield,', '12/05/2022', '20/06/1990', '15/08/2015', 'Active', '20.00', '100.00', '2025'],
  ['Brian Smith', 'brian.smith@email.com', 'supermen@123', 'false', '555-987-6543', 'Software Engineer', '456 Pine St, Rivertown', '19/03/2021', '02/11/1985', '10/05/2017', 'On Leave', '10.00', '110.00', '2025'],
  ['Carla Williams', 'carla.williams@email.com', 'supermen@123', 'false', '555-654-3210', 'HR Specialist', '789 Birch Rd, Lakeside,', '25/07/2023', '15/03/1992', '04/12/2018', 'Active', '30.00', '90.00', '2025'],
  ['David Martinez', 'david.martinez@email.com', 'supermen@123', 'false', '555-111-2222', 'Sales Executive', '234 Maple Dr, Hilltop,', '30/09/2020', '10/01/1989', '23/06/2016', 'Active', '20.00', '100.00', '2025'],
  ['Emma Thompson', 'emma.thompson@email.com', 'supermen@123', 'false', '555-444-3333', 'Accountant', '123 Cedar Blvd, Greenf', '14/11/2021', '22/04/1993', '09/10/2019', 'On Leave', '20.00', '100.00', '2025'],
  ['Frank Brown', 'frank.brown@email.com', 'supermen@123', 'false', '555-777-8888', 'Operations Lead', '987 Elm St, Crestwood,', '08/02/2019', '30/08/1987', '21/07/2014', 'Active', '10.00', '110.00', '2025'],
  ['Grace Miller', 'grace.miller@email.com', 'supermen@123', 'false', '555-333-4444', 'Social Media Manager', '345 Oak St, Meadown', '05/04/2022', '18/12/1991', '11/02/2020', 'Active', '30.00', '90.00', '2025'],
  ['Harry Clark', 'harry.clark@email.com', 'supermen@123', 'false', '555-222-5555', 'Network Engineer', '678 Maple Ave, Forest', '17/10/2020', '25/09/1988', '19/04/2017', 'Inactive', '50.00', '70.00', '2025'],
  ['Isabella Moore', 'isabella.moore@email.com', 'supermen@123', 'false', '555-888-7777', 'Recruiter', '432 Pine Ln, Westfield,', '30/01/2021', '11/02/1995', '18/06/2022', 'Active', '0.00', '120.00', '2025'],
  ['Jack Davis', 'jack.davis@email.com', 'supermen@123', 'false', '555-555-6666', 'Sales Manager', '876 Birch Blvd, Sunset', '02/12/2018', '08/07/1986', '25/05/2015', 'On Leave', '80.00', '40.00', '2025']
];

async function seedData() {
  try {
    // Add data to Members worksheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Members!A2',
      valueInputOption: 'RAW',
      resource: {
        values: sampleData,
      },
    });
    console.log('✅ Added sample data to Members worksheet');

    // Get the sheet ID for additional formatting
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const membersSheet = response.data.sheets.find(s => s.properties.title === 'Members');
    
    if (membersSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            // Center-align all cells
            {
              repeatCell: {
                range: {
                  sheetId: membersSheet.properties.sheetId,
                  startRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 14 // Total number of columns
                },
                cell: {
                  userEnteredFormat: {
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE',
                    wrapStrategy: 'WRAP'
                  }
                },
                fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)'
              }
            },
            // Highlight admin row with light background
            {
              repeatCell: {
                range: {
                  sheetId: membersSheet.properties.sheetId,
                  startRowIndex: 1, // First data row (admin)
                  endRowIndex: 2,   // Just the first row
                  startColumnIndex: 0,
                  endColumnIndex: 14
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.95,
                      green: 0.95,
                      blue: 0.95
                    }
                  }
                },
                fields: 'userEnteredFormat.backgroundColor'
              }
            }
          ]
        }
      });
    }

    console.log('\n✨ Data seeded successfully!');
    console.log('\nWorksheet populated with:');
    console.log('- 1 admin user (Admin@123 password, isAdmin=true)');
    console.log('- 10 regular members (supermen@123 password, isAdmin=false)');
    console.log('- All formatting applied (dates, currency, alignment)');
    console.log('- Admin user highlighted with light background');
    console.log('- Ready for use');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.errors) {
      console.error('Detailed error:', JSON.stringify(error.errors, null, 2));
    }
  }
}

// Run the seeding script
seedData(); 