// src/app/api/cron/send-payment-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User';
import NotificationModel from '@/models/Notification';
import { LoanApplicationStatusEnum, NotificationTypeEnum } from '@/lib/types';
import { sendPaymentReminder } from '@/lib/email-service';
import { PAYMENT_CONFIG } from '@/lib/constants';

/**
 * Payment Reminder Cron Job
 * 
 * This endpoint should be called daily (e.g., via cron job or scheduled task)
 * It finds all active loans with upcoming payment due dates and sends reminder emails
 * 
 * Security: Add API key authentication in production
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.CRON_API_KEY;
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Calculate the reminder date (e.g., 3 days before due date)
    const reminderDays = PAYMENT_CONFIG.REMINDER_DAYS_BEFORE_DUE;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + reminderDays);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log(`[Cron] Checking payment reminders for date range: ${targetDate.toISOString()} to ${nextDay.toISOString()}`);

    // Find all active loans with payment due in the reminder window
    const loansNeedingReminders = await LoanApplicationModel.find({
      status: LoanApplicationStatusEnum.ACTIVE,
      nextPaymentDueDate: {
        $gte: targetDate,
        $lt: nextDay,
      },
      $or: [
        { lastReminderSentDate: { $exists: false } },
        { lastReminderSentDate: { $lt: targetDate } },
      ],
    }).limit(100); // Process in batches

    console.log(`[Cron] Found ${loansNeedingReminders.length} loans needing payment reminders`);

    const results = {
      total: loansNeedingReminders.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const loan of loansNeedingReminders) {
      try {
        // Get borrower details
        const borrower = await UserModel.findById(loan.borrowerUserId);
        
        if (!borrower || !borrower.email) {
          console.warn(`[Cron] Borrower not found or no email for loan ${loan.id}`);
          results.failed++;
          results.errors.push(`Loan ${loan.id}: Borrower email not found`);
          continue;
        }

        // Send reminder email
        const dueDate = loan.nextPaymentDueDate?.toLocaleDateString('en-IN') || 'N/A';
        const emailResult = await sendPaymentReminder(
          borrower.email,
          borrower.name || 'Valued Customer',
          loan.id.slice(-8),
          loan.nextPaymentAmount || 0,
          dueDate
        );

        if (emailResult.success) {
          // Create in-app notification
          await NotificationModel.create({
            recipientUserId: loan.borrowerUserId,
            loanApplicationId: loan._id,
            type: NotificationTypeEnum.PAYMENT_DUE_REMINDER,
            message: `Payment reminder: ₹${(loan.nextPaymentAmount || 0).toLocaleString()} is due on ${dueDate}`,
            isRead: false,
          });

          // Update last reminder sent date
          loan.lastReminderSentDate = new Date();
          await loan.save();

          results.sent++;
          console.log(`✅ [Cron] Sent reminder for loan ${loan.id} to ${borrower.email}`);
        } else {
          results.failed++;
          results.errors.push(`Loan ${loan.id}: ${emailResult.error}`);
          console.error(`❌ [Cron] Failed to send reminder for loan ${loan.id}:`, emailResult.error);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        results.failed++;
        results.errors.push(`Loan ${loan.id}: ${error.message}`);
        console.error(`❌ [Cron] Error processing loan ${loan.id}:`, error);
      }
    }

    console.log(`[Cron] Payment reminders complete: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Payment reminders sent`,
      results,
    });

  } catch (error: any) {
    console.error('❌ [Cron] Error in send-payment-reminders:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error sending payment reminders',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (remove in production or add auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
