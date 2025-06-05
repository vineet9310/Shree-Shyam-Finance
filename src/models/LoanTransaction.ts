// src/models/LoanTransaction.ts

import mongoose, { Schema, Document, Model } from 'mongoose';
// Import enums from types.ts
import type { PaymentRecord as PaymentRecordType } from '@/lib/types'; 
import { LoanTransactionVerificationStatusEnum } from '@/lib/types'; 


// Interface for Mongoose Document for LoanTransaction
export interface LoanTransactionDocument extends Omit<PaymentRecordType, 'id' | 'loanApplicationId' | 'borrowerUserId' | 'recordedByAdminId' | 'paymentDate' | 'recordedAt'>, Document {
  loanApplicationId: mongoose.Types.ObjectId;
  borrowerUserId: mongoose.Types.ObjectId;
  recordedByAdminId?: mongoose.Types.ObjectId; 
  paymentDate: Date; 
  
  submittedByUserId?: mongoose.Types.ObjectId; 
  userSubmittedScreenshotUrl?: string; 
  
  verificationStatus: LoanTransactionVerificationStatusEnum; 
  adminVerifierId?: mongoose.Types.ObjectId; 
  adminVerificationTimestamp?: Date;
  adminVerificationNotes?: string; 

  recordedAt: Date; 
  createdAt?: Date; 
  updatedAt?: Date; 
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
      enum: ['cash', 'online_transfer_upi', 'online_transfer_neft', 'cheque_deposit', 'other', 'online'], 
      required: true,
    },
    transactionReference: { 
      type: String,
      trim: true,
    },
    principalApplied: { 
      type: Number,
      default: 0, 
    },
    interestApplied: { 
      type: Number,
      default: 0, 
    },
    penaltyApplied: {
      type: Number,
      default: 0,
    },
    notes: { 
      type: String,
      trim: true,
    },
    submittedByUserId: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    userSubmittedScreenshotUrl: String,
    verificationStatus: {
      type: String,
      enum: Object.values(LoanTransactionVerificationStatusEnum), 
      default: LoanTransactionVerificationStatusEnum.SYSTEM_RECORDED, 
    },
    adminVerifierId: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    adminVerificationTimestamp: Date,
    adminVerificationNotes: String, 
    recordedByAdminId: { 
      type: Schema.Types.ObjectId,
      ref: 'User', 
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
    timestamps: true, 
    toJSON: {
      virtuals: true,
      getters: true,
      transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.paymentDate) ret.paymentDate = ret.paymentDate.toISOString();
        if (ret.recordedAt) ret.recordedAt = ret.recordedAt.toISOString();
        if (ret.adminVerificationTimestamp) ret.adminVerificationTimestamp = ret.adminVerificationTimestamp.toISOString();
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
        if (ret.adminVerificationTimestamp) ret.adminVerificationTimestamp = ret.adminVerificationTimestamp.toISOString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

if (!LoanTransactionSchema.virtuals['id']) {
  LoanTransactionSchema.virtual('id').get(function(this: LoanTransactionDocument) {
    return this._id.toHexString();
  });
}

// More robust model definition:
// Check if mongoose.models exists and if the model is already compiled.
// This is crucial for serverless environments and hot reloading.
let LoanTransactionModel: Model<LoanTransactionDocument>;

if (mongoose.models && mongoose.models.LoanTransaction) {
  LoanTransactionModel = mongoose.models.LoanTransaction as Model<LoanTransactionDocument>;
} else {
  // Only call mongoose.model() if Mongoose is fully available and the model isn't already compiled.
  // This defensive check helps if the file is somehow evaluated in an unexpected context,
  // though ideally, this entire file should only be processed server-side.
  if (mongoose.model && typeof mongoose.model === 'function') {
    LoanTransactionModel = mongoose.model<LoanTransactionDocument>('LoanTransaction', LoanTransactionSchema);
  } else {
    // This block indicates a more severe issue with Mongoose initialization if reached on the server.
    console.error("Mongoose is not fully initialized. 'mongoose.model' is undefined. LoanTransactionModel cannot be defined.");
    // Fallback to prevent crashes, though functionality will be broken.
    LoanTransactionModel = {} as Model<LoanTransactionDocument>; 
  }
}

export default LoanTransactionModel;
