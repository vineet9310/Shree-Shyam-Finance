// src/app/api/transactions/[transactionId]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanTransactionModel from '@/models/LoanTransaction';
import LoanApplicationModel from '@/models/LoanApplication';
import NotificationModel from '@/models/Notification';
import mongoose from 'mongoose';
import { LoanTransactionVerificationStatusEnum, NotificationTypeEnum, LoanTransactionTypeEnum } from '@/lib/types';

// Simplified penalty calculation for demonstration
const DAILY_PENALTY_RATE = 0.005; // 0.5% per day

async function applyPaymentToLoan(application: any, transaction: any, session: mongoose.ClientSession) {
  let remainingPayment = transaction.amountPaid;
  let principalApplied = 0;
  let interestApplied = 0;
  let penaltyApplied = 0;

  // 1. Calculate & Apply Penalty (if applicable)
  // This logic should be robust in a real system. Here's a simplified version.
  if (application.status === 'Overdue' && application.nextPaymentDueDate) {
    const daysLate = Math.ceil((new Date(transaction.paymentDate).getTime() - new Date(application.nextPaymentDueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysLate > 0) {
        const baseForPenalty = application.nextPaymentAmount || application.currentPrincipalOutstanding;
        const calculatedPenalty = parseFloat((baseForPenalty * DAILY_PENALTY_RATE * daysLate).toFixed(2));
        penaltyApplied = Math.min(remainingPayment, calculatedPenalty);
        remainingPayment -= penaltyApplied;
    }
  }

  // 2. Apply to Outstanding Interest
  if (application.currentInterestOutstanding > 0 && remainingPayment > 0) {
    interestApplied = Math.min(remainingPayment, application.currentInterestOutstanding);
    application.currentInterestOutstanding -= interestApplied;
    remainingPayment -= interestApplied;
  }

  // 3. Apply to Outstanding Principal
  if (remainingPayment > 0) {
    principalApplied = Math.min(remainingPayment, application.currentPrincipalOutstanding);
    application.currentPrincipalOutstanding -= principalApplied;
    remainingPayment -= principalApplied;
  }

  // Update totals
  application.totalPrincipalRepaid += principalApplied;
  application.totalInterestRepaid += interestApplied;
  application.totalPenaltiesPaid += penaltyApplied;
  application.lastPaymentDate = transaction.paymentDate;

  // Update loan status
  if (application.currentPrincipalOutstanding <= 0 && application.currentInterestOutstanding <= 0) {
    application.status = 'PaidOff';
    application.maturityDate = new Date();
  } else {
    // Logic to update next due date from schedule would go here
    application.status = 'Active'; // Simplified: assume payment makes it active
  }
  
  // Update transaction with applied amounts
  transaction.principalApplied = principalApplied;
  transaction.interestApplied = interestApplied;
  transaction.penaltyApplied = penaltyApplied;

  await application.save({ session });
}


export async function POST(request: NextRequest, { params }: { params: { transactionId: string } }) {
  const { transactionId } = params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await request.json();
    const { adminId, approved, rejectionReason } = body;

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
        throw new Error('Valid Admin ID is required.');
    }
    if (typeof approved !== 'boolean') {
        throw new Error('Approval status is required.');
    }
    if (!approved && !rejectionReason) {
        throw new Error('Rejection reason is required when rejecting a payment.');
    }

    await dbConnect();

    const transaction = await LoanTransactionModel.findById(transactionId).session(session);
    if (!transaction || transaction.verificationStatus !== LoanTransactionVerificationStatusEnum.PENDING_VERIFICATION) {
      throw new Error('Transaction not found or already processed.');
    }
    
    const application = await LoanApplicationModel.findById(transaction.loanApplicationId).session(session);
    if (!application) {
      throw new Error('Associated loan application not found.');
    }

    let userNotificationType: NotificationTypeEnum;
    let userNotificationMessage: string;

    if (approved) {
      transaction.verificationStatus = LoanTransactionVerificationStatusEnum.ADMIN_VERIFIED_PAID;
      transaction.adminVerifierId = new mongoose.Types.ObjectId(adminId);
      transaction.adminVerificationTimestamp = new Date();

      // Apply the payment logic
      await applyPaymentToLoan(application, transaction, session);
      
      userNotificationType = NotificationTypeEnum.PAYMENT_CONFIRMED_BY_ADMIN;
      userNotificationMessage = `Your payment of ₹${transaction.amountPaid.toLocaleString()} for loan ...${application.id.slice(-6)} has been confirmed.`;
    
    } else { // Rejected
      transaction.verificationStatus = LoanTransactionVerificationStatusEnum.ADMIN_REJECTED_PROOF;
      transaction.adminVerifierId = new mongoose.Types.ObjectId(adminId);
      transaction.adminVerificationTimestamp = new Date();
      transaction.adminVerificationNotes = rejectionReason;
      
      userNotificationType = NotificationTypeEnum.PAYMENT_VERIFICATION_FAILED;
      userNotificationMessage = `Your payment proof for loan ...${application.id.slice(-6)} was rejected. Reason: ${rejectionReason}`;
    }
    
    await transaction.save({ session });

    // Create notification for user
    const userNotification = new NotificationModel({
        recipientUserId: application.borrowerUserId,
        loanApplicationId: application._id,
        paymentRecordId: transaction._id,
        message: userNotificationMessage,
        type: userNotificationType,
        linkTo: `/dashboard/application/${application._id}`,
    });
    await userNotification.save({ session });
    
    await session.commitTransaction();

    return NextResponse.json({ success: true, message: `Payment successfully ${approved ? 'approved' : 'rejected'}.` }, { status: 200 });

  } catch (error: any) {
    await session.abortTransaction();
    console.error(`[API POST /transactions/${transactionId}/verify] Error:`, error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    session.endSession();
  }
}
