const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/^'|'$/g, ''),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function createWorksheets() {
  try {
    // Get existing sheets
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = response.data.sheets;

    // First create our new Members sheet
    console.log('Creating Members worksheet...');
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: 'Members',
              gridProperties: {
                frozenRowCount: 1,
                frozenColumnCount: 2
              }
            }
          }
        }]
      }
    });
    
    const newSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;

    // Now we can safely delete other sheets
    const deleteRequests = existingSheets
      .filter(sheet => sheet.properties.title !== 'Members')
      .map(sheet => ({
        deleteSheet: {
          sheetId: sheet.properties.sheetId
        }
      }));

    if (deleteRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: deleteRequests
        }
      });
      console.log('Removed old sheets');
    }

    // Define headers
    const headers = [
      'Name',
      'Email',
      'password',
      'isAdmin',
      'Phone',
      'Occupation',
      'Address',
      'Join Date',
      'Birthday',
      'Anniversary',
      'Status',
      'AmountPaid',
      'Balance',
      'Year'
    ];

    // Set headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Members!A1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });
    console.log('✅ Set headers');

    // Format the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          // Format headers
          {
            repeatCell: {
              range: {
                sheetId: newSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.8, green: 0.8, blue: 0.8 },
                  textFormat: { bold: true },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
            }
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: newSheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length
              }
            }
          },
          // Format amount columns with currency
          {
            repeatCell: {
              range: {
                sheetId: newSheetId,
                startRowIndex: 1,
                startColumnIndex: 11, // AmountPaid column
                endColumnIndex: 13 // Balance column + 1
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: 'CURRENCY',
                    pattern: '₦#,##0.00'
                  }
                }
              },
              fields: 'userEnteredFormat.numberFormat'
            }
          },
          // Format date columns
          {
            repeatCell: {
              range: {
                sheetId: newSheetId,
                startRowIndex: 1,
                startColumnIndex: 7, // Join Date column
                endColumnIndex: 10 // Anniversary column + 1
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: 'DATE',
                    pattern: 'dd/MM/yyyy'
                  }
                }
              },
              fields: 'userEnteredFormat.numberFormat'
            }
          }
        ]
      }
    });
    console.log('✅ Applied formatting');

    console.log('\n✨ Worksheet created successfully!');
    console.log('\nNext step: Run seed-data.js to populate the worksheet with initial data.');

  } catch (error) {
    console.error('❌ Error creating worksheets:', error.message);
    if (error.errors) {
      console.error('Detailed error:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

// Run the script
createWorksheets(); 