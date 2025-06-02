import { sendEmail } from './email.js';
// Send birthday greeting email
export async function sendBirthdayEmail(member) {
    const subject = 'Happy Birthday from the Gideon\'s Army!';
    const text = `
Dear ${member.name},

Wishing you a very happy birthday from all of us at the Gideon's Army!

May your day be filled with joy, peace, and blessings.

Best regards,
Gideon's Army Team
  `;
    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Happy Birthday!</h2>
  <p>Dear ${member.name},</p>
  <p>Wishing you a very <strong>happy birthday</strong> from all of us at the Gideon's Army!</p>
  <p>May your day be filled with joy, peace, and blessings.</p>
  
  <div style="text-align: center; margin: 25px 0;">
    <img src="https://source.unsplash.com/400x200/?birthday,celebration" alt="Birthday Celebration" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
  
  <p>Best regards,<br>Gideon's Army Team</p>
</div>
  `;
    return await sendEmail({
        to: member.email,
        subject,
        text,
        html,
    });
}
// Send anniversary greeting email
export async function sendAnniversaryEmail(member) {
    const subject = 'Happy Anniversary from the Gideon\'s Army!';
    const text = `
Dear ${member.name},

Congratulations on your wedding anniversary from all of us at the Men's Fellowship!

May your marriage continue to be blessed with love, joy, and companionship.

Best regards,
Men's Fellowship Team
  `;
    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Happy Anniversary!</h2>
  <p>Dear ${member.name},</p>
  <p>Congratulations on your <strong>wedding anniversary</strong> from all of us at the Gideon's Army!</p>
  <p>May your marriage continue to be blessed with love, joy, and companionship.</p>
  
  <div style="text-align: center; margin: 25px 0;">
    <img src="https://source.unsplash.com/400x200/?wedding,anniversary" alt="Wedding Anniversary" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
  
  <p>Best regards,<br>Gideon's Army Team</p>
</div>
  `;
    return await sendEmail({
        to: member.email,
        subject,
        text,
        html,
    });
}
// Send payment reminder email
export async function sendReminderEmail(member) {
    const subject = 'Payment Reminder - Men\'s Fellowship Dues';
    const text = `
Dear ${member.name},

This is a friendly reminder that you currently have an outstanding balance of $${member.totalDuesOwed.toFixed(2)} for your Men's Fellowship dues.

Please arrange to make your payment at your earliest convenience.

Your membership details:
- Membership since: ${member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'Not available'}
- Total outstanding: $${member.totalDuesOwed.toFixed(2)}

Thank you for your attention to this matter.

Best regards,
Men's Fellowship Admin Team
  `;
    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Payment Reminder</h2>
  <p>Dear ${member.name},</p>
  <p>This is a friendly reminder that you currently have an outstanding balance of <strong>$${member.totalDuesOwed.toFixed(2)}</strong> for your Men's Fellowship dues.</p>
  <p>Please arrange to make your payment at your earliest convenience.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #444;">Your membership details:</h3>
    <ul style="list-style-type: none; padding-left: 0;">
      <li><strong>Membership since:</strong> ${member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'Not available'}</li>
      <li><strong>Total outstanding:</strong> $${member.totalDuesOwed.toFixed(2)}</li>
    </ul>
  </div>
  
  <p>Thank you for your attention to this matter.</p>
  <p>Best regards,<br>Men's Fellowship Admin Team</p>
</div>
  `;
    return await sendEmail({
        to: member.email,
        subject,
        text,
        html,
    });
}
// Send dues status email
export async function sendDuesStatusEmail(member) {
    const currentYear = new Date().getFullYear();
    const subject = `Dues Payment Status for ${currentYear}`;
    // Make sure balance and amountPaid are numbers with defaults
    const outstandingAmount = typeof member.balance === 'number' ? member.balance : 0;
    const paidAmount = typeof member.amountPaid === 'number' ? member.amountPaid : 0;
    const text = `
Dear ${member.name},

Here is your current dues payment status with Gideon's Army for the year ${currentYear}:

Balance (${currentYear}): £${outstandingAmount.toFixed(2)}
Amount Paid (${currentYear}): £${paidAmount.toFixed(2)}

If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
Gideon's Army
  `;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dues Payment Status</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      margin: 0; 
      padding: 0; 
      color: #333; 
      background-color: #f0f0f0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
      background-color: #1e40af; 
      color: white; 
      padding: 20px; 
      text-align: center; 
    }
    .header h1 {
      color:rgb(65, 5, 175);
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content { 
      padding: 30px; 
      background-color: #ffffff;
    }
    h2 {
      color: #1e40af;
      margin-top: 0;
    }
    .status-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .amount {
      font-size: 24px;
      font-weight: 600;
      color: #1e40af;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Dues Payment Status</h1>
      <p>${currentYear}</p>
    </div>
    <div class="content">
      <h2>Dear ${member.name},</h2>
      <p>Here is your current dues payment status with Gideon's Army:</p>
      
      <div class="status-box">
        <p><strong>Balance (${currentYear}):</strong> <br><span class="amount">£${outstandingAmount.toFixed(2)}</span></p>
        <p><strong>Amount Paid (${currentYear}):</strong> <br><span class="amount">£${paidAmount.toFixed(2)}</span></p>
      </div>
      
      <p>If you have any questions or concerns, please don't hesitate to reach out.</p>
      
      <p>Best regards,<br>Gideon's Army</p>
    </div>
    <div class="footer">
      This is an automated email from Gideon's Army Membership System.
    </div>
  </div>
</body>
</html>
  `;
    return await sendEmail({
        to: member.email,
        subject,
        text,
        html,
    });
}
