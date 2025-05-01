# Setting Up Gmail API for Sending Emails

This guide will walk you through setting up the Gmail API OAuth2 credentials to send emails from your application.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on "Create Project" or select an existing project.
3. Give your project a name (e.g., "Gideon's Army Email Service").
4. Click "Create" to create the project.

## Step 2: Enable the Gmail API

1. In your Google Cloud Console, navigate to "APIs & Services" > "Library".
2. Search for "Gmail API" and select it.
3. Click "Enable" to enable the Gmail API for your project.

## Step 3: Configure OAuth Consent Screen

1. In your Google Cloud Console, navigate to "APIs & Services" > "OAuth consent screen".
2. Select "External" user type (unless you have a Google Workspace domain).
3. Click "Create".
4. Fill in the required fields:
   - App name: "Gideon's Army Email Service"
   - User support email: (your email address)
   - Developer contact information: (your email address)
5. Click "Save and Continue".
6. On the "Scopes" page, click "Add or Remove Scopes".
7. Add the following scope: `https://www.googleapis.com/auth/gmail.send`
8. Click "Save and Continue".
9. Add test users if you're still in testing (you can add your own email).
10. Click "Save and Continue", then "Back to Dashboard".

## Step 4: Create OAuth Credentials

1. In your Google Cloud Console, navigate to "APIs & Services" > "Credentials".
2. Click "Create Credentials" > "OAuth client ID".
3. Application type: "Web application".
4. Name: "Gideon's Army Email Client".
5. Authorized redirect URIs: Add `https://developers.google.com/oauthplayground`
6. Click "Create".
7. Note down the "Client ID" and "Client Secret" - you'll need these later.

## Step 5: Generate Refresh Token

1. Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Click the settings icon (⚙️) in the top right corner.
3. Check "Use your own OAuth credentials".
4. Enter your OAuth Client ID and Client Secret from the previous step.
5. Close the settings panel.
6. In the left panel, scroll down to "Gmail API v1" and select `https://www.googleapis.com/auth/gmail.send`.
7. Click "Authorize APIs".
8. Sign in with your Google account and grant the permissions.
9. On the next screen, click "Exchange authorization code for tokens".
10. Note down the "Refresh token" - you'll need this for your application.

## Step 6: Update .env.local File

Create or update your `.env.local` file in the root of your project with the following values:

```
# Email Configuration
MAIL_PROVIDER=gmail
EMAIL_FROM=your-email@gmail.com
EMAIL_REPLY_TO=your-email@gmail.com

# Gmail API Credentials
GMAIL_CLIENT_ID=your-client-id-here
GMAIL_CLIENT_SECRET=your-client-secret-here
GMAIL_REFRESH_TOKEN=your-refresh-token-here
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
```

Replace the placeholders with your actual values.

## Important Security Notes

1. Never commit your `.env.local` file to version control.
2. For production, consider using a secure environment variable management system.
3. The Gmail API has quotas and limitations - check the [official documentation](https://developers.google.com/gmail/api/reference/quota) for details.
4. If your app sends a large volume of emails, consider using a dedicated email service like SendGrid, Mailgun, or AWS SES instead.

## Troubleshooting

- If you get authentication errors, verify that your credentials are correct.
- If your tokens expire, you may need to generate a new refresh token.
- Make sure the Gmail account you're using hasn't enabled advanced security features that might block API access.
- Check that the scopes you've enabled match the operations you're performing. 