import { Member } from '@/types';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { sendGmailEmail } from './gmail';
import { google } from 'googleapis';

// Extend the Member type for email purposes
interface MemberWithDues extends Member {
  totalDuesOwed: number;
}

// Initialize email provider based on configuration
const MAIL_PROVIDER = process.env.MAIL_PROVIDER || 'gmail'; // Default to Gmail

// Setup Resend if enabled
const resend = MAIL_PROVIDER === 'resend' 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Setup Nodemailer if enabled
const transporter = MAIL_PROVIDER === 'nodemailer'
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

// Email sender configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@gideonsarmy.com';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'noreply@gideonsarmy.com';

// Initialize Google Sheets for logging
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

// Log email attempt
async function logEmailAttempt(
  recipientEmail: string,
  emailType: string,
  status: 'success' | 'failed',
  error?: string
) {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Prepare log entry
    const timestamp = new Date().toISOString();
    const logEntry = [
      timestamp,
      recipientEmail,
      status,
      emailType,
      error || ''
    ];
    
    // Append to Email_Logs sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Email_Logs!A2:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [logEntry]
      }
    });
  } catch (error) {
    console.error('Failed to log email attempt:', error);
    // Don't throw error here as it's just logging
  }
}

// Send birthday greeting email
export async function sendBirthdayEmail(member: any) {
  const subject = 'Happy Birthday from the Gideon\'s Army!';
  
  const text = `
Dear ${member.name},

Wishing you a very happy birthday from all of us at the Gideon's Army!

May your day be filled with joy, peace, and blessings.

Best regards,
Gideon's Army Team
  `;
  
  const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Happy Birthday!</h2>
  <p>Dear ${member.name},</p>
  <p>Wishing you a very <strong>happy birthday</strong> from all of us at the Gideon's Army!</p>
  <p>May your day be filled with joy, peace, and blessings.</p>
  
  <div style="text-align: center; margin: 25px 0;">
    <img src="https://source.unsplash.com/400x200/?birthday,celebration" alt="Birthday Celebration" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
  
  <p>Best regards,<br>Gideon's Army Team</p>
</div>
  `;
  
  return await sendEmail({
    to: member.email,
    subject,
    text,
    html,
  });
}

// Send anniversary greeting email
export async function sendAnniversaryEmail(member: any) {
  const subject = 'Happy Anniversary from the Gideon\'s Army!';
  
  const text = `
Dear ${member.name},

Congratulations on your wedding anniversary from all of us at the Men's Fellowship!

May your marriage continue to be blessed with love, joy, and companionship.

Best regards,
Men's Fellowship Team
  `;
  
  const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Happy Anniversary!</h2>
  <p>Dear ${member.name},</p>
  <p>Congratulations on your <strong>wedding anniversary</strong> from all of us at the Gideon's Army!</p>
  <p>May your marriage continue to be blessed with love, joy, and companionship.</p>
  
  <div style="text-align: center; margin: 25px 0;">
    <img src="https://source.unsplash.com/400x200/?wedding,anniversary" alt="Wedding Anniversary" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
  
  <p>Best regards,<br>Gideon's Army Team</p>
</div>
  `;
  
  return await sendEmail({
    to: member.email,
    subject,
    text,
    html,
  });
}

// Send payment reminder email
export async function sendReminderEmail(member: MemberWithDues) {
  const subject = 'Payment Reminder - Men\'s Fellowship Dues';
  
  const text = `
Dear ${member.name},

This is a friendly reminder that you currently have an outstanding balance of $${member.totalDuesOwed.toFixed(2)} for your Men's Fellowship dues.

Please arrange to make your payment at your earliest convenience.

Your membership details:
- Membership since: ${member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'Not available'}
- Total outstanding: $${member.totalDuesOwed.toFixed(2)}

Thank you for your attention to this matter.

Best regards,
Men's Fellowship Admin Team
  `;
  
  const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Payment Reminder</h2>
  <p>Dear ${member.name},</p>
  <p>This is a friendly reminder that you currently have an outstanding balance of <strong>$${member.totalDuesOwed.toFixed(2)}</strong> for your Men's Fellowship dues.</p>
  <p>Please arrange to make your payment at your earliest convenience.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #444;">Your membership details:</h3>
    <ul style="list-style-type: none; padding-left: 0;">
      <li><strong>Membership since:</strong> ${member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'Not available'}</li>
      <li><strong>Total outstanding:</strong> $${member.totalDuesOwed.toFixed(2)}</li>
    </ul>
  </div>
  
  <p>Thank you for your attention to this matter.</p>
  <p>Best regards,<br>Men's Fellowship Admin Team</p>
</div>
  `;
  
  return await sendEmail({
    to: member.email,
    subject,
    text,
    html,
  });
}

// Send dues status email
export async function sendDuesStatusEmail(member: any) {
  const currentYear = new Date().getFullYear();
  const subject = `Dues Payment Status for ${currentYear}`;
  
  // Make sure balance and amountPaid are numbers with defaults
  const outstandingAmount = typeof member.balance === 'number' ? member.balance : 0;
  const paidAmount = typeof member.amountPaid === 'number' ? member.amountPaid : 0;
  
  const text = `
Dear ${member.name},

Here is your current dues payment status with Gideon's Army for the year ${currentYear}:

Balance (${currentYear}): £${outstandingAmount.toFixed(2)}
Amount Paid (${currentYear}): £${paidAmount.toFixed(2)}

If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
Gideon's Army
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dues Payment Status</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      margin: 0; 
      padding: 0; 
      color: #333; 
      background-color: #f0f0f0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
      background-color: #1e40af; 
      color: white; 
      padding: 20px; 
      text-align: center; 
    }
    .header h1 {
      color:rgb(65, 5, 175);
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content { 
      padding: 30px; 
      background-color: #ffffff;
    }
    h2 {
      color: #5a2691;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .amount-section {
      border: 1px solid #e8e8e8; 
      padding: 20px 25px; 
      margin: 0 0 12px;
      background-color: #ffffff; 
    }
    .amount-label {
      color: #555;
      font-size: 16px;
      margin: 0 0 5px;
      font-weight: normal;
    }
    .balance { 
      color: #e11d48; 
      font-size: 36px; 
      font-weight: bold;
      margin: 0;
      line-height: 1.2;
    }
    .paid { 
      color: #059669; 
      font-size: 36px; 
      font-weight: bold;
      margin: 0;
      line-height: 1.2;
    }
    .message {
      margin: 25px 0;
      font-size: 15px;
      color: #444;
    }
    .signature {
      margin-top: 30px;
    }
    .footer { 
      font-size: 12px; 
      text-align: center; 
      color: #666; 
      margin-top: 0;
      padding: 15px;
      background-color: #f5f5f5;
      border-top: 1px solid #eee;
    }
    .main-content {
      background-color: #f7f7f7;
      padding: 25px;
    }
    p {
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Gideon's Army</h1>
      <p>Dues Payment Status</p>
    </div>
    
    <div class="content">
      <h2>Dues Payment Status for ${currentYear}</h2>
      
      <p>Dear ${member.name},</p>
      
      <p>Here is your current dues payment status with Gideon's Army for the year ${currentYear}:</p>
      
      <div class="main-content">
        <div class="amount-section">
          <p class="amount-label">Balance (${currentYear})</p>
          <p class="balance">£${outstandingAmount.toFixed(2)}</p>
        </div>
        
        <div class="amount-section">
          <p class="amount-label">Amount Paid (${currentYear})</p>
          <p class="paid">£${paidAmount.toFixed(2)}</p>
        </div>
      </div>
      
      <p class="message">If you have any questions or concerns, please don't hesitate to reach out.</p>
      
      <div class="signature">
        <p>Best regards,<br>
        Gideon's Army</p>
      </div>
    </div>
    
    <div class="footer">
      This is an automated email from Gideon's Army Membership System.
    </div>
  </div>
</body>
</html>
  `;
  
  return await sendEmail({
    to: member.email,
    subject,
    text,
    html,
  });
}

// Generic email sending function
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string; }) {
  try {
    let result;
    
    switch (MAIL_PROVIDER) {
      case 'resend':
        if (!resend) throw new Error('Resend client not initialized');
        result = await resend.emails.send({
          from: EMAIL_FROM,
          to,
          subject,
          text,
          html,
          replyTo: EMAIL_REPLY_TO
        });
        break;
        
      case 'nodemailer':
        if (!transporter) throw new Error('Nodemailer transporter not initialized');
        result = await transporter.sendMail({
          from: EMAIL_FROM,
          to,
          subject,
          text,
          html,
          replyTo: EMAIL_REPLY_TO
        });
        break;
        
      case 'gmail':
        result = await sendGmailEmail({
          to,
          subject,
          text,
          html,
          from: EMAIL_FROM
        });
        break;
        
      default:
        // Simulation mode for development
        console.log('Email simulation mode:', {
          to,
          subject,
          textLength: text.length,
          htmlLength: html.length
        });
        result = { status: 'simulated', to, subject };
    }
    
    // Log successful email
    await logEmailAttempt(to, subject, 'success');
    
    return result;
  } catch (error) {
    // Log failed email
    await logEmailAttempt(
      to,
      subject,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    throw error;
  }
} 