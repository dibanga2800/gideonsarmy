@echo off
echo # NextAuth Configuration > .env.local
echo NEXTAUTH_URL=http://localhost:3000 >> .env.local
echo NEXTAUTH_SECRET=aQ4FirJ1Q8gUiGmnaxH5EB/5iUSN0rZdgS2ESjlMF8k= >> .env.local
echo. >> .env.local
echo # Google Sheets API Configuration >> .env.local
echo GOOGLE_CLIENT_EMAIL= >> .env.local
echo GOOGLE_PRIVATE_KEY="" >> .env.local
echo GOOGLE_SHEET_ID= >> .env.local
echo. >> .env.local
echo # Email Configuration (choose either Resend or Nodemailer) >> .env.local
echo # If using Resend: >> .env.local
echo RESEND_API_KEY= >> .env.local
echo. >> .env.local
echo # If using Nodemailer: >> .env.local
echo EMAIL_SERVER_HOST=smtp.gmail.com >> .env.local
echo EMAIL_SERVER_PORT=587 >> .env.local
echo EMAIL_SERVER_USER= >> .env.local
echo EMAIL_SERVER_PASSWORD= >> .env.local
echo EMAIL_FROM= >> .env.local 