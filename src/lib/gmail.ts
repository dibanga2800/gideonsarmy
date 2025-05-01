import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
}

// Function to get credentials with fallback to development defaults
function getCredentials(): GmailCredentials {
  // In Next.js, environment variables might be undefined in some contexts
  const credentials: GmailCredentials = {
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground',
  };

  // For development testing, use fallback credentials if needed
  if (process.env.NODE_ENV === 'development' && 
      (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken)) {
    console.warn('⚠️ Gmail API credentials not found in environment variables. Using development fallback mode.');
    return credentials;
  }

  // Log credential status without exposing values
  console.log('Gmail credentials check:', {
    clientId: credentials.clientId ? `${credentials.clientId.substring(0, 5)}...` : 'MISSING',
    clientSecret: credentials.clientSecret ? `${credentials.clientSecret.substring(0, 3)}...` : 'MISSING',
    refreshToken: credentials.refreshToken ? `${credentials.refreshToken.substring(0, 5)}...` : 'MISSING',
    redirectUri: credentials.redirectUri,
  });

  return credentials;
}

/**
 * Creates a new OAuth2 client with credentials
 */
function createOAuth2Client(): OAuth2Client {
  const credentials = getCredentials();
  const { clientId, clientSecret, redirectUri } = credentials;
  
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  
  oAuth2Client.setCredentials({
    refresh_token: credentials.refreshToken
  });
  
  return oAuth2Client;
}

/**
 * Sends an email using Gmail API
 */
export async function sendGmailEmail({
  to,
  subject,
  text,
  html,
  from = process.env.EMAIL_FROM || 'noreply@gideonsarmy.com'
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
}) {
  try {
    const credentials = getCredentials();
    
    // Check if credentials are provided
    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
      console.warn('Gmail API credentials are missing, using simulation mode');
      
      // Simulate sending email in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('================ SIMULATED EMAIL ================');
        console.log(`To: ${to}`);
        console.log(`From: ${from}`);
        console.log(`Subject: ${subject}`);
        console.log('----------- TEXT CONTENT -----------');
        console.log(text);
        console.log('----------- HTML CONTENT -----------');
        console.log(html);
        console.log('================ END EMAIL ================');
        
        return {
          messageId: `mock_${Date.now()}`,
          threadId: `mock_thread_${Date.now()}`,
          labelIds: ['SENT'],
          status: 'simulated'
        };
      } else {
        throw new Error('Gmail API credentials are not configured');
      }
    }
    
    // Create OAuth2 client
    const auth = createOAuth2Client();
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Encode email to base64url format
    const emailLines = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="boundary"',
      '',
      '--boundary',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      text,
      '',
      '--boundary',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      html,
      '',
      '--boundary--'
    ];
    
    const email = emailLines.join('\r\n').trim();
    
    // Base64url encode the email
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send the email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
    
    console.log('Email sent with Gmail API:', result.data);
    
    return {
      messageId: result.data.id,
      threadId: result.data.threadId,
      labelIds: result.data.labelIds,
    };
  } catch (error) {
    console.error('Error sending email with Gmail API:', error);
    throw error;
  }
} 