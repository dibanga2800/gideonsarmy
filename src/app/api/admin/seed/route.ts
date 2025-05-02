import { NextRequest, NextResponse } from 'next/server';
import { insertDummyData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Sheets not configured, seeding skipped');
      return NextResponse.json({
        message: 'Google Sheets not configured. Mock data will be used instead.',
        usingMockData: true
      });
    }

    // Insert dummy data without requiring authentication
    const result = await insertDummyData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({
      message: 'Google Sheets not configured. Mock data will be used instead.',
      usingMockData: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 