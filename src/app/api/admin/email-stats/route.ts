import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// Initialize Google Sheets
const getAuth = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
};

export async function GET() {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Initialize Google Sheets
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get email logs from the Email_Logs sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Email_Logs!A2:E',
    });

    const rows = response.data.values || [];
    
    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const totalSent = rows.length;
    const failedToday = rows.filter(row => {
      const date = row[0]?.split('T')[0]; // Assuming first column is timestamp
      const status = row[2]; // Assuming third column is status
      return date === today && status === 'failed';
    }).length;
    
    // Get last sent email timestamp
    const lastSentAt = rows.length > 0 ? rows[rows.length - 1][0] : null;

    return NextResponse.json({
      totalSent,
      failedToday,
      lastSentAt
    });

  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      { error: "Failed to fetch email statistics" },
      { status: 500 }
    );
  }
} 