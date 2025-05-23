
// src/models/LoanApplication.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { LoanApplication as LoanApplicationType, Guarantor as GuarantorType, CollateralDocument as CollateralDocumentType } from '@/lib/types';

// Interface for Mongoose Document
export interface LoanApplicationDocument extends Omit<LoanApplicationType, 'id' | 'borrowerUserId' | 'guarantor' | 'submittedCollateral' | 'processedDocuments'>, Document {
  id: string; // Mongoose _id
  borrowerUserId: mongoose.Types.ObjectId; // Link to User model
  guarantor?: GuarantorSchemaType; // Embed or reference
  submittedCollateral: CollateralDocumentSchemaType[]; // Embed or reference
  // processedDocuments will likely be derived or stored differently
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schema for Guarantor
const GuarantorSchema = new Schema<GuarantorType>({
  // id is not needed as it's part of LoanApplication or handled by Mongoose if a separate collection
  // loanApplicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication' }, // If separate collection
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  contactNo: { type: String, required: true },
  idProofType: { type: String, required: true },
  idProofDocumentUrl: String, // URL to stored document
  idProofOtherDetails: String,
  addressProofType: { type: String, required: true },
  addressProofDocumentUrl: String, // URL to stored document
  addressProofOtherDetails: String,
  relationshipToBorrower: String,
}, { _id: false }); // _id: false if embedded

export type GuarantorSchemaType = mongoose.InferSchemaType<typeof GuarantorSchema>;


// Sub-schema for CollateralDocument
const CollateralDocumentSchema = new Schema<CollateralDocumentType>({
  // id is not needed as it's part of LoanApplication or handled by Mongoose if a separate collection
  // loanApplicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication' }, // If separate collection
  type: { type: String, required: true }, // CollateralType
  description: { type: String, required: true },
  
  atmPin: String, // Highly sensitive - ensure proper security if stored
  atmCardFrontImageUrl: String,
  atmCardBackImageUrl: String,
  chequeImageUrl: String,
  chequeNumber: String,
  chequeBankName: String,
  bankStatementUrl: String,
  vehicleRcImageUrl: String,
  vehicleImageUrl: String,
  vehicleChallanDetails: String,
  vehiclePapersUrl: String,
  propertyPapersUrl: String,
  propertyImageUrl: String,
  assetDetails: String,
  assetImageUrl: String,
  estimatedValue: Number,
  documentUrls: [String],
  notes: String,
}, { _id: false }); // _id: false if embedded

export type CollateralDocumentSchemaType = mongoose.InferSchemaType<typeof CollateralDocumentSchema>;


const LoanApplicationSchema: Schema = new Schema(
  {
    borrowerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guarantor: GuarantorSchema, // Embedded
    applicationDate: { type: Date, default: Date.now, required: true },
    requestedAmount: { type: Number, required: true },
    purpose: { type: String, required: true },
    
    submittedCollateral: [CollateralDocumentSchema], // Embedded array
    
    status: {
      type: String,
      enum: ['QueryInitiated', 'PendingAdminVerification', 'AdditionalInfoRequired', 'Approved', 'Rejected', 'Active', 'PaidOff', 'Overdue', 'Defaulted'],
      default: 'QueryInitiated',
    },
    adminVerificationNotes: String,
    adminAssignedTo: String, // Could be ObjectId ref to an Admin User
    
    approvedAmount: Number,
    interestRate: Number,
    interestType: String, // 'simple' | 'compound_monthly'
    repaymentFrequency: String, // 'daily' | 'weekly' | 'monthly' | 'custom'
    loanTermMonths: Number,
    processingFee: Number,
    otherCharges: [{ description: String, amount: Number }],
    
    approvedDate: Date,
    disbursementDate: Date,
    firstPaymentDueDate: Date,
    maturityDate: Date,
    
    // Financial Tracking
    principalDisbursed: { type: Number, default: 0 },
    currentPrincipalOutstanding: { type: Number, default: 0 },
    currentInterestOutstanding: { type: Number, default: 0 },
    totalPrincipalRepaid: { type: Number, default: 0 },
    totalInterestRepaid: { type: Number, default: 0 },
    totalPenaltiesPaid: { type: Number, default: 0 },
    lastPaymentDate: Date,
    nextPaymentDueDate: Date,
    nextPaymentAmount: Number,

    // Temporary fields for file names if not uploading full files yet
    borrowerIdProofDocumentName: String,
    borrowerAddressProofDocumentName: String,
    // Add similar fields for guarantor and collateral documents if needed
    // This is a placeholder until full file upload strategy is implemented
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
  }
);

// Add a virtual 'id' property to get the _id as a string
LoanApplicationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


const LoanApplicationModel = models.LoanApplication || mongoose.model<LoanApplicationDocument>('LoanApplication', LoanApplicationSchema);

export default LoanApplicationModel as Model<LoanApplicationDocument>;
