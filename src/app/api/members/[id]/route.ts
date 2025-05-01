import { NextResponse } from 'next/server';
import { getMemberById, updateMember, deleteMember } from '@/lib/sheets';

interface Member {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  duesAmountPaid: number;
  outstandingYTD: number;
  birthday: string;
  anniversary: string;
  payments: Payment[];
  isAdmin?: boolean;
  password?: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  month: string;
  year: string;
  status: string;
}



// Helper function to ensure dates are in correct format
function formatDateIfNeeded(dateString: string | undefined): string {
  if (!dateString) return '';
  
  // Try to parse the date from various formats
  try {
    // Check if date is in dd/mm/yyyy format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // If it's already in ISO format
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      return dateString;
    }
    
    // Try to parse as date and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('Error formatting date:', e);
  }
  
  // Return original if we couldn't parse it
  return dateString;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const member = await getMemberById(id);
    
    if (!member) {
      // Member not found - return 404
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Define the member type with payments
    type MemberWithPayments = typeof member & { payments?: any[] };
    
    // Map the member data with correct field names from Google Sheets
    const memberData = {
      ...member,
      // Financial data
      duesAmountPaid: member.amountPaid || 0,  // Map amountPaid to duesAmountPaid
      outstandingYTD: member.balance || 0,     // Map balance to outstandingYTD
      
      // Date fields - ensure correct format
      joinDate: formatDateIfNeeded(member.joinDate),
      birthday: formatDateIfNeeded(member.birthday),
      anniversary: formatDateIfNeeded(member.anniversary),
      
      // Contact information
      phoneNumber: member.phone || '',
      
      // Status
      memberStatus: member.status || 'Active',
      
      // Payments from getMemberById already includes this
      payments: (member as MemberWithPayments).payments || []
    };
    
    // Don't send password in the response
    const { password, ...sanitizedMember } = memberData;
    
    return NextResponse.json(sanitizedMember);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Get the current member to check if it exists
    const existingMember = await getMemberById(id);
    
    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Update the member
    const updatedMember = await updateMember(id, data);
    
    // Don't send password in the response
    const { password, ...sanitizedMember } = updatedMember;
    
    return NextResponse.json(sanitizedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if member exists
    const existingMember = await getMemberById(id);
    
    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Check if member is admin - don't allow deleting admins
    if (existingMember.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete admin user' },
        { status: 403 }
      );
    }
    
    // Delete the member
    await deleteMember(id);
    
    return NextResponse.json(
      { success: true, message: 'Member deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
} 