import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMemberById } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendReminderEmail } from '@/lib/email';

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
    
    // Get member ID from request body
    const { memberId } = await request.json();
    
    if (!memberId) {
      return NextResponse.json(
        { message: 'Member ID is required' },
        { status: 400 }
      );
    }
    
    // Get member details
    const member = await getMemberById(memberId);
    
    if (!member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Send reminder email
    await sendReminderEmail(member);
    
    return NextResponse.json({ 
      message: `Payment reminder sent to ${member.email}` 
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { message: 'Failed to send payment reminder' },
      { status: 500 }
    );
  }
} 