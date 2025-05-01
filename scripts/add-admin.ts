import { createUser } from '../src/lib/googleSheets';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = 'dibanga2800@gmail.com';
const ADMIN_PASSWORD = 'Admin@123'; // This should be changed after first login
const ADMIN_NAME = 'Admin User';

async function addAdminUser() {
  try {
    console.log('Adding admin user to Google Sheet...');
    
    const user = await createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      isAdmin: true
    });

    console.log('\n======= ADMIN USER ADDED SUCCESSFULLY =======');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Name:', ADMIN_NAME);
    console.log('==========================================\n');

    console.log('Please change the password after first login.');
  } catch (error) {
    console.error('Error adding admin user:', error);
    process.exit(1);
  }
}

// Run the script
addAdminUser(); 