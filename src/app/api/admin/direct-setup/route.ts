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

// Function to create the data directory and users file if they don't exist
const setupLocalUserFile = () => {
  try {
    // Create a data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create the users file if it doesn't exist
    const usersFile = path.join(dataDir, 'users.json');
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, '[]', 'utf8');
    }
    
    return usersFile;
  } catch (error) {
    console.error('Error setting up local user file:', error);
    throw error;
  }
};

// Function to add a local admin user
const addLocalAdminUser = async () => {
  try {
    const usersFile = setupLocalUserFile();
    
    // Read existing users
    const usersData = fs.readFileSync(usersFile, 'utf8');
    const users: User[] = JSON.parse(usersData);
    
    // Check if admin already exists
    const existingUser = users.find(user => user.email === ADMIN_EMAIL);
    
    if (!existingUser) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      // Create the admin user
      const newUser: User = {
        id: 'admin-' + Date.now(),
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        isAdmin: true,
        createdAt: new Date().toISOString()
      };
      
      // Add to users array
      users.push(newUser);
      
      // Save the updated users
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
      
      return {
        success: true,
        message: 'Admin user created successfully in local file',
        credentials: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        },
        user: { ...newUser, password: '[HIDDEN]' },
        userFilePath: usersFile
      };
    }
    
    return {
      success: true,
      message: 'Admin user already exists in local file',
      credentials: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      },
      user: { ...existingUser, password: '[HIDDEN]' },
      userFilePath: usersFile
    };
  } catch (error) {
    console.error('Error adding local admin user:', error);
    throw error;
  }
};

// Function to read user file for verification
const readUserFile = () => {
  try {
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    
    if (!fs.existsSync(usersFile)) {
      return { exists: false, path: usersFile };
    }
    
    const content = fs.readFileSync(usersFile, 'utf8');
    return { 
      exists: true, 
      path: usersFile,
      content: content,
      users: JSON.parse(content)
    };
  } catch (error) {
    console.error('Error reading user file:', error);
    return { exists: false, error };
  }
};

export async function GET() {
  try {
    // Add a local admin user
    const result = await addLocalAdminUser();
    const fileInfo = readUserFile();
    
    return NextResponse.json({
      ...result,
      fileCheck: fileInfo
    });
  } catch (error) {
    console.error('Error in direct setup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set up admin user', 
        details: error,
        fileCheck: readUserFile()
      },
      { status: 500 }
    );
  }
} 