// src/app/api/loan-applications/[id]/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanTransactionModel from '@/models/LoanTransaction';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API GET /loan-applications/${id}/transactions] Received request for transactions for loan ID: ${id}`);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.log(`[API GET /loan-applications/${id}/transactions] Invalid loan application ID format: ${id}`);
    return NextResponse.json({ success: false, message: 'Invalid loan application ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    console.log(`[API GET /loan-applications/${id}/transactions] Database connected. Fetching transactions.`);

    const transactions = await LoanTransactionModel.find({ loanApplicationId: new mongoose.Types.ObjectId(id) })
      .sort({ recordedAt: -1 }) // Sort by most recent transactions first
      .populate('recordedByAdminId', 'name email'); // Populate admin details if needed for display

    console.log(`[API GET /loan-applications/${id}/transactions] Found ${transactions.length} transactions for loan ID ${id}.`);

    return NextResponse.json({ success: true, transactions: transactions.map(t => t.toObject()) }, { status: 200 });

  } catch (error: any) {
    console.error(`[API GET /loan-applications/${id}/transactions] Error fetching loan transactions:`, error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error while fetching loan transactions.',
      errorType: error.name
    }, { status: 500 });
  }
}
