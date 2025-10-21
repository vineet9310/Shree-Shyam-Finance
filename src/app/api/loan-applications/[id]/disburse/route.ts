// src/app/api/loan-applications/[id]/disburse/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LoanApplicationModel from "@/models/LoanApplication";
import LoanTransactionModel from "@/models/LoanTransaction"; // Import the new transaction model
import NotificationModel from "@/models/Notification";
import mongoose from "mongoose";
import { LoanApplicationStatusEnum, LoanTransactionTypeEnum, NotificationTypeEnum } from "@/lib/types"; // Import necessary enums

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  console.log(
    `[API POST /loan-applications/${id}/disburse] Received request to disburse loan.`
  );

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.log(
      `[API POST /loan-applications/${id}/disburse] Invalid application ID format: ${id}`
    );
    return NextResponse.json(
      { success: false, message: "Invalid application ID format" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    console.log(
      `[API POST /loan-applications/${id}/disburse] Database connected.`
    );

    const {
      adminId,
      disbursementAmount,
      paymentMethod,
      transactionReference,
      notes,
    } = await request.json();

    // Input validation
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid Admin ID is required for disbursement.",
        },
        { status: 400 }
      );
    }
    if (disbursementAmount === undefined || disbursementAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid disbursement amount is required." },
        { status: 400 }
      );
    }
    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment method is required for disbursement.",
        },
        { status: 400 }
      );
    }

    const application = await LoanApplicationModel.findById(id);

    if (!application) {
      console.log(
        `[API POST /loan-applications/${id}/disburse] Loan application not found.`
      );
      return NextResponse.json(
        { success: false, message: "Loan application not found." },
        { status: 404 }
      );
    }

    // Check application status before disbursement
    if (application.status !== "Approved") {
      console.log(
        `[API POST /loan-applications/${id}/disburse] Loan is not in 'Approved' status. Current status: ${application.status}`
      );
      return NextResponse.json(
        {
          success: false,
          message: `Loan must be 'Approved' to be disbursed. Current status: ${application.status}`,
        },
        { status: 400 }
      );
    }

    // Check disbursement amount against approved amount
    if (
      application.approvedAmount === undefined ||
      disbursementAmount > application.approvedAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Disbursement amount (${disbursementAmount}) cannot exceed approved amount (${
            application.approvedAmount || "N/A"
          }).`,
        },
        { status: 400 }
      );
    }

    // Start a Mongoose session for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update Loan Application
      application.status = LoanApplicationStatusEnum.ACTIVE;
      application.disbursementDate = new Date();
      application.principalDisbursed = disbursementAmount;
      application.currentPrincipalOutstanding = disbursementAmount; // Reset outstanding to disbursed amount
      application.currentInterestOutstanding = 0; // Reset outstanding interest on disbursement

      // Ensure nextPaymentDueDate and nextPaymentAmount are set from the repayment schedule if available
      if (
        application.repaymentSchedule &&
        application.repaymentSchedule.length > 0
      ) {
        application.firstPaymentDueDate = new Date(
          application.repaymentSchedule[0].dueDate
        );
        application.nextPaymentDueDate = new Date(
          application.repaymentSchedule[0].dueDate
        );
        application.nextPaymentAmount =
          application.repaymentSchedule[0].paymentAmount;
      } else {
        // Fallback for next payment if schedule somehow missing (shouldn't happen if approved correctly)
        // This fallback should be reviewed to align with your business logic for loans without a schedule.
        // For now, assuming a simple one-month-out due date and simple principal/term calculation.
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        application.firstPaymentDueDate = oneMonthFromNow;
        application.nextPaymentDueDate = oneMonthFromNow;
        application.nextPaymentAmount =
          application.approvedAmount && application.loanTermMonths
            ? application.approvedAmount / application.loanTermMonths
            : 0;
      }

      await application.save({ session }); // Pass session to save operation
      console.log(
        `[API POST /loan-applications/${id}/disburse] Loan application ${id} status updated to 'Active' and disbursed.`
      );

      // Create Loan Transaction record for disbursement
      const newTransaction = new LoanTransactionModel({
        loanApplicationId: application._id,
        borrowerUserId: application.borrowerUserId,
        paymentDate: new Date(), // Date of disbursement
        amountPaid: disbursementAmount, // Corrected: Amount disbursed (positive value)
        type: LoanTransactionTypeEnum.DISBURSEMENT, // Corrected: Set transaction type to 'disbursement'
        paymentMethod: paymentMethod,
        transactionReference: transactionReference,
        principalApplied: disbursementAmount, // Corrected: Principal disbursed (positive value)
        interestApplied: 0,
        penaltyApplied: 0,
        notes: notes || "Loan disbursement",
        recordedByAdminId: new mongoose.Types.ObjectId(adminId),
        recordedAt: new Date(),
      });
      await newTransaction.save({ session }); // Pass session to save operation
      console.log(
        `[API POST /loan-applications/${id}/disburse] Disbursement transaction recorded: ${newTransaction._id}`
      );

      // Create notification for borrower
      const newNotification = new NotificationModel({
        recipientUserId: application.borrowerUserId,
        loanApplicationId: application._id,
        message: `Your loan of ₹${disbursementAmount.toLocaleString()} for purpose '${application.purpose.substring(
          0,
          20
        )}...' has been disbursed.`,
        type: NotificationTypeEnum.LOAN_STATUS_UPDATED, // Corrected: Use the appropriate notification type enum
        linkTo: `/dashboard/application/${application._id}`,
        createdAt: new Date(),
      });
      await newNotification.save({ session }); // Pass session to save operation
      console.log(
        `[API POST /loan-applications/${id}/disburse] Notification created for borrower: ${application.borrowerUserId}`
      );

      await session.commitTransaction(); // Commit the transaction
      session.endSession();

      return NextResponse.json(
        {
          success: true,
          message: "Loan disbursed successfully",
          application: application.toObject(),
          transaction: newTransaction.toObject(),
        },
        { status: 200 }
      );
    } catch (transactionError) {
      await session.abortTransaction(); // Abort transaction on error
      session.endSession();
      throw transactionError; // Re-throw to outer catch block
    }
  } catch (error: any) {
    console.error(
      `[API POST /loan-applications/${id}/disburse] Error disbursing loan:`,
      error
    );
    if (error.name === "ValidationError") {
      let errors: Record<string, string> = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error during disbursement",
          errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Internal Server Error during loan disbursement.",
        errorType: error.name,
      },
      { status: 500 }
    );
  }
}
