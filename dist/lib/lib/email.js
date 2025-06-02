import nodemailer from 'nodemailer';
import { Resend } from 'resend';
// Initialize email provider based on configuration
const MAIL_PROVIDER = process.env.MAIL_PROVIDER || 'nodemailer';
// Setup Resend if enabled
const resend = MAIL_PROVIDER === 'resend'
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
// Email sender configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@gideonsarmy.com';
const EMAIL_REPLY_TO = process.env.EMAIL_FROM || 'noreply@gideonsarmy.com';
// Generic email sending function
export async function sendEmail({ to, subject, text, html }) {
    // Log email details for debugging
    console.log('Email Configuration:', {
        to,
        subject,
        from: EMAIL_FROM,
        nodeEnv: process.env.NODE_ENV,
        emailServerHost: process.env.EMAIL_SERVER_HOST,
        emailServerPort: process.env.EMAIL_SERVER_PORT,
        emailServerUser: process.env.EMAIL_SERVER_USER,
        hasPassword: !!process.env.EMAIL_SERVER_PASSWORD
    });
    try {
        // Validate required environment variables
        const requiredVars = [
            'EMAIL_SERVER_HOST',
            'EMAIL_SERVER_PORT',
            'EMAIL_SERVER_USER',
            'EMAIL_SERVER_PASSWORD',
            'EMAIL_FROM'
        ];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables in .env.local: ${missingVars.join(', ')}`);
        }
        const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
        if (isNaN(port)) {
            throw new Error('EMAIL_SERVER_PORT must be a valid number');
        }
        // Create Nodemailer transporter with secure configuration
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
            tls: {
                // Enable secure SSL/TLS connections
                minVersion: 'TLSv1.2',
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        });
        // Verify SMTP connection configuration
        try {
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('✓ SMTP connection verified successfully');
        }
        catch (verifyError) {
            const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error';
            console.error('SMTP connection verification failed:', errorMessage);
            // Provide more detailed error information
            if (errorMessage.includes('ECONNREFUSED')) {
                throw new Error(`SMTP connection refused. Please check if the email server is accessible at ${process.env.EMAIL_SERVER_HOST}:${port}`);
            }
            else if (errorMessage.includes('ETIMEDOUT')) {
                throw new Error(`SMTP connection timed out. Please check your network connection and email server settings.`);
            }
            else if (errorMessage.includes('AUTH')) {
                throw new Error(`SMTP authentication failed. Please check your email server credentials in .env.local`);
            }
            else if (errorMessage.includes('CERT')) {
                throw new Error(`SSL/TLS certificate validation failed. If testing locally, you may need to set NODE_ENV to 'development'`);
            }
            else {
                throw new Error(`SMTP connection failed: ${errorMessage}`);
            }
        }
        // Send email using Nodemailer
        console.log('Sending email via Nodemailer...');
        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            replyTo: EMAIL_REPLY_TO,
            to,
            subject,
            text,
            html,
        });
        console.log('✓ Email sent successfully:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error) {
            throw new Error(`Email sending failed: ${error.message}`);
        }
        else {
            throw new Error('Email sending failed with unknown error');
        }
    }
}
// Re-export email template functions
export { sendBirthdayEmail, sendAnniversaryEmail, sendReminderEmail, sendDuesStatusEmail } from './emailTemplates.js';
