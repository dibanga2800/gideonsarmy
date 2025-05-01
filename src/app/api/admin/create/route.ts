import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { hashPassword } from '@/lib/googleSheets';

// The admin credentials we want to add
const ADMIN_EMAIL = 'dibanga2800@gmail.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'Admin User';

export async function GET() {
  try {
    // Initialize the Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets('v4');
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    // Hash the admin password
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // First, check if user already exists
    const checkResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Users!A:A',
    });

    const userEmails = checkResponse.data.values || [];
    const userExists = userEmails.some(row => row[0] === ADMIN_EMAIL);

    // If user exists, don't add it again
    if (userExists) {
      return NextResponse.json(
        { message: 'Admin user already exists' },
        { status: 200 }
      );
    }

    // Add user to the Users sheet
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Users!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[ADMIN_EMAIL, hashedPassword, 'true', ADMIN_NAME]]
      }
    });

    // Check if the user also exists in Members sheet
    const membersCheckResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Members!B:B', // Email column
    });

    const memberEmails = membersCheckResponse.data.values || [];
    const memberExists = memberEmails.some(row => row[0] === ADMIN_EMAIL);

    // If member doesn't exist, add it
    if (!memberExists) {
      const memberId = `MEM${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];

      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Members!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[memberId, ADMIN_EMAIL, ADMIN_NAME, today, '', '', '0']]
        }
      });
    }

    return NextResponse.json(
      { 
        message: 'Admin user created successfully',
        credentials: {
          email: ADMIN_EMAIL,
          password: '[HIDDEN]', // Don't expose the password
          isAdmin: true,
          name: ADMIN_NAME
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
} 