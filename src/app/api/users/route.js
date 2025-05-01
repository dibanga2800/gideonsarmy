import { NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/googleSheets';

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await getUsers();
    // Map users to only include necessary fields (exclude password)
    const mappedUsers = users.map(user => ({
      id: user.email,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    }));
    return NextResponse.json(mappedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request) {
  try {
    const userData = await request.json();
    
    // Create user in Google Sheets
    const newUser = await createUser({
      email: userData.email,
      password: userData.password,
      name: userData.name || '',
      isAdmin: userData.isAdmin || false
    });
    
    // Return user data without password
    return NextResponse.json({
      id: newUser.email,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    // If user already exists, return 409 Conflict
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 