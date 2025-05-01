import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Import Google Sheets functions
let getUserByEmail: (email: string) => Promise<any> | null = async () => null;
let getMemberByEmail: (email: string) => Promise<any> | null = async () => null;

// Dynamically import the Google Sheets functions to avoid build errors
try {
  const googleSheetsModule = require('@/lib/googleSheets');
  getUserByEmail = googleSheetsModule.getUserByEmail;
  getMemberByEmail = googleSheetsModule.getMemberByEmail;
} catch (error) {
  console.warn('Google Sheets module not available, using local file only');
}

// Define user type
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

// Function to get a user from local storage
const getUserFromLocalFile = async (email: string): Promise<User | null> => {
  try {
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    
    if (!fs.existsSync(usersFile)) {
      return null;
    }
    
    const usersData = fs.readFileSync(usersFile, 'utf8');
    const users: User[] = JSON.parse(usersData);
    
    return users.find(user => user.email === email) || null;
  } catch (error) {
    console.error('Error reading from local user file:', error);
    return null;
  }
};

// Hardcoded admin user for initial setup
const ADMIN_EMAIL = 'dibanga2800@gmail.com';
const ADMIN_PASSWORD = 'password123';

// Define and export the auth options
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check for hardcoded admin user first
          if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
            console.log('Hardcoded admin user authenticated');
            return {
              id: 'admin-user',
              email: ADMIN_EMAIL,
              name: 'Admin User',
              isAdmin: true,
            };
          }

          // First try to get user from Google Sheets
          let user = null;
          let member = null;
          
          try {
            // Try Google Sheets authentication first
            user = await getUserByEmail(credentials.email);
            if (user) {
              member = await getMemberByEmail(credentials.email);
              console.log('Google Sheets user found:', user.email);
            }
          } catch (error) {
            console.log('Google Sheets authentication failed, trying local file...');
          }
          
          // If Google Sheets fails or user not found, try local file
          if (!user) {
            const localUser = await getUserFromLocalFile(credentials.email);
            
            if (!localUser) {
              throw new Error('User not found');
            }
            
            // Compare password
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              localUser.password
            );
            
            if (!isPasswordValid) {
              throw new Error('Invalid password');
            }
            
            return {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              isAdmin: localUser.isAdmin,
            };
          }
          
          // Google Sheets user authentication
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          return {
            id: member?.id || 'unknown',
            email: user.email,
            name: member?.name || 'Member',
            isAdmin: user.isAdmin || false,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
}; 