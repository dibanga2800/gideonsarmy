import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMemberById, recordPayment } from '@/lib/sheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.amount || isNaN(parseFloat(data.amount))) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }
    
    // Check if member exists
    const member = await getMemberById(id);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Record the payment
    const result = await recordPayment({
      memberId: id,
      amount: parseFloat(data.amount),
      date: data.date || new Date().toISOString().split('T')[0],
      method: data.method || 'cash',
      month: data.month,
      year: data.year
    });
    
    // Map the response fields to match frontend expectations
    const mappedMember = {
      ...result.member,
      duesAmountPaid: result.member.amountPaid,
      outstandingYTD: result.member.balance,
      memberStatus: result.member.status,
      phoneNumber: result.member.phone
    };
    
    // Don't send password in the response
    const { password, ...sanitizedMember } = mappedMember;
    
    return NextResponse.json({
      success: true,
      payment: result.payment,
      member: sanitizedMember
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record payment' },
      { status: 500 }
    );
  }
} 