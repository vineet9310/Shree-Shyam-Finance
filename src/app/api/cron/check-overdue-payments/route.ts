// src/app/api/cron/check-overdue-payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User';
import NotificationModel from '@/models/Notification';
import { LoanApplicationStatusEnum, NotificationTypeEnum } from '@/lib/types';
import { sendOverdueAlert } from '@/lib/email-service';
import { FEES, PAYMENT_CONFIG } from '@/lib/constants';

/**
 * Overdue Payment Checker Cron Job
 * 
 * This endpoint should be called daily to:
 * 1. Find loans with payments past due date
 * 2. Mark them as overdue
 * 3. Calculate and apply late penalties
 * 4. Send overdue alert emails
 * 5. Check for auto-default after grace period
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

    const now = new Date();
    const gracePeriodDate = new Date(now);
    gracePeriodDate.setDate(gracePeriodDate.getDate() - PAYMENT_CONFIG.OVERDUE_GRACE_PERIOD_DAYS);

    const defaultThresholdDate = new Date(now);
    defaultThresholdDate.setDate(defaultThresholdDate.getDate() - PAYMENT_CONFIG.AUTO_DEFAULT_AFTER_DAYS);

    console.log(`[Cron] Checking overdue payments as of: ${now.toISOString()}`);

    // Find all active loans with past due payments
    const overdueLoans = await LoanApplicationModel.find({
      status: LoanApplicationStatusEnum.ACTIVE,
      nextPaymentDueDate: { $lt: now },
    }).limit(200);

    console.log(`[Cron] Found ${overdueLoans.length} active loans with past due payments`);

    const results = {
      total: overdueLoans.length,
      markedOverdue: 0,
      markedDefault: 0,
      emailsSent: 0,
      emailsFailed: 0,
      errors: [] as string[],
    };

    for (const loan of overdueLoans) {
      try {
        const dueDate = loan.nextPaymentDueDate!;
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const overdueAmount = loan.nextPaymentAmount || 0;

        // Calculate late penalty
        const penaltyAmount = overdueAmount * FEES.LATE_PAYMENT_PENALTY_RATE * daysOverdue;

        // Check if loan should be marked as defaulted
        if (daysOverdue >= PAYMENT_CONFIG.AUTO_DEFAULT_AFTER_DAYS) {
          loan.status = LoanApplicationStatusEnum.DEFAULTED;
          results.markedDefault++;
          console.log(`⚠️  [Cron] Marked loan ${loan.id} as DEFAULTED (${daysOverdue} days overdue)`);

          // Create critical notification
          await NotificationModel.create({
            recipientUserId: loan.borrowerUserId,
            loanApplicationId: loan._id,
            type: NotificationTypeEnum.LOAN_DEFAULT_ALERT,
            message: `URGENT: Your loan has been marked as DEFAULTED due to ${daysOverdue} days of non-payment. Total amount due: ₹${(overdueAmount + penaltyAmount).toLocaleString()}`,
            isRead: false,
          });

        } else if (loan.status !== LoanApplicationStatusEnum.OVERDUE) {
          // Mark as overdue if not already
          loan.status = LoanApplicationStatusEnum.OVERDUE;
          results.markedOverdue++;
          console.log(`⚠️  [Cron] Marked loan ${loan.id} as OVERDUE (${daysOverdue} days overdue)`);
        }

        await loan.save();

        // Send overdue email (only if within grace period or first time)
        if (daysOverdue <= PAYMENT_CONFIG.OVERDUE_GRACE_PERIOD_DAYS * 3) {
          const borrower = await UserModel.findById(loan.borrowerUserId);
          
          if (borrower && borrower.email) {
            const emailResult = await sendOverdueAlert(
              borrower.email,
              borrower.name || 'Valued Customer',
              loan.id.slice(-8),
              overdueAmount,
              daysOverdue,
              penaltyAmount
            );

            if (emailResult.success) {
              results.emailsSent++;
              
              // Create in-app notification
              await NotificationModel.create({
                recipientUserId: loan.borrowerUserId,
                loanApplicationId: loan._id,
                type: NotificationTypeEnum.PAYMENT_OVERDUE_ALERT,
                message: `Payment overdue: ₹${overdueAmount.toLocaleString()} is ${daysOverdue} days late. Late penalty: ₹${penaltyAmount.toLocaleString()}. Please pay immediately.`,
                isRead: false,
              });

              console.log(`✅ [Cron] Sent overdue alert for loan ${loan.id}`);
            } else {
              results.emailsFailed++;
              results.errors.push(`Loan ${loan.id}: ${emailResult.error}`);
            }
          }
        }

        // Add small delay
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        results.errors.push(`Loan ${loan.id}: ${error.message}`);
        console.error(`❌ [Cron] Error processing overdue loan ${loan.id}:`, error);
      }
    }

    // Also check for loans already overdue that need continued reminders
    const continuedOverdueLoans = await LoanApplicationModel.find({
      status: LoanApplicationStatusEnum.OVERDUE,
      nextPaymentDueDate: { $lt: now },
      $or: [
        { lastReminderSentDate: { $exists: false } },
        { 
          lastReminderSentDate: { 
            $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last reminder > 7 days ago
          } 
        },
      ],
    }).limit(100);

    console.log(`[Cron] Found ${continuedOverdueLoans.length} overdue loans needing follow-up reminders`);

    for (const loan of continuedOverdueLoans) {
      try {
        const dueDate = loan.nextPaymentDueDate!;
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const overdueAmount = loan.nextPaymentAmount || 0;
        const penaltyAmount = overdueAmount * FEES.LATE_PAYMENT_PENALTY_RATE * daysOverdue;

        const borrower = await UserModel.findById(loan.borrowerUserId);
        
        if (borrower && borrower.email) {
          const emailResult = await sendOverdueAlert(
            borrower.email,
            borrower.name || 'Valued Customer',
            loan.id.slice(-8),
            overdueAmount,
            daysOverdue,
            penaltyAmount
          );

          if (emailResult.success) {
            loan.lastReminderSentDate = new Date();
            await loan.save();
            results.emailsSent++;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ [Cron] Error sending follow-up for loan ${loan.id}:`, error);
      }
    }

    console.log(`[Cron] Overdue check complete: ${results.markedOverdue} marked overdue, ${results.markedDefault} defaulted, ${results.emailsSent} emails sent`);

    return NextResponse.json({
      success: true,
      message: 'Overdue payment check completed',
      results,
    });

  } catch (error: any) {
    console.error('❌ [Cron] Error in check-overdue-payments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error checking overdue payments',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
