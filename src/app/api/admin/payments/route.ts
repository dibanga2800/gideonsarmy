import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { addPayment, getMemberById, updateMemberDues } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { PaymentMethod, PaymentStatus, ApiResponse, Payment } from '@/types';

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
    
    if (!session.user.isAdmin) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Access denied. Admin privileges required.',
        status: 403
      });
    }
    
    // Get payment data from request body
    const data = await request.json();
    
    const { memberId, amount, date, method = 'cash', month, year } = data;
    
    // Validate required fields
    if (!memberId || !amount || !date || !month || !year) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Missing required payment information',
        status: 400
      });
    }

    // Get current member data
    const member = await getMemberById(memberId);
    if (!member) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Member not found',
        status: 404
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Invalid payment amount',
        status: 400
      });
    }
    
    // Calculate new dues amount and outstanding YTD
    const currentDuesAmount = member.duesAmountPaid || 0;
    const newDuesAmount = currentDuesAmount + parsedAmount;
    const outstandingYTD = Math.max(0, 120 - newDuesAmount); // Ensure it doesn't go negative

    // Create payment record
    const payment = await addPayment({
      memberId,
      amount: parsedAmount,
      date,
      method: method as PaymentMethod,
      month,
      year,
      status: 'completed' as const
    });

    // Update member's dues, outstanding YTD, and year
    await updateMemberDues(memberId, newDuesAmount, outstandingYTD, year);
    
    return NextResponse.json<ApiResponse<Payment>>({
      data: {
        ...payment,
        amount: parsedAmount,
        status: 'completed'
      },
      message: 'Payment recorded successfully',
      status: 201
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json<ApiResponse<null>>({
      error: error instanceof Error ? error.message : 'Failed to record payment',
      status: 500
    });
  }
} 