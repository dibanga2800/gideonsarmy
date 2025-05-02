import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // In development mode, skip authentication
    let isAdmin = process.env.NODE_ENV === 'development' ? true : false;
    
    // If not in development, verify authentication
    if (process.env.NODE_ENV !== 'development') {
      // Verify the user is authenticated and is an admin
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      
      isAdmin = !!session.user.isAdmin;
      
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: "Requires admin privileges" },
          { status: 403 }
        );
      }
    }
    
    // Get test email parameters
    const body = await request.json();
    const { to } = body;
    
    console.log('Test email request:', { to, env: process.env.NODE_ENV });
    
    if (!to) {
      return NextResponse.json(
        { success: false, message: "Please provide a recipient email address" },
        { status: 400 }
      );
    }
    
    // Send a test email
    console.log(`Sending test email to ${to}`);
    const result = await sendEmail({
      to,
      subject: "Test Email from Gideon's Army Application",
      text: `This is a test email sent at ${new Date().toISOString()}.
      
If you're seeing this, it means your email configuration is working correctly!

Best regards,
Gideon's Army Team`,
      html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Test Email</h2>
  <p>This is a test email sent at ${new Date().toISOString()}.</p>
  <p>If you're seeing this, it means your email configuration is working correctly!</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #444;">Your email setup details:</h3>
    <ul style="list-style-type: none; padding-left: 0;">
      <li><strong>Provider:</strong> ${process.env.MAIL_PROVIDER || 'Simulation Mode'}</li>
      <li><strong>Environment:</strong> ${process.env.NODE_ENV}</li>
      <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
    </ul>
  </div>
  
  <p>Best regards,<br>Gideon's Army Team</p>
</div>
      `
    });
    
    // Check if result is in simulation mode
    const isSimulated = result && 
      typeof result === 'object' && 
      'status' in result && 
      result.status === 'simulated';
    
    return NextResponse.json({
      success: true,
      message: `Test email ${isSimulated ? 'simulated' : 'sent'} successfully`,
      details: result,
      environment: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error('Error sending test email:', error);
    let errorMessage = "Failed to send test email";
    
    if (error instanceof Error) {
      errorMessage = `Email error: ${error.message}`;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        environment: process.env.NODE_ENV,
        isSimulation: process.env.NODE_ENV === 'development'
      },
      { status: 500 }
    );
  }
} 