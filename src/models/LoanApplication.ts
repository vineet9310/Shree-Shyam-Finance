
// src/models/LoanApplication.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { LoanApplication as LoanApplicationType, Guarantor as GuarantorType, CollateralDocument as CollateralDocumentType } from '@/lib/types';

// Interface for Mongoose Document
export interface LoanApplicationDocument extends Omit<LoanApplicationType, 'id' | 'borrowerUserId' | 'guarantor' | 'submittedCollateral' | 'processedDocuments' | 'applicationDate' | 'approvedDate' | 'disbursementDate' | 'firstPaymentDueDate' | 'maturityDate' | 'lastPaymentDate' | 'nextPaymentDueDate' | 'createdAt' | 'updatedAt'>, Document {
  borrowerUserId: mongoose.Types.ObjectId;
  // Denormalized fields for easier display
  borrowerFullName: string;
  borrowerEmail: string;

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
  idProofDocumentName: String, 
  idProofOtherDetails: String,
  addressProofType: { type: String, enum: ["aadhaar", "utility_bill", "rent_agreement", "passport", "other"], required: true },
  addressProofDocumentName: String, 
  addressProofOtherDetails: String,
  relationshipToBorrower: String,
}, { _id: false });

export type GuarantorSchemaType = mongoose.InferSchemaType<typeof GuarantorSchema>;


// Sub-schema for CollateralDocument - aligning with form fields for document names
const CollateralDocumentSchema = new Schema<Omit<CollateralDocumentType, 'atmCardFrontImage' | 'atmCardBackImage' | 'chequeImage' | 'bankStatementFile' | 'vehicleRcImage' | 'vehicleImage' | 'propertyPapersFile' | 'propertyImage' | 'assetImage' | 'additionalDocuments'>>({
  type: { type: String, required: true }, // CollateralType
  description: { type: String, required: true },
  
  atmPin: String, 
  atmCardFrontImageName: String, 
  atmCardBackImageName: String,  
  
  chequeImageName: String, 
  chequeNumber: String,
  chequeBankName: String,

  bankStatementFileName: String, 

  vehicleRcImageName: String, 
  vehicleImageName: String, 
  vehicleChallanDetails: String, 

  propertyPapersFileName: String, 
  propertyImageName: String, 

  assetDetails: String, 
  assetImageName: String, 

  estimatedValue: Number,
  notes: String,
}, { _id: false });

export type CollateralDocumentSchemaType = mongoose.InferSchemaType<typeof CollateralDocumentSchema>;


const LoanApplicationSchema: Schema<LoanApplicationDocument> = new Schema(
  {
    borrowerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    borrowerFullName: { type: String, required: true },
    borrowerEmail: { type: String, required: true },
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

    borrowerIdProofDocumentName: String,
    borrowerAddressProofDocumentName: String,
  },
  {
    timestamps: true, 
    toJSON: {
        virtuals: true, 
        getters: true, 
        transform: function(doc, ret) {
            ret.id = ret._id.toString(); 
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

if (!LoanApplicationSchema.virtuals['id']) {
  LoanApplicationSchema.virtual('id').get(function(this: LoanApplicationDocument) {
    return this._id.toHexString();
  });
}


const LoanApplicationModel = (models.LoanApplication as Model<LoanApplicationDocument>) || mongoose.model<LoanApplicationDocument>('LoanApplication', LoanApplicationSchema);

export default LoanApplicationModel;
