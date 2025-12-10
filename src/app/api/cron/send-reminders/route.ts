// src/app/api/cron/send-reminders/route.ts
// Cron endpoint for automated payment reminders
// Call this endpoint daily via external cron service (e.g., Vercel Cron, cron-job.org)

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import { sendPaymentReminder, sendPaymentOverdueAlert } from '@/lib/email-service';
import { PAYMENT_CONFIG } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// Verify cron secret (set CRON_SECRET in env)
function verifyCronSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.warn('[Cron] CRON_SECRET not set, allowing request');
        return true; // Allow if not configured (dev mode)
    }

    return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
    // Verify authorization
    if (!verifyCronSecret(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = {
            reminders7Days: 0,
            reminders3Days: 0,
            reminders1Day: 0,
            remindersSameDay: 0,
            overdueAlerts: 0,
            errors: [] as string[],
        };

        // Find active loans with upcoming or overdue payments
        const activeLoans = await LoanApplicationModel.find({
            status: { $in: ['Active', 'Disbursed', 'Overdue'] },
            nextPaymentDueDate: { $exists: true, $ne: null },
        }).populate('borrowerUserId', 'email name');

        for (const loan of activeLoans) {
            try {
                if (!loan.nextPaymentDueDate || !loan.borrowerUserId) continue;

                const dueDate = new Date(loan.nextPaymentDueDate);
                dueDate.setHours(0, 0, 0, 0);

                const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                // Check if we already sent a reminder today
                const lastReminder = loan.lastReminderSentDate ? new Date(loan.lastReminderSentDate) : null;
                if (lastReminder) {
                    lastReminder.setHours(0, 0, 0, 0);
                    if (lastReminder.getTime() === today.getTime()) {
                        continue; // Already sent reminder today
                    }
                }

                const borrower = loan.borrowerUserId as any;
                const borrowerEmail = borrower?.email || loan.borrowerEmail;
                const borrowerName = borrower?.name || loan.borrowerFullName;

                if (!borrowerEmail) continue;

                const paymentAmount = loan.nextPaymentAmount || 0;

                // Send appropriate reminder based on days until due
                if (daysDiff === 7) {
                    await sendPaymentReminder(borrowerEmail, borrowerName, paymentAmount, dueDate.toISOString(), 7);
                    results.reminders7Days++;
                } else if (daysDiff === 3) {
                    await sendPaymentReminder(borrowerEmail, borrowerName, paymentAmount, dueDate.toISOString(), 3);
                    results.reminders3Days++;
                } else if (daysDiff === 1) {
                    await sendPaymentReminder(borrowerEmail, borrowerName, paymentAmount, dueDate.toISOString(), 1);
                    results.reminders1Day++;
                } else if (daysDiff === 0) {
                    await sendPaymentReminder(borrowerEmail, borrowerName, paymentAmount, dueDate.toISOString(), 0);
                    results.remindersSameDay++;
                } else if (daysDiff < 0) {
                    // Overdue
                    const daysLate = Math.abs(daysDiff);
                    await sendPaymentOverdueAlert(borrowerEmail, borrowerName, paymentAmount, daysLate);
                    results.overdueAlerts++;

                    // Update loan status to Overdue if past grace period
                    if (daysLate > PAYMENT_CONFIG.OVERDUE_GRACE_PERIOD_DAYS && loan.status !== 'Overdue') {
                        loan.status = 'Overdue';
                    }
                }

                // Update last reminder date
                loan.lastReminderSentDate = new Date();
                await loan.save();

            } catch (loanError: any) {
                results.errors.push(`Loan ${loan._id}: ${loanError.message}`);
            }
        }

        const totalSent = results.reminders7Days + results.reminders3Days +
            results.reminders1Day + results.remindersSameDay +
            results.overdueAlerts;

        console.log(`[Cron] Payment reminders sent: ${totalSent}`);

        return NextResponse.json({
            success: true,
            message: `Processed ${activeLoans.length} loans, sent ${totalSent} reminders`,
            results,
        });

    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
