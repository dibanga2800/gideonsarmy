import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nextauth_url: process.env.NEXTAUTH_URL ? 'Set' : 'Not set',
    nextauth_secret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
    google_client_email: process.env.GOOGLE_CLIENT_EMAIL ? 'Set' : 'Not set',
    google_private_key: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set',
    google_sheet_id: process.env.GOOGLE_SHEET_ID ? 'Set' : 'Not set',
    email_config: process.env.RESEND_API_KEY ? 'Using Resend' : 
      (process.env.EMAIL_SERVER_USER ? 'Using Nodemailer' : 'Not configured'),
  });
} 