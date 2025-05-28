// src/app/api/loan-applications/[id]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import LoanTransactionModel from '@/models/LoanTransaction';
import NotificationModel from '@/models/Notification';
import mongoose from 'mongoose';
import type { SystemNotification } from '@/lib/types';

const DAILY_PENALTY_RATE = 0.005; // 0.5% per day

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API POST /loan-applications/${id}/payment] Received request to record payment.`);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.log(`[API POST /loan-applications/${id}/payment] Invalid application ID format: ${id}`);
    return NextResponse.json({ success: false, message: 'Invalid application ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    console.log(`[API POST /loan-applications/${id}/payment] Database connected.`);

    const { adminId, paymentAmount, paymentMethod, transactionReference, notes, paymentDate: clientPaymentDate } = await request.json();

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
        return NextResponse.json({ success: false, message: 'Valid Admin ID is required for recording payment.' }, { status: 400 });
    }
    if (paymentAmount === undefined || paymentAmount <= 0) {
        return NextResponse.json({ success: false, message: 'A valid payment amount is required.' }, { status: 400 });
    }
    if (!paymentMethod) {
        return NextResponse.json({ success: false, message: 'Payment method is required.' }, { status: 400 });
    }

    const application = await LoanApplicationModel.findById(id);

    if (!application) {
      console.log(`[API POST /loan-applications/${id}/payment] Loan application not found.`);
      return NextResponse.json({ success: false, message: 'Loan application not found.' }, { status: 404 });
    }

    if (application.status !== 'Active' && application.status !== 'Overdue') {
      console.log(`[API POST /loan-applications/${id}/payment] Loan is not in 'Active' or 'Overdue' status. Current status: ${application.status}`);
      return NextResponse.json({ success: false, message: `Payments can only be recorded for 'Active' or 'Overdue' loans. Current status: ${application.status}` }, { status: 400 });
    }

    let remainingPayment = paymentAmount;
    let principalApplied = 0;
    let interestApplied = 0;
    let penaltyApplied = 0;
    let isLatePayment = false;
    let daysLate = 0;

    const paymentDate = clientPaymentDate ? new Date(clientPaymentDate) : new Date();
    const nextPaymentDueDate = application.nextPaymentDueDate ? new Date(application.nextPaymentDueDate) : null;

    // 1. Calculate Penalty (if overdue)
    if (nextPaymentDueDate && paymentDate > nextPaymentDueDate) {
      const diffTime = Math.abs(paymentDate.getTime() - nextPaymentDueDate.getTime());
      daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculate days late
      
      // Calculate penalty based on the outstanding principal at the time of overdue
      // For simplicity, let's apply penalty on the nextPaymentAmount if it's due
      // or on the current outstanding principal if no specific nextPaymentAmount is set.
      const baseForPenalty = application.nextPaymentAmount || application.currentPrincipalOutstanding;
      penaltyApplied = parseFloat((baseForPenalty * DAILY_PENALTY_RATE * daysLate).toFixed(2));
      
      remainingPayment -= penaltyApplied;
      isLatePayment = true;
      console.log(`[API POST /loan-applications/${id}/payment] Late payment detected. Days late: ${daysLate}, Penalty applied: ₹${penaltyApplied}`);
    }

    // 2. Apply payment to outstanding interest first
    if (application.currentInterestOutstanding > 0 && remainingPayment > 0) {
      const payTowardsInterest = Math.min(remainingPayment, application.currentInterestOutstanding);
      interestApplied = payTowardsInterest;
      application.currentInterestOutstanding -= payTowardsInterest;
      remainingPayment -= payTowardsInterest;
      console.log(`[API POST /loan-applications/${id}/payment] Applied ₹${interestApplied} to interest. Remaining payment: ₹${remainingPayment}`);
    }

    // 3. Apply remaining payment to principal
    if (remainingPayment > 0) {
      const payTowardsPrincipal = Math.min(remainingPayment, application.currentPrincipalOutstanding);
      principalApplied = payTowardsPrincipal;
      application.currentPrincipalOutstanding -= payTowardsPrincipal;
      remainingPayment -= payTowardsPrincipal;
      console.log(`[API POST /loan-applications/${id}/payment] Applied ₹${principalApplied} to principal. Remaining payment: ₹${remainingPayment}`);
    }

    // Update total repaid amounts
    application.totalPrincipalRepaid += principalApplied;
    application.totalInterestRepaid += interestApplied;
    application.totalPenaltiesPaid += penaltyApplied;
    application.lastPaymentDate = paymentDate;

    // Update repayment schedule entry status
    if (application.repaymentSchedule && application.repaymentSchedule.length > 0) {
      const nextDuePeriod = application.repaymentSchedule.find(entry => !entry.isPaid);
      if (nextDuePeriod) {
        // Mark the current period as paid if the payment covers at least its EMI
        // This logic can be more sophisticated for partial payments
        if (paymentAmount >= nextDuePeriod.paymentAmount) {
          nextDuePeriod.isPaid = true;
          console.log(`[API POST /loan-applications/${id}/payment] Marked period ${nextDuePeriod.period} as paid.`);
        }
      }

      // Find the next unpaid period to update nextPaymentDueDate and nextPaymentAmount
      const nextUnpaidPeriod = application.repaymentSchedule.find(entry => !entry.isPaid);
      if (nextUnpaidPeriod) {
        application.nextPaymentDueDate = new Date(nextUnpaidPeriod.dueDate);
        application.nextPaymentAmount = nextUnpaidPeriod.paymentAmount;
        // If there's still outstanding interest from previous periods, add it to next payment amount
        if (application.currentInterestOutstanding > 0) {
            application.nextPaymentAmount += application.currentInterestOutstanding;
        }
      } else {
        // All payments are made
        application.nextPaymentDueDate = undefined;
        application.nextPaymentAmount = 0;
      }
    }

    // Update loan status if fully paid
    if (application.currentPrincipalOutstanding <= 0 && application.currentInterestOutstanding <= 0) {
      application.status = 'PaidOff';
      application.maturityDate = new Date(); // Loan is paid off
      console.log(`[API POST /loan-applications/${id}/payment] Loan application ${id} status updated to 'PaidOff'.`);
    } else if (nextPaymentDueDate && paymentDate > nextPaymentDueDate && application.status !== 'Overdue') {
        application.status = 'Overdue'; // Set to overdue if it wasn't already and payment is late
        console.log(`[API POST /loan-applications/${id}/payment] Loan application ${id} status updated to 'Overdue'.`);
    } else if (application.status === 'Overdue' && paymentDate <= nextPaymentDueDate!) {
        // If it was overdue but payment brought it current
        application.status = 'Active';
        console.log(`[API POST /loan-applications/${id}/payment] Loan application ${id} status updated to 'Active' from 'Overdue'.`);
    }


    await application.save();
    console.log(`[API POST /loan-applications/${id}/payment] Loan application ${id} updated after payment.`);

    // Create Loan Transaction record
    const newTransaction = new LoanTransactionModel({
      loanApplicationId: application._id,
      borrowerUserId: application.borrowerUserId,
      paymentDate: paymentDate,
      amountPaid: paymentAmount,
      paymentMethod: paymentMethod,
      transactionReference: transactionReference,
      principalApplied: principalApplied,
      interestApplied: interestApplied,
      penaltyApplied: penaltyApplied,
      notes: notes || 'Loan repayment',
      recordedByAdminId: new mongoose.Types.ObjectId(adminId),
      recordedAt: new Date(),
      isLatePayment: isLatePayment,
      daysLate: daysLate,
    });
    await newTransaction.save();
    console.log(`[API POST /loan-applications/${id}/payment] Payment transaction recorded: ${newTransaction._id}`);

    // Create notification for borrower
    let notificationMessage = `A payment of ₹${paymentAmount.toLocaleString()} has been recorded for your loan (ID: ...${application.id.slice(-6)}).`;
    let notificationType: SystemNotification['type'] = 'payment_received_confirmation';
    if (isLatePayment) {
        notificationMessage += ` A late fee of ₹${penaltyApplied.toLocaleString()} was applied.`;
        notificationType = 'payment_overdue_alert'; // Or a specific 'payment_received_late' type
    }
    if (application.status === 'PaidOff') {
        notificationMessage = `Congratulations! Your loan (ID: ...${application.id.slice(-6)}) has been fully paid off!`;
        notificationType = 'loan_status_updated';
    }

    const newNotification = new NotificationModel({
      recipientUserId: application.borrowerUserId,
      loanApplicationId: application._id,
      message: notificationMessage,
      type: notificationType,
      linkTo: `/dashboard/application/${application._id}`,
      createdAt: new Date(),
    });
    await newNotification.save();
    console.log(`[API POST /loan-applications/${id}/payment] Notification created for borrower: ${application.borrowerUserId}`);


    return NextResponse.json({ success: true, message: 'Payment recorded successfully', application: application.toObject(), transaction: newTransaction.toObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`[API POST /loan-applications/${id}/payment] Error recording payment:`, error);
    if (error.name === 'ValidationError') {
        let errors: Record<string, string> = {};
        for (let field in error.errors) {
            errors[field] = error.errors[field].message;
        }
        return NextResponse.json({ success: false, message: 'Validation Error during payment recording', errors }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error during payment recording.',
      errorType: error.name
    }, { status: 500 });
  }
}
