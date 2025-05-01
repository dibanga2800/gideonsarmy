import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMembers, getMemberPayments, createMember } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Member } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }
    
    // Get all members
    const members = await getMembers();
    
    // Fetch payments for each member
    for (const member of members) {
      member.payments = await getMemberPayments(member.id);
    }
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { message: 'Failed to fetch members list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get request body
    const memberData = await request.json();

    // Validate required fields
    if (!memberData.name || !memberData.email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create new member
    const newMember = await createMember(memberData);

    return NextResponse.json(newMember);
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create member' },
      { status: 500 }
    );
  }
} 