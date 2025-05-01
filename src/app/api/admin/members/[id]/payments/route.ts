import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { addPayment, getMemberByEmail, updateMemberDues } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Payment } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get member ID from URL params
    const memberId = params.id;
    if (!memberId) {
      return NextResponse.json(
        { message: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Get member details
    const member = await getMemberByEmail(memberId);
    if (!member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    // Get payment data from request body
    const paymentData = await request.json();

    // Validate required fields
    if (!paymentData.amount || !paymentData.method || !paymentData.date) {
      return NextResponse.json(
        { message: 'Amount, method, and date are required' },
        { status: 400 }
      );
    }

    // Add payment record
    const payment = await addPayment({
      memberId: member.email,
      amount: paymentData.amount,
      date: paymentData.date,
      method: paymentData.method,
      month: paymentData.month,
      year: paymentData.year,
      status: 'completed'
    });

    // Update member's dues
    const newDuesAmount = member.duesAmountPaid + payment.amount;
    const newOutstanding = Math.max(0, member.outstandingYTD - payment.amount);
    
    await updateMemberDues(
      member.email,
      newDuesAmount,
      newOutstanding,
      member.year
    );

    // Return updated member data with new payment
    return NextResponse.json({
      payment,
      member: {
        ...member,
        duesAmountPaid: newDuesAmount,
        outstandingYTD: newOutstanding
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to record payment' },
      { status: 500 }
    );
  }
} 