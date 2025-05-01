import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Define user type
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

// The admin credentials we want to use
const ADMIN_EMAIL = 'dibanga2800@gmail.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'Admin User';

export async function GET() {
  try {
    // Hash the admin password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    // Create a data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create the users file if it doesn't exist
    const usersFile = path.join(dataDir, 'users.json');
    let users: User[] = [];
    
    if (fs.existsSync(usersFile)) {
      const usersData = fs.readFileSync(usersFile, 'utf8');
      users = JSON.parse(usersData);
    }
    
    // Check if the admin user already exists
    const adminExists = users.some(user => user.email === ADMIN_EMAIL);
    
    if (!adminExists) {
      // Add the admin user
      users.push({
        id: 'admin-' + Date.now(),
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        isAdmin: true,
        createdAt: new Date().toISOString()
      });
      
      // Save the updated users
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        credentials: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD, // Only showing for convenience
          isAdmin: true
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        credentials: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD, // Only showing for convenience
          isAdmin: true
        }
      });
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create admin user', details: error },
      { status: 500 }
    );
  }
} 