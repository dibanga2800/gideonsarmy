import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMemberByEmail, deleteMember, updateMember } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
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

    // Check if member is admin - don't allow deleting admins
    if (member.isAdmin) {
      return NextResponse.json(
        { message: 'Cannot delete admin user' },
        { status: 403 }
      );
    }

    // Delete the member
    await deleteMember(memberId);

    return NextResponse.json(
      { success: true, message: 'Member deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete member' },
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

    // Get update data from request body
    const updateData = await request.json();

    // Update the member
    const updatedMember = await updateMember(memberId, updateData);

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 }
    );
  }
} 