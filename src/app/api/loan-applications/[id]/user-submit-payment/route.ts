// src/app/api/loan-applications/[id]/user-submit-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import LoanTransactionModel from '@/models/LoanTransaction'; // Default import is fine
import { LoanTransactionVerificationStatusEnum, NotificationTypeEnum, LoanTransactionTypeEnum } from '@/lib/types'; // Import enum from types.ts
import NotificationModel from '@/models/Notification';
import UserModel from '@/models/User'; 
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import mongoose from 'mongoose';

interface UserSubmitPaymentRequestBody {
  borrowerUserId: string;
  paymentAmount: number;
  paymentDate: string; 
  paymentMethod: 'online' | 'cash';
  transactionReference?: string;
  paymentScreenshot?: string; 
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const loanApplicationId = params.id;
  console.log(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] Received request.`);

  if (!loanApplicationId || !mongoose.Types.ObjectId.isValid(loanApplicationId)) {
    return NextResponse.json(
      { success: false, message: 'Invalid Loan Application ID format' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    console.log(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] Database connected.`);

    const body: UserSubmitPaymentRequestBody = await request.json();
    const {
      borrowerUserId,
      paymentAmount,
      paymentDate,
      paymentMethod,
      transactionReference,
      paymentScreenshot,
      notes,
    } = body;

    // --- Input Validations ---
    if (!borrowerUserId || !mongoose.Types.ObjectId.isValid(borrowerUserId)) {
      return NextResponse.json({ success: false, message: 'Valid Borrower User ID is required.' }, { status: 400 });
    }
    if (paymentAmount === undefined || paymentAmount <= 0) {
      return NextResponse.json({ success: false, message: 'A valid payment amount is required.' }, { status: 400 });
    }
    if (!paymentDate || isNaN(new Date(paymentDate).getTime())) {
        return NextResponse.json({ success: false, message: 'A valid payment date is required.' }, { status: 400 });
    }
    if (!paymentMethod || !['online', 'cash'].includes(paymentMethod)) {
        return NextResponse.json({ success: false, message: 'Invalid payment method selected.' }, { status: 400 });
    }
    if (paymentMethod === 'online' && !paymentScreenshot) {
      return NextResponse.json({ success: false, message: 'Payment screenshot is required for online payments.' }, { status: 400 });
    }
    if (paymentMethod === 'online' && (!transactionReference || transactionReference.trim() === '')) {
        return NextResponse.json({ success: false, message: 'Transaction reference ID is required for online payments.' }, { status: 400 });
    }

    // --- Fetch Loan Application ---
    const application = await LoanApplicationModel.findById(loanApplicationId).populate<{borrowerUserId: {name: string, email: string} }>({ path: 'borrowerUserId', model: UserModel, select: 'name email' });
    if (!application) {
      return NextResponse.json({ success: false, message: 'Loan application not found.' }, { status: 404 });
    }

    // --- Check Application Status ---
    if (application.status !== 'Active' && application.status !== 'Overdue') {
      return NextResponse.json(
        { success: false, message: `Payments can only be submitted for 'Active' or 'Overdue' loans. Current status: ${application.status}` },
        { status: 400 }
      );
    }
    
    const borrowerName = (application.borrowerUserId as any)?.name || 'User'; 

    // --- Handle Screenshot Upload (if applicable) ---
    let screenshotUrl: string | undefined = undefined;
    if (paymentMethod === 'online' && paymentScreenshot) {
      try {
        const uploadResult = await uploadImageToCloudinary(
          paymentScreenshot,
          `payment_proofs/${loanApplicationId}`
        );
        screenshotUrl = uploadResult.secure_url;
        console.log(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] Screenshot uploaded: ${screenshotUrl}`);
      } catch (uploadError: any) {
        console.error(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] Screenshot upload failed:`, uploadError);
        return NextResponse.json(
          { success: false, message: `Screenshot upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }

    // --- Create Loan Transaction Record ---
    const newTransaction = new LoanTransactionModel({
      loanApplicationId: new mongoose.Types.ObjectId(loanApplicationId),
      borrowerUserId: new mongoose.Types.ObjectId(borrowerUserId),
      submittedByUserId: new mongoose.Types.ObjectId(borrowerUserId), 
      paymentDate: new Date(paymentDate),
      amountPaid: paymentAmount,
      paymentMethod: paymentMethod,
      transactionReference: transactionReference,
      userSubmittedScreenshotUrl: screenshotUrl,
      notes: notes,
      verificationStatus: LoanTransactionVerificationStatusEnum.PENDING_VERIFICATION,
      principalApplied: 0, 
      interestApplied: 0,  
      penaltyApplied: 0,   
      type: LoanTransactionTypeEnum.USER_SUBMITTED_PAYMENT, 
      recordedAt: new Date(),
    });
    await newTransaction.save();
    console.log(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] New transaction created with ID: ${newTransaction._id}`);

    // --- Create Notification for Admin(s) ---
    const adminUser = await UserModel.findOne({ role: 'admin' });
    if (adminUser) {
      const adminNotification = new NotificationModel({
        recipientUserId: adminUser._id,
        loanApplicationId: application._id,
        paymentRecordId: newTransaction._id, 
        message: `Payment proof of ₹${paymentAmount.toLocaleString()} submitted by ${borrowerName} for loan application ID ...${application._id.toString().slice(-6)}. Needs verification.`,
        type: NotificationTypeEnum.USER_PAYMENT_SUBMITTED_FOR_VERIFICATION,
        linkTo: `/admin/applications/${application._id}?transactionId=${newTransaction._id}`, 
      });
      await adminNotification.save();
      console.log(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] Notification sent to admin ${adminUser.email}`);
    } else {
        console.warn(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] No admin user found to send verification notification.`);
    }


    // --- Create Notification for User ---
    const userNotification = new NotificationModel({
      recipientUserId: new mongoose.Types.ObjectId(borrowerUserId),
      loanApplicationId: application._id,
      paymentRecordId: newTransaction._id,
      message: `Your payment proof of ₹${paymentAmount.toLocaleString()} for loan ...${application._id.toString().slice(-6)} has been submitted and is pending verification.`,
      type: NotificationTypeEnum.PAYMENT_SUBMISSION_RECEIVED,
      linkTo: `/dashboard/application/${application._id}`,
    });
    await userNotification.save();
    console.log(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] Notification sent to user ${borrowerName}`);


    return NextResponse.json(
      {
        success: true,
        message: 'Payment proof submitted successfully. Pending verification.',
        transaction: newTransaction.toObject(),
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(`[API POST /loan-applications/${loanApplicationId}/user-submit-payment] Error:`, error);
    if (error.name === 'ValidationError') {
      let errors: Record<string, string> = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return NextResponse.json(
        { success: false, message: 'Validation Error', errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
