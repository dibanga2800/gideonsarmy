import { NextResponse } from 'next/server';
import { recordPayment, getMemberById } from '@/lib/sheets';

export async function POST(request, { params }) {
  try {
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
    
    // Get current month and year if not provided
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    
    // Record the payment
    const result = await recordPayment({
      memberId: id,
      amount: data.amount,
      date: data.date || currentDate.toISOString().split('T')[0],
      method: data.method || 'cash',
      month: data.month || monthNames[currentDate.getMonth()],
      year: data.year || currentDate.getFullYear().toString()
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
} 