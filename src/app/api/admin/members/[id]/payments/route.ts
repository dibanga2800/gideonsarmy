import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMemberById, getMemberPayments, addPayment } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function GET(
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
    
    // Check if member exists
    const member = await getMemberById(id);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get member's payments
    const payments = await getMemberPayments(id);
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching member payments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch member payments' },
      { status: 500 }
    );
  }
}

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
    
    // Check if member exists
    const member = await getMemberById(id);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get payment data from request body
    const paymentData = await request.json();
    
    // Validate required fields
    if (!paymentData.amount || !paymentData.date) {
      return NextResponse.json(
        { error: 'Amount and date are required' },
        { status: 400 }
      );
    }

    // Add the payment
    const payment = await addPayment({
      ...paymentData,
      memberId: id
    });
    
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error adding payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add payment' },
      { status: 500 }
    );
  }
} 