// /src/app/api/transactions/[transactionId]/details/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanTransactionModel from '@/models/LoanTransaction';
import UserModel from '@/models/User';
import LoanApplicationModel from '@/models/LoanApplication';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  const { transactionId } = params;

  if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
    return NextResponse.json({ success: false, message: 'Invalid Transaction ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Database se transaction find karein aur related data (user, loan) ko populate karein
    const transaction = await LoanTransactionModel.findById(transactionId)
      .populate({
        path: 'borrowerUserId', // Database mein field ka naam
        model: UserModel,
        select: 'name email'
      })
      .populate({
        path: 'loanApplicationId', // Database mein field ka naam
        model: LoanApplicationModel,
        select: 'loanId'
      })
      .lean(); // .lean() plain JavaScript object return karta hai, jo fast hota hai

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found.' }, { status: 404 });
    }

    // --- YEH SABSE ZAROORI FIX HAI ---
    // Frontend ki zaroorat ke hisaab se data ka structure badlein.
    const formattedTransaction = {
      ...transaction,
      // 'borrowerUserId' ko 'user' naam se bhejein
      user: transaction.borrowerUserId,
      // 'loanApplicationId' ko 'loanApplication' naam se bhejein
      loanApplication: transaction.loanApplicationId,
    };
    
    // Purane naam waale fields ko response se hata sakte hain (optional)
    // @ts-ignore
    delete formattedTransaction.borrowerUserId;
    // @ts-ignore
    delete formattedTransaction.loanApplicationId;

    return NextResponse.json({
      success: true,
      transaction: formattedTransaction, // Sahi format waala data bhejein
    });

  } catch (error: any) {
    console.error(`[API GET /transactions/${transactionId}/details] Error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
