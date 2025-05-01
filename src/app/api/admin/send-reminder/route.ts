import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMemberById } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { sendReminderEmail } from '@/lib/email';
import { ApiResponse, Member } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Unauthorized',
        status: 401
      });
    }
    
    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Access denied. Admin privileges required.',
        status: 403
      });
    }
    
    // Get member ID from request body
    const { memberId } = await request.json();
    
    if (!memberId) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Member ID is required',
        status: 400
      });
    }
    
    // Get member details
    const member = await getMemberById(memberId);
    
    if (!member) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Member not found',
        status: 404
      });
    }
    
    // Add totalDuesOwed to member object
    const memberWithDues = {
      ...member,
      totalDuesOwed: member.outstandingYTD || 0
    };
    
    // Send reminder email
    await sendReminderEmail(memberWithDues);
    
    return NextResponse.json<ApiResponse<{ email: string }>>({
      data: { email: member.email },
      message: `Payment reminder sent to ${member.email}`,
      status: 200
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json<ApiResponse<null>>({
      error: error instanceof Error ? error.message : 'Failed to send payment reminder',
      status: 500
    });
  }
} 