import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getMemberById } from "@/lib/sheets";
import { sendBirthdayEmail, sendAnniversaryEmail } from "@/lib/email";
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
    const { memberId, emailType } = body;
    console.log('Email request received:', { memberId, emailType });
    
    if (!memberId || !emailType) {
      console.log('Invalid email request: Missing required fields');
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    if (!['birthday', 'anniversary'].includes(emailType)) {
      console.log('Invalid email request: Invalid email type', emailType);
      return NextResponse.json(
        { success: false, message: "Invalid email type" },
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
    
    // Send appropriate email
    if (emailType === 'birthday') {
      console.log('Sending birthday email to:', member.email);
      const result = await sendBirthdayEmail(member);
      console.log('Birthday email sent successfully:', result);
      return NextResponse.json({
        success: true,
        message: `Birthday greetings sent to ${member.name}`
      });
    } else if (emailType === 'anniversary') {
      console.log('Sending anniversary email to:', member.email);
      const result = await sendAnniversaryEmail(member);
      console.log('Anniversary email sent successfully:', result);
      return NextResponse.json({
        success: true,
        message: `Anniversary greetings sent to ${member.name}`
      });
    }
    
  } catch (error) {
    console.error('Error sending greetings email:', error);
    let errorMessage = "Failed to send email";
    
    if (error instanceof Error) {
      errorMessage = `Email error: ${error.message}`;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 