// src/lib/email-service.ts
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};

// Create reusable transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.pass) {
      console.warn('⚠️  Email credentials not configured. Emails will not be sent.');
      // Return a mock transporter for development
      return {
        sendMail: async (mailOptions: any) => {
          console.log('📧 [DEV MODE] Email would be sent:', mailOptions);
          return { messageId: 'dev-mode-' + Date.now() };
        },
      } as any;
    }

    transporter = nodemailer.createTransport({
      service: EMAIL_CONFIG.service,
      auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.pass,
      },
    });
  }
  return transporter;
}

// Email Templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Payment Reminder Email
export function createPaymentReminderEmail(
  userName: string,
  loanId: string,
  amount: number,
  dueDate: string
): EmailTemplate {
  return {
    subject: `Payment Reminder - ₹${amount.toLocaleString()} Due on ${dueDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008000;">Payment Reminder - Shree Shyam Finance</h2>
        <p>Dear ${userName},</p>
        <p>This is a friendly reminder that your loan payment is due soon.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Loan ID:</strong> ${loanId}</p>
          <p><strong>Amount Due:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <p>Please ensure timely payment to avoid late fees and maintain your credit standing.</p>
        <p>You can make payment through your dashboard or contact us for assistance.</p>
        <p>Thank you for your business!</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">
          Shree Shyam Finance<br />
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
    text: `
Payment Reminder - Shree Shyam Finance

Dear ${userName},

This is a friendly reminder that your loan payment is due soon.

Loan ID: ${loanId}
Amount Due: ₹${amount.toLocaleString()}
Due Date: ${dueDate}

Please ensure timely payment to avoid late fees and maintain your credit standing.

Thank you for your business!
Shree Shyam Finance
    `,
  };
}

// Overdue Payment Alert
export function createOverdueAlertEmail(
  userName: string,
  loanId: string,
  amount: number,
  daysOverdue: number,
  penaltyAmount: number
): EmailTemplate {
  return {
    subject: `⚠️ URGENT: Payment Overdue - ₹${amount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Payment Overdue Alert</h2>
        <p>Dear ${userName},</p>
        <p><strong>Your loan payment is overdue.</strong></p>
        <div style="background-color: #fee; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p><strong>Loan ID:</strong> ${loanId}</p>
          <p><strong>Amount Overdue:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
          <p><strong>Late Penalty:</strong> ₹${penaltyAmount.toLocaleString()}</p>
          <p style="color: #dc2626; font-weight: bold;">Total Amount Due: ₹${(amount + penaltyAmount).toLocaleString()}</p>
        </div>
        <p>Please make the payment immediately to avoid further penalties and negative impact on your credit score.</p>
        <p>If you're facing financial difficulties, please contact us to discuss payment arrangements.</p>
        <p>Contact: ${EMAIL_CONFIG.from}</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">
          Shree Shyam Finance<br />
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
    text: `
⚠️ PAYMENT OVERDUE ALERT - Shree Shyam Finance

Dear ${userName},

Your loan payment is overdue.

Loan ID: ${loanId}
Amount Overdue: ₹${amount.toLocaleString()}
Days Overdue: ${daysOverdue} days
Late Penalty: ₹${penaltyAmount.toLocaleString()}
Total Amount Due: ₹${(amount + penaltyAmount).toLocaleString()}

Please make the payment immediately to avoid further penalties.

Contact: ${EMAIL_CONFIG.from}

Shree Shyam Finance
    `,
  };
}

// Loan Approved Email
export function createLoanApprovedEmail(
  userName: string,
  loanAmount: number,
  purpose: string,
  interestRate: number,
  emi: number,
  tenure: number
): EmailTemplate {
  return {
    subject: `✅ Loan Approved - ₹${loanAmount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008000;">🎉 Congratulations! Your Loan is Approved</h2>
        <p>Dear ${userName},</p>
        <p>We are pleased to inform you that your loan application has been approved!</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Loan Amount:</strong> ₹${loanAmount.toLocaleString()}</p>
          <p><strong>Purpose:</strong> ${purpose}</p>
          <p><strong>Interest Rate:</strong> ${interestRate}% per annum</p>
          <p><strong>Monthly EMI:</strong> ₹${emi.toLocaleString()}</p>
          <p><strong>Tenure:</strong> ${tenure} months</p>
        </div>
        <p>The loan amount will be disbursed to your registered bank account within 2-3 business days.</p>
        <p>You can view full loan details and repayment schedule in your dashboard.</p>
        <p>Thank you for choosing Shree Shyam Finance!</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">
          Shree Shyam Finance<br />
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
    text: `
✅ LOAN APPROVED - Shree Shyam Finance

Dear ${userName},

Congratulations! Your loan application has been approved!

Loan Amount: ₹${loanAmount.toLocaleString()}
Purpose: ${purpose}
Interest Rate: ${interestRate}% per annum
Monthly EMI: ₹${emi.toLocaleString()}
Tenure: ${tenure} months

The loan amount will be disbursed within 2-3 business days.

Thank you for choosing Shree Shyam Finance!
    `,
  };
}

// Loan Disbursed Email
export function createLoanDisbursedEmail(
  userName: string,
  loanId: string,
  amount: number,
  firstEmiDate: string
): EmailTemplate {
  return {
    subject: `✅ Loan Disbursed - ₹${amount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008000;">✅ Loan Amount Disbursed</h2>
        <p>Dear ${userName},</p>
        <p>Your loan amount has been successfully disbursed to your registered bank account.</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Loan ID:</strong> ${loanId}</p>
          <p><strong>Amount Disbursed:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>First EMI Due Date:</strong> ${firstEmiDate}</p>
        </div>
        <p>Please note your first EMI payment date and ensure timely payments.</p>
        <p>You can view your complete repayment schedule in your dashboard.</p>
        <p>Thank you!</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">
          Shree Shyam Finance<br />
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
    text: `
✅ LOAN DISBURSED - Shree Shyam Finance

Dear ${userName},

Your loan amount has been successfully disbursed.

Loan ID: ${loanId}
Amount Disbursed: ₹${amount.toLocaleString()}
First EMI Due Date: ${firstEmiDate}

Please ensure timely payments.

Shree Shyam Finance
    `,
  };
}

// Payment Received Confirmation
export function createPaymentReceivedEmail(
  userName: string,
  loanId: string,
  amount: number,
  paymentDate: string,
  remainingBalance: number
): EmailTemplate {
  return {
    subject: `Payment Received - ₹${amount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008000;">✅ Payment Received</h2>
        <p>Dear ${userName},</p>
        <p>Thank you! We have received your loan payment.</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Loan ID:</strong> ${loanId}</p>
          <p><strong>Amount Paid:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>Payment Date:</strong> ${paymentDate}</p>
          <p><strong>Remaining Balance:</strong> ₹${remainingBalance.toLocaleString()}</p>
        </div>
        <p>Your payment has been applied to your loan account.</p>
        <p>You can view updated loan details in your dashboard.</p>
        <p>Thank you for your timely payment!</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">
          Shree Shyam Finance<br />
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
    text: `
✅ PAYMENT RECEIVED - Shree Shyam Finance

Dear ${userName},

Thank you! We have received your loan payment.

Loan ID: ${loanId}
Amount Paid: ₹${amount.toLocaleString()}
Payment Date: ${paymentDate}
Remaining Balance: ₹${remainingBalance.toLocaleString()}

Thank you for your timely payment!

Shree Shyam Finance
    `,
  };
}

// Main send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getTransporter();
    
    const info = await transporter.sendMail({
      from: `"Shree Shyam Finance" <${EMAIL_CONFIG.from}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Utility function to send payment reminder
export async function sendPaymentReminder(
  userEmail: string,
  userName: string,
  loanId: string,
  amount: number,
  dueDate: string
): Promise<{ success: boolean; error?: string }> {
  const template = createPaymentReminderEmail(userName, loanId, amount, dueDate);
  return sendEmail(userEmail, template);
}

// Utility function to send overdue alert
export async function sendOverdueAlert(
  userEmail: string,
  userName: string,
  loanId: string,
  amount: number,
  daysOverdue: number,
  penaltyAmount: number
): Promise<{ success: boolean; error?: string }> {
  const template = createOverdueAlertEmail(userName, loanId, amount, daysOverdue, penaltyAmount);
  return sendEmail(userEmail, template);
}
