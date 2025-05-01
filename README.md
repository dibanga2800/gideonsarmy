# Men's Fellowship Membership Management System

A secure fullstack web application for managing members, dues payments, and sending email reminders.

## Features

- **Authentication**
  - Secure login system with bcrypt hashed passwords
  - Protected routes based on user roles (members vs admins)

- **Member Dashboard**
  - View personal dues information
  - Payment history
  - Monthly payment status
  - Important dates (join date, birthday, anniversary)

- **Admin Dashboard**
  - Comprehensive statistics
  - Member management
  - Payment recording
  - Email reminders

- **Security**
  - Server-side authentication
  - Protected API routes
  - Environment variable configuration
  - Password hashing

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Google Sheets API
- **Authentication**: NextAuth.js
- **Email**: Nodemailer/Resend
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Google Cloud account with Sheets API enabled
- Google service account credentials

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/mens-fellowship-app.git
   cd mens-fellowship-app
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create `.env.local` file based on `.env.example`
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_EMAIL=your-service-account@example.com
   GOOGLE_PRIVATE_KEY="your-private-key"
   GOOGLE_SHEET_ID=your-spreadsheet-id
   # ... other variables
   ```

### Google Sheets Setup

1. Create a Google Cloud project and enable the Google Sheets API
2. Create a service account and download the credentials JSON file
3. Create a Google Sheet with the following worksheets:
   - Members (columns: id, email, name, joinDate, birthday, anniversary, totalDuesOwed)
   - Payments (columns: id, memberId, amount, date, method, month, year, status)
   - Users (columns: email, password, isAdmin)
4. Share the spreadsheet with the service account email (Editor permissions)

### Running the Application

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` in your browser.

### Creating Initial Admin User

1. Add a user to the Users worksheet with the following format:
   - email: admin@example.com
   - password: [bcrypt hashed password]
   - isAdmin: true

   You can generate a bcrypt hash using online tools or via Node.js:
   ```js
   const bcrypt = require('bcryptjs');
   const hashedPassword = bcrypt.hashSync('your-password', 10);
   console.log(hashedPassword);
   ```

## Deployment

This project can be deployed on Vercel with minimal configuration:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add all environment variables from `.env.local` to Vercel
4. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details. 