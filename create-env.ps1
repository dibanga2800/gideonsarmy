$envContent = @"
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=aQ4FirJ1Q8gUiGmnaxH5EB/5iUSN0rZdgS2ESjlMF8k=

# Google Sheets API Configuration
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=""
GOOGLE_SHEET_ID=

# Email Configuration (choose either Resend or Nodemailer)
# If using Resend:
RESEND_API_KEY=

# If using Nodemailer:
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Add any additional environment variables below
"@

Set-Content -Path ".env.local" -Value $envContent 