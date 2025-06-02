import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getMembers, createUser } from '@/lib/googleSheets';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get all members (pass admin credentials to ensure we get all members)
    const members = await getMembers(session.user.email, session.user.isAdmin);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse the request body
    const memberData = await request.json();
    
    console.log('Received member data:', memberData);
    
    // Validate required fields
    if (!memberData.name || !memberData.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate password if provided
    if (!memberData.password) {
      return NextResponse.json(
        { error: 'Password is required for new members' },
        { status: 400 }
      );
    }

    // Helper function to calculate outstanding dues based on join date
    const calculateOutstandingDues = (joinDate?: string): number => {
      const MONTHLY_DUES = 10; // £10 per month
      
      if (!joinDate) {
        joinDate = new Date().toISOString().split('T')[0];
      }
      
      let joinDateObj: Date;
      
      if (joinDate.includes('/')) {
        // Handle dd/mm/yyyy format
        const [day, month, year] = joinDate.split('/');
        joinDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (joinDate.includes('-')) {
        // Handle yyyy-mm-dd format
        joinDateObj = new Date(joinDate);
      } else {
        joinDateObj = new Date();
      }
      
      const joinMonth = joinDateObj.getMonth(); // 0-based
      const joinYear = joinDateObj.getFullYear();
      const currentYear = new Date().getFullYear();
      
      if (joinYear > currentYear) return 0;
      if (joinYear < currentYear) return 12 * MONTHLY_DUES;
      
      const monthsRemaining = 12 - joinMonth;
      return monthsRemaining * MONTHLY_DUES;
    };

    // Prepare user data for creation
    const userData = {
      name: memberData.name.trim(),
      email: memberData.email.trim(),
      password: memberData.password,
      isAdmin: memberData.isAdmin || false,
      birthday: memberData.birthday || '',
      anniversary: memberData.anniversary || '',
      phoneNumber: memberData.phoneNumber || '',
      joinDate: memberData.joinDate || new Date().toISOString().split('T')[0]
    };

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    // Create user (this will also create member record)
    const newUser = await createUser(userData);

    console.log('Created user and member:', newUser);

    // Calculate the outstanding amount for the response
    const joinDate = memberData.joinDate || new Date().toISOString().split('T')[0];
    const outstandingAmount = calculateOutstandingDues(joinDate);

    // Return the member data in the expected format
    const newMember = {
      id: userData.email,
      name: userData.name,
      email: userData.email,
      phoneNumber: memberData.phoneNumber || '',
      joinDate: joinDate,
      birthday: memberData.birthday || '',
      anniversary: memberData.anniversary || '',
      memberStatus: 'active',
      duesAmountPaid: 0,
      outstandingYTD: outstandingAmount, // Use calculated amount
      year: new Date().getFullYear().toString(),
      isAdmin: userData.isAdmin
    };

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to create member';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 