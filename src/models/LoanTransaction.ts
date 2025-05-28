// src/models/LoanTransaction.ts

import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { PaymentRecord } from '@/lib/types'; // Import the PaymentRecord type

// Interface for Mongoose Document for LoanTransaction
export interface LoanTransactionDocument extends Omit<PaymentRecord, 'id' | 'loanApplicationId' | 'borrowerUserId' | 'recordedByAdminId' | 'paymentDate' | 'recordedAt'>, Document {
  loanApplicationId: mongoose.Types.ObjectId;
  borrowerUserId: mongoose.Types.ObjectId;
  recordedByAdminId: mongoose.Types.ObjectId;
  paymentDate: Date; // Store as Date object in DB
  recordedAt: Date; // Store as Date object in DB
  createdAt?: Date; // Mongoose timestamps
  updatedAt?: Date; // Mongoose timestamps
}

const LoanTransactionSchema: Schema<LoanTransactionDocument> = new Schema(
  {
    loanApplicationId: {
      type: Schema.Types.ObjectId,
      ref: 'LoanApplication',
      required: true,
    },
    borrowerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online_transfer_upi', 'online_transfer_neft', 'cheque_deposit', 'other'],
      required: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      required: false, // Optional, but good for tracking
    },
    principalApplied: {
      type: Number,
      required: true,
      min: 0,
    },
    interestApplied: {
      type: Number,
      required: true,
      min: 0,
    },
    penaltyApplied: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the admin user who recorded the payment
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    isLatePayment: {
      type: Boolean,
      default: false,
    },
    daysLate: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    toJSON: {
      virtuals: true,
      getters: true,
      transform: function(doc, ret) {
        ret.id = ret._id.toString();
        // Convert Date objects to ISO strings for consistent frontend handling
        if (ret.paymentDate) ret.paymentDate = ret.paymentDate.toISOString();
        if (ret.recordedAt) ret.recordedAt = ret.recordedAt.toISOString();
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      virtuals: true,
      getters: true,
      transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.paymentDate) ret.paymentDate = ret.paymentDate.toISOString();
        if (ret.recordedAt) ret.recordedAt = ret.recordedAt.toISOString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Virtual for 'id'
if (!LoanTransactionSchema.virtuals['id']) {
  LoanTransactionSchema.virtual('id').get(function(this: LoanTransactionDocument) {
    return this._id.toHexString();
  });
}

const LoanTransactionModel = (models.LoanTransaction as Model<LoanTransactionDocument>) || mongoose.model<LoanTransactionDocument>('LoanTransaction', LoanTransactionSchema);

export default LoanTransactionModel;
