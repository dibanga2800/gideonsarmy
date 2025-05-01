import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAllMembers } from '@/lib/sheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get all members
    const members = await getAllMembers();
    
    // Remove sensitive information like passwords
    const sanitizedMembers = members.map(member => {
      const { password, ...sanitizedMember } = member;
      return sanitizedMember;
    });

    return NextResponse.json(sanitizedMembers);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch members' },
      { status: 500 }
    );
  }
} 