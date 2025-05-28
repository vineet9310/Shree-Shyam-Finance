// src/models/LoanApplication.ts

import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { LoanApplication as LoanApplicationType, Guarantor as GuarantorType, CollateralDocument as CollateralDocumentType, RejectionReason as RejectionReasonType, LoanRepaymentScheduleEntry } from '@/lib/types'; // Import LoanRepaymentScheduleEntry
import UserModel from './User';

// Interface for Mongoose Document
export interface LoanApplicationDocument extends Omit<LoanApplicationType, 'id' | 'borrowerUserId' | 'guarantor' | 'submittedCollateral' | 'processedDocuments' | 'applicationDate' | 'approvedDate' | 'disbursementDate' | 'firstPaymentDueDate' | 'maturityDate' | 'lastPaymentDate' | 'nextPaymentDueDate' | 'createdAt' | 'updatedAt' | 'borrowerIdProofDocumentName' | 'borrowerAddressProofDocumentName' | 'rejectionDetails' | 'repaymentSchedule'>, Document {
  borrowerUserId: mongoose.Types.ObjectId | UserDocument; // Can be populated
  // Denormalized fields for easier display
  borrowerFullName: string;
  borrowerEmail: string;
  borrowerContactNo?: string; // Added
  borrowerAddress?: string; // Added
  borrowerIdProofType?: string; // Added
  borrowerAddressProofType?: string; // Added

  guarantor?: GuarantorSchemaType;
  submittedCollateral: CollateralDocumentSchemaType[];
  applicationDate: Date;
  approvedDate?: Date;
  disbursementDate?: Date;
  firstPaymentDueDate?: Date;
  maturityDate?: Date;
  lastPaymentDate?: Date;
  nextPaymentDueDate?: Date;
  createdAt?: Date; // Mongoose timestamps will add this
  updatedAt?: Date; // Mongoose timestamps will add this

  // Document URLs from Cloudinary
  borrowerIdProofDocumentUrl?: string;
  borrowerAddressProofDocumentUrl?: string;
  generalSupportingDocumentUrls?: string[];

  // New field for rejection details
  rejectionDetails?: RejectionReasonSchemaType; // Add this

  // New fields for financial profile
  monthlyIncome?: number; // Changed from income to monthlyIncome
  jobType?: string; // New field
  businessDescription?: string; // New field

  // New field for repayment schedule
  repaymentSchedule?: LoanRepaymentScheduleEntrySchemaType[]; // Array of repayment entries
}

interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  id: string; // virtual
}


// Sub-schema for Guarantor - aligning with form fields for document names
const GuarantorSchema = new Schema<GuarantorType>({
  fullName: { type: String, required: false }, // Changed to false
  address: { type: String, required: false }, // Changed to false
  contactNo: { type: String, required: false }, // Changed to false
  idProofType: { type: String, enum: ["aadhaar", "pan", "voter_id", "driving_license", "passport", "other"], required: false }, // Changed to false
  idProofDocumentUrl: String,
  idProofOtherDetails: String,
  addressProofType: { type: String, enum: ["aadhaar", "utility_bill", "rent_agreement", "passport", "other"], required: false }, // Changed to false
  addressProofDocumentUrl: String,
  addressProofOtherDetails: String,
  relationshipToBorrower: String,
}, { _id: false });

export type GuarantorSchemaType = mongoose.InferSchemaType<typeof GuarantorSchema>;


// Sub-schema for CollateralDocument - aligning with form fields for document names
const CollateralDocumentSchema = new Schema<Omit<CollateralDocumentType, 'atmCardFrontImage' | 'atmCardBackImage' | 'chequeImage' | 'bankStatementFile' | 'vehicleRcImage' | 'vehicleImage' | 'propertyPapersFile' | 'propertyImage' | 'assetImage' | 'additionalDocuments'>>({
  type: { type: String, required: true },
  description: { type: String, required: true },

  atmPin: String,
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
  notes: String,
  documentUrls: [String],
}, { _id: false });

export type CollateralDocumentSchemaType = mongoose.InferSchemaType<typeof CollateralDocumentSchema>;

// New sub-schema for RejectionReason
const RejectionReasonSchema = new Schema<RejectionReasonType>({
  text: String,
  imageUrl: String,
  audioUrl: String,
  adminId: { type: String }, // Changed from Schema.Types.ObjectId to String
  rejectedAt: { type: Date, default: Date.now },
}, { _id: false });

export type RejectionReasonSchemaType = mongoose.InferSchemaType<typeof RejectionReasonSchema>;

// New sub-schema for LoanRepaymentScheduleEntry
const LoanRepaymentScheduleEntrySchema = new Schema<LoanRepaymentScheduleEntry>({
  period: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  startingBalance: { type: Number, required: true },
  principalComponent: { type: Number, required: true },
  interestComponent: { type: Number, required: true },
  endingBalance: { type: Number, required: true },
  paymentAmount: { type: Number, required: true }, // EMI
  isPaid: { type: Boolean, default: false },
}, { _id: false });

export type LoanRepaymentScheduleEntrySchemaType = mongoose.InferSchemaType<typeof LoanRepaymentScheduleEntrySchema>;


const LoanApplicationSchema: Schema<LoanApplicationDocument> = new Schema(
  {
    borrowerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    borrowerFullName: { type: String, required: true },
    borrowerEmail: { type: String, required: true },
    borrowerContactNo: { type: String }, // Added
    borrowerAddress: { type: String }, // Added
    borrowerIdProofType: { type: String }, // Added
    borrowerAddressProofType: { type: String }, // Added
    guarantor: GuarantorSchema, // This makes the guarantor subdocument itself optional if not provided
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

    borrowerIdProofDocumentUrl: String,
    borrowerAddressProofDocumentUrl: String,
    generalSupportingDocumentUrls: [String],

    // New field for rejection details
    rejectionDetails: RejectionReasonSchema, // Add this

    // New fields for financial profile
    monthlyIncome: { type: Number }, // Changed from income to monthlyIncome
    jobType: { type: String }, // New field
    businessDescription: { type: String }, // New field
    creditScore: { type: Number }, // Existing field, just ensuring it's here

    // New field for repayment schedule
    repaymentSchedule: [LoanRepaymentScheduleEntrySchema], // Array of repayment entries
  },
  {
    timestamps: true,
    toJSON: {
        virtuals: true,
        getters: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            if (ret.borrowerUserId && typeof ret.borrowerUserId === 'object' && ret.borrowerUserId._id) {
              // If populated, ensure the populated object also has 'id'
              if (!ret.borrowerUserId.id) {
                ret.borrowerUserId.id = ret.borrowerUserId._id.toString();
              }
            }
            // Ensure rejectionDetails.rejectedAt is converted to string if present
            if (ret.rejectionDetails && ret.rejectionDetails.rejectedAt instanceof Date) {
              ret.rejectionDetails.rejectedAt = ret.rejectionDetails.rejectedAt.toISOString();
            }
            // Convert repayment schedule dates to ISO strings
            if (ret.repaymentSchedule && Array.isArray(ret.repaymentSchedule)) {
              ret.repaymentSchedule = ret.repaymentSchedule.map((entry: any) => ({
                ...entry,
                dueDate: entry.dueDate instanceof Date ? entry.dueDate.toISOString() : entry.dueDate,
              }));
            }
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        getters: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
             if (ret.borrowerUserId && typeof ret.borrowerUserId === 'object' && ret.borrowerUserId._id) {
              if (!ret.borrowerUserId.id) {
                ret.borrowerUserId.id = ret.borrowerUserId._id.toString();
              }
            }
            // Ensure rejectionDetails.rejectedAt is converted to string if present
            if (ret.rejectionDetails && ret.rejectionDetails.rejectedAt instanceof Date) {
              ret.rejectionDetails.rejectedAt = ret.rejectionDetails.rejectedAt.toISOString();
            }
            // Convert repayment schedule dates to ISO strings
            if (ret.repaymentSchedule && Array.isArray(ret.repaymentSchedule)) {
              ret.repaymentSchedule = ret.repaymentSchedule.map((entry: any) => ({
                ...entry,
                dueDate: entry.dueDate instanceof Date ? entry.dueDate.toISOString() : entry.dueDate,
              }));
            }
            delete ret._id;
            delete ret.__v;
        }
    }
  }
);

// Ensure virtual 'id' is explicitly defined if not already present through transform
if (!LoanApplicationSchema.virtuals['id']) {
  LoanApplicationSchema.virtual('id').get(function(this: LoanApplicationDocument) {
    return this._id.toHexString();
  });
}


const LoanApplicationModel = (models.LoanApplication as Model<LoanApplicationDocument>) || mongoose.model<LoanApplicationDocument>('LoanApplication', LoanApplicationSchema);

export default LoanApplicationModel;
