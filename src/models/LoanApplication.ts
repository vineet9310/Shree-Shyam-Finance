
// src/models/LoanApplication.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { LoanApplication as LoanApplicationType, Guarantor as GuarantorType, CollateralDocument as CollateralDocumentType } from '@/lib/types';

// Interface for Mongoose Document
// Note: Omit 'id' because Mongoose Document already has it (as _id and virtual id)
// Omit 'borrowerUserId' if it's always populated as an object in LoanApplicationType,
// or ensure the base type and Mongoose type are compatible.
// For 'guarantor' and 'submittedCollateral', we'll use specific Mongoose sub-document types.
export interface LoanApplicationDocument extends Omit<LoanApplicationType, 'id' | 'borrowerUserId' | 'guarantor' | 'submittedCollateral' | 'processedDocuments' | 'applicationDate' | 'approvedDate' | 'disbursementDate' | 'firstPaymentDueDate' | 'maturityDate' | 'lastPaymentDate' | 'nextPaymentDueDate' | 'createdAt' | 'updatedAt'>, Document {
  borrowerUserId: mongoose.Types.ObjectId;
  guarantor?: GuarantorSchemaType;
  submittedCollateral: CollateralDocumentSchemaType[];
  applicationDate: Date;
  approvedDate?: Date;
  disbursementDate?: Date;
  firstPaymentDueDate?: Date;
  maturityDate?: Date;
  lastPaymentDate?: Date;
  nextPaymentDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}


// Sub-schema for Guarantor - aligning with form fields for document names
const GuarantorSchema = new Schema<GuarantorType>({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  contactNo: { type: String, required: true },
  idProofType: { type: String, enum: ["aadhaar", "pan", "voter_id", "driving_license", "passport", "other"], required: true },
  idProofDocumentName: String, // Changed from idProofDocumentUrl to store name
  idProofOtherDetails: String,
  addressProofType: { type: String, enum: ["aadhaar", "utility_bill", "rent_agreement", "passport", "other"], required: true },
  addressProofDocumentName: String, // Changed from addressProofDocumentUrl to store name
  addressProofOtherDetails: String,
  relationshipToBorrower: String,
}, { _id: false });

export type GuarantorSchemaType = mongoose.InferSchemaType<typeof GuarantorSchema>;


// Sub-schema for CollateralDocument - aligning with form fields for document names
const CollateralDocumentSchema = new Schema<Omit<CollateralDocumentType, 'atmCardFrontImage' | 'atmCardBackImage' | 'chequeImage' | 'bankStatementFile' | 'vehicleRcImage' | 'vehicleImage' | 'propertyPapersFile' | 'propertyImage' | 'assetImage' | 'additionalDocuments'>>({
  type: { type: String, required: true }, // CollateralType
  description: { type: String, required: true },
  
  atmPin: String, 
  atmCardFrontImageName: String, // Storing name
  atmCardBackImageName: String,  // Storing name
  
  chequeImageName: String, // Storing name
  chequeNumber: String,
  chequeBankName: String,

  bankStatementFileName: String, // Storing name

  vehicleRcImageName: String, // Storing name
  vehicleImageName: String, // Storing name
  vehicleChallanDetails: String, 
  // vehiclePapersUrl: String, // If you have a separate field for this URL

  propertyPapersFileName: String, // Storing name
  propertyImageName: String, // Storing name

  assetDetails: String, 
  assetImageName: String, // Storing name

  estimatedValue: Number,
  // documentUrls: [String], // If storing multiple generic URLs
  notes: String,
  // additionalDocumentNames: [String], // For storing names of additional uploaded docs
}, { _id: false });

export type CollateralDocumentSchemaType = mongoose.InferSchemaType<typeof CollateralDocumentSchema>;


const LoanApplicationSchema: Schema<LoanApplicationDocument> = new Schema(
  {
    borrowerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guarantor: GuarantorSchema, 
    applicationDate: { type: Date, default: Date.now, required: true },
    requestedAmount: { type: Number, required: true },
    purpose: { type: String, required: true },
    
    submittedCollateral: [CollateralDocumentSchema], 
    
    status: {
      type: String,
      enum: ['QueryInitiated', 'PendingAdminVerification', 'AdditionalInfoRequired', 'Approved', 'Rejected', 'Active', 'PaidOff', 'Overdue', 'Defaulted'],
      default: 'QueryInitiated',
      required: true,
    },
    adminVerificationNotes: String,
    adminAssignedTo: String, 
    
    approvedAmount: Number,
    interestRate: Number,
    interestType: String, 
    repaymentFrequency: String, 
    loanTermMonths: Number,
    processingFee: Number,
    otherCharges: [{ description: String, amount: Number }],
    
    approvedDate: Date,
    disbursementDate: Date,
    firstPaymentDueDate: Date,
    maturityDate: Date,
    
    principalDisbursed: { type: Number, default: 0 },
    currentPrincipalOutstanding: { type: Number, default: 0 },
    currentInterestOutstanding: { type: Number, default: 0 },
    totalPrincipalRepaid: { type: Number, default: 0 },
    totalInterestRepaid: { type: Number, default: 0 },
    totalPenaltiesPaid: { type: Number, default: 0 },
    lastPaymentDate: Date,
    nextPaymentDueDate: Date,
    nextPaymentAmount: Number,

    // Fields for storing original document names from the form submission
    borrowerIdProofDocumentName: String,
    borrowerAddressProofDocumentName: String,
    // Guarantor and Collateral document names are handled within their respective sub-schemas
  },
  {
    timestamps: true, 
    toJSON: {
        virtuals: true, // Ensure virtuals are included
        getters: true, // Ensure getters are applied
        transform: function(doc, ret) {
            ret.id = ret._id.toString(); // Explicitly set id as string
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        getters: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
        }
    }
  }
);

// Ensure virtual 'id' is defined if not automatically handled by toJSON/toObject in all cases
if (!LoanApplicationSchema.virtuals['id']) {
  LoanApplicationSchema.virtual('id').get(function(this: LoanApplicationDocument) {
    return this._id.toHexString();
  });
}


const LoanApplicationModel = (models.LoanApplication as Model<LoanApplicationDocument>) || mongoose.model<LoanApplicationDocument>('LoanApplication', LoanApplicationSchema);

export default LoanApplicationModel;

    