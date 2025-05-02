import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getMemberById } from "@/lib/sheets";
import { sendDuesStatusEmail } from "@/lib/email";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized email request: No valid session');
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!session.user.isAdmin) {
      console.log('Forbidden email request: User is not an admin', session.user.email);
      return NextResponse.json(
        { success: false, message: "Requires admin privileges" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { memberId } = body;
    console.log('Dues status email request received for member:', memberId);
    
    if (!memberId) {
      console.log('Invalid email request: Missing member ID');
      return NextResponse.json(
        { success: false, message: "Missing member ID" },
        { status: 400 }
      );
    }
    
    // Get member details
    console.log('Fetching member data for ID:', memberId);
    const member = await getMemberById(memberId);
    
    if (!member) {
      console.log('Member not found for ID:', memberId);
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }
    
    console.log('Member found:', { name: member.name, email: member.email });
    console.log('Full member data:', member);
    
    // Ensure member has all required properties and normalize data
    const normalizedMember = {
      ...member,
      name: member.name || 'Member',
      email: member.email || '',
      // Use the proper property names from the sheets data
      balance: typeof member.balance === 'number' ? member.balance : 0,
      amountPaid: typeof member.amountPaid === 'number' ? member.amountPaid : 0,
      joinDate: member.joinDate || new Date().toISOString(),
      year: member.year || new Date().getFullYear()
    };
    
    // Log the normalized member data
    console.log('Normalized member data for email:', {
      name: normalizedMember.name,
      email: normalizedMember.email,
      balance: normalizedMember.balance,
      amountPaid: normalizedMember.amountPaid
    });
    
    // Send dues status email
    console.log('Sending dues status email to:', normalizedMember.email);
    const result = await sendDuesStatusEmail(normalizedMember);
    console.log('Dues status email sent successfully:', result);
    
    return NextResponse.json({
      success: true,
      message: `Dues status email sent to ${normalizedMember.name}`
    });
    
  } catch (error) {
    let errorMessage = "Failed to send dues status email";
    
    if (error instanceof Error) {
      errorMessage = `Email error: ${error.message}`;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 