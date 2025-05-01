import { NextResponse } from 'next/server';
import { getAllMembers, addMember } from '@/lib/sheets';

export async function GET() {
  try {
    const members = await getAllMembers();
    
    // Don't send passwords in the response
    const sanitizedMembers = members.map(member => {
      const { password, ...rest } = member;
      return rest;
    });
    
    return NextResponse.json(sanitizedMembers);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Add the new member
    const newMember = await addMember(data);
    
    // Don't send password in the response
    const { password, ...sanitizedMember } = newMember;
    
    return NextResponse.json(sanitizedMember, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
} 