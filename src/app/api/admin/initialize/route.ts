import { NextRequest, NextResponse } from 'next/server';
import { initializeGoogleSheet } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Sheets not configured, initialization skipped');
      return NextResponse.json({
        message: 'Google Sheets not configured. Using mock data instead.',
        usingMockData: true
      });
    }

    // Initialize Google Sheet structure
    const result = await initializeGoogleSheet();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error initializing Google Sheet structure:', error);
    
    // Return a more user-friendly error message
    return NextResponse.json({
      message: 'Google Sheets not configured. Using mock data instead.',
      usingMockData: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 