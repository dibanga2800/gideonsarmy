import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMemberById, updateMember, deleteMember } from '@/lib/sheets';
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
    const member = await getMemberById(id);
    
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Don't send password in the response
    const { password, ...sanitizedMember } = member;
    
    return NextResponse.json(sanitizedMember);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const updates = await request.json();
    
    // Map the field names to match the backend expectations
    const mappedUpdates = {
      ...updates,
      amountPaid: updates.duesAmountPaid,
      balance: updates.outstandingYTD,
      status: updates.memberStatus,
      phone: updates.phoneNumber
    };
    
    // Update the member
    const updatedMember = await updateMember(id, mappedUpdates);
    
    // Map the response back to frontend field names
    const mappedResponse = {
      ...updatedMember,
      duesAmountPaid: updatedMember.amountPaid,
      outstandingYTD: updatedMember.balance,
      memberStatus: updatedMember.status,
      phoneNumber: updatedMember.phone
    };
    
    // Don't send password in the response
    const { password, ...sanitizedMember } = mappedResponse;
    
    return NextResponse.json(sanitizedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // Delete the member
    await deleteMember(id);
    
    return NextResponse.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete member' },
      { status: 500 }
    );
  }
} 