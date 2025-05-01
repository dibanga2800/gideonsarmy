import { NextResponse } from 'next/server';
import { updateUser, getUserByEmail, deleteUser } from '@/lib/googleSheets';

// Importing the users array from the parent file won't work in Next.js API routes
// So we'll recreate the array here for demo purposes
// In a real application, you would use a database
let users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    isAdmin: true,
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    isAdmin: false,
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isAdmin: false,
  }
];

// GET /api/users/[id] - Get user by ID
export async function GET(request, { params }) {
  const { id } = params;
  const user = users.find(user => user.id === id);
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(user);
}

// PUT /api/users/[id] - Update a user
export async function PUT(request, { params }) {
  try {
    const userId = params.id; // This will be the email since we're using it as ID
    const updates = await request.json();

    // Check if user exists
    const existingUser = await getUserByEmail(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user in Google Sheets
    const updatedUser = await updateUser(userId, {
      name: updates.name,
      isAdmin: updates.isAdmin,
      // Only update password if provided
      ...(updates.password ? { password: updates.password } : {})
    });

    // Return user data without password
    return NextResponse.json({
      id: updatedUser.email,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(request, { params }) {
  try {
    const userId = params.id;
    await deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
} 