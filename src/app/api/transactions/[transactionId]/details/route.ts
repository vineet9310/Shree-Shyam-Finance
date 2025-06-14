// src/app/api/transactions/[transactionId]/details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanTransactionModel from '@/models/LoanTransaction';
import LoanApplicationModel from '@/models/LoanApplication';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  const { transactionId } = params;
  console.log(`[API GET /transactions/${transactionId}/details] Received request.`);

  if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
    return NextResponse.json({ success: false, message: 'Invalid Transaction ID format' }, { status: 400 });
  }

  try {
    await dbConnect();

    const transaction = await LoanTransactionModel.findById(transactionId);

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found.' }, { status: 404 });
    }

    const application = await LoanApplicationModel.findById(transaction.loanApplicationId).populate('borrowerUserId', 'name email');

    if (!application) {
      return NextResponse.json({ success: false, message: 'Associated loan application not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: transaction.toObject(),
        application: application.toObject(),
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[API GET /transactions/${transactionId}/details] Error:`, error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
