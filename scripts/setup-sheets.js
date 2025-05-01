const { google } = require('googleapis');
const { authenticate } = require('../auth');

async function setupSheets() {
  try {
    // Authenticate with Google Sheets
    const auth = await authenticate();
    const sheets = google.sheets({ version: 'v4', auth });

    // Get the spreadsheet ID from environment variables
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error('SPREADSHEET_ID environment variable is not set');
    }

    // Define the column headers and their formatting
    const headers = [
      'Name',
      'Email',
      'Phone Number',
      'Date Joined',
      'Membership Type',
      'Amount Paid (₦)',
      'Payment Date',
      'Payment Status',
      'Notes'
    ];

    // Update the Members worksheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Members!A1:I1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers]
      }
    });

    // Apply formatting to the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          // Make headers bold
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  verticalAlignment: 'MIDDLE',
                  wrapStrategy: 'WRAP'
                }
              },
              fields: 'userEnteredFormat(textFormat,verticalAlignment,wrapStrategy)'
            }
          },
          // Freeze the header row
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1
                }
              },
              fields: 'gridProperties.frozenRowCount'
            }
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length
              }
            }
          },
          // Format amount column to use Naira currency
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 1,
                startColumnIndex: 5,
                endColumnIndex: 6
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
          }
        ]
      }
    });

    console.log('✅ Google Sheets setup completed successfully');
    console.log('- Headers added and formatted');
    console.log('- First row frozen');
    console.log('- Columns auto-resized');
    console.log('- Currency formatting applied to Amount column');

  } catch (error) {
    console.error('❌ Error setting up Google Sheets:', error.message);
    process.exit(1);
  }
}

setupSheets(); 