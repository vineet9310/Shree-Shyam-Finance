// src/models/LoanApplication.ts

import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { LoanApplication as LoanApplicationType, Guarantor as GuarantorType, CollateralDocument as CollateralDocumentType, RejectionReason as RejectionReasonType, LoanRepaymentScheduleEntry } from '@/lib/types';
import UserModel from './User'; // Assuming User.ts exports UserDocument or similar

// Interface for Mongoose Document
// Ensure this interface includes all fields that might be on the document,
// especially those you expect to be populated or directly stored.
export interface LoanApplicationDocument extends Omit<LoanApplicationType, 'id' | 'borrowerUserId' | 'guarantor' | 'submittedCollateral' | 'processedDocuments' | 'applicationDate' | 'approvedDate' | 'disbursementDate' | 'firstPaymentDueDate' | 'maturityDate' | 'lastPaymentDate' | 'nextPaymentDueDate' | 'lastReminderSentDate' | 'createdAt' | 'updatedAt' | 'rejectionDetails' | 'repaymentSchedule'>, Document {
  borrowerUserId: mongoose.Types.ObjectId | UserDocument; // Can be populated
  borrowerFullName: string;
  borrowerEmail: string;
  borrowerContactNo?: string;
  borrowerAddress?: string;
  borrowerIdProofType?: string;
  borrowerAddressProofType?: string;

  guarantor?: GuarantorSchemaType; // Using the Mongoose-compatible schema type
  submittedCollateral: CollateralDocumentSchemaType[]; // Using the Mongoose-compatible schema type
  applicationDate: Date;
  approvedDate?: Date;
  disbursementDate?: Date;
  firstPaymentDueDate?: Date;
  maturityDate?: Date;
  lastPaymentDate?: Date;
  nextPaymentDueDate?: Date;
  lastReminderSentDate?: Date; // Add this field
  createdAt?: Date;
  updatedAt?: Date;

  borrowerIdProofDocumentUrl?: string;
  borrowerAddressProofDocumentUrl?: string;
  generalSupportingDocumentUrls?: string[];

  rejectionDetails?: RejectionReasonSchemaType; // Using the Mongoose-compatible schema type

  // Financial Profile Fields
  monthlyIncome?: number;
  employmentStatus?: string; // Ensured this is here
  jobType?: string;
  businessDescription?: string;
  creditScore?: number; // Ensured this is here

  repaymentSchedule?: LoanRepaymentScheduleEntrySchemaType[]; // Using the Mongoose-compatible schema type
}

// A minimal interface for what UserModel might look like when populated.
// Adjust according to your actual UserModel structure if needed.
interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  id: string; // virtual
}


// Sub-schema for Guarantor
const GuarantorSchema = new Schema<GuarantorType>({
  fullName: { type: String, required: false },
  address: { type: String, required: false },
  contactNo: { type: String, required: false },
  idProofType: { type: String, enum: ["aadhaar", "pan", "voter_id", "driving_license", "passport", "other"], required: false },
  idProofDocumentUrl: String,
  idProofOtherDetails: String,
  addressProofType: { type: String, enum: ["aadhaar", "utility_bill", "rent_agreement", "passport", "other"], required: false },
  addressProofDocumentUrl: String,
  addressProofOtherDetails: String,
  relationshipToBorrower: String,
}, { _id: false });

// Exporting the Mongoose-compatible type for Guarantor
export type GuarantorSchemaType = mongoose.InferSchemaType<typeof GuarantorSchema>;


// Sub-schema for CollateralDocument
// Omitting fields that are Base64 strings in form state and only storing URLs
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

// Exporting the Mongoose-compatible type for CollateralDocument
export type CollateralDocumentSchemaType = mongoose.InferSchemaType<typeof CollateralDocumentSchema>;

// Sub-schema for RejectionReason
const RejectionReasonSchema = new Schema<RejectionReasonType>({
  text: String,
  imageUrl: String,
  audioUrl: String,
  adminId: { type: String },
  rejectedAt: { type: Date, default: Date.now },
}, { _id: false });

// Exporting the Mongoose-compatible type for RejectionReason
export type RejectionReasonSchemaType = mongoose.InferSchemaType<typeof RejectionReasonSchema>;

// Sub-schema for LoanRepaymentScheduleEntry
const LoanRepaymentScheduleEntrySchema = new Schema<LoanRepaymentScheduleEntry>({
  period: { type: Number, required: true },
  dueDate: { type: String, required: true }, // Stored as ISO string
  startingBalance: { type: Number, required: true },
  principalComponent: { type: Number, required: true },
  interestComponent: { type: Number, required: true },
  endingBalance: { type: Number, required: true },
  paymentAmount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
}, { _id: false });

// Exporting the Mongoose-compatible type for LoanRepaymentScheduleEntry
export type LoanRepaymentScheduleEntrySchemaType = mongoose.InferSchemaType<typeof LoanRepaymentScheduleEntrySchema>;


const LoanApplicationSchema: Schema<LoanApplicationDocument> = new Schema(
  {
    borrowerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Make sure 'User' matches your UserModel name
      required: true,
    },
    borrowerFullName: { type: String, required: true },
    borrowerEmail: { type: String, required: true, lowercase: true },
    borrowerContactNo: { type: String },
    borrowerAddress: { type: String },
    borrowerIdProofType: { type: String },
    borrowerAddressProofType: { type: String },

    guarantor: GuarantorSchema,
    applicationDate: { type: Date, default: Date.now, required: true },
    requestedAmount: { type: Number, required: true },
    purpose: { type: String, required: true },

    // Financial Profile Fields - ensured they are all here
    monthlyIncome: { type: Number },
    employmentStatus: { type: String }, // Added/Ensured
    jobType: { type: String },
    businessDescription: { type: String },
    creditScore: { type: Number },

    submittedCollateral: [CollateralDocumentSchema],

    status: {
      type: String,
      enum: ['QueryInitiated', 'PendingAdminVerification', 'AdditionalInfoRequired', 'Approved', 'Rejected', 'Active', 'PaidOff', 'Overdue', 'Defaulted', 'Submitted', 'Disbursed'],
      default: 'QueryInitiated',
      required: true,
    } as any,
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
    lastReminderSentDate: Date, // Track when last reminder was sent

    borrowerIdProofDocumentUrl: String,
    borrowerAddressProofDocumentUrl: String,
    generalSupportingDocumentUrls: [String],

    rejectionDetails: RejectionReasonSchema,
    repaymentSchedule: [LoanRepaymentScheduleEntrySchema],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
        virtuals: true,
        getters: true,
        transform: function(doc: any, ret: any) {
            ret.id = ret._id?.toString();
            if (ret.borrowerUserId && typeof ret.borrowerUserId === 'object' && ret.borrowerUserId._id && !ret.borrowerUserId.id) {
              ret.borrowerUserId.id = ret.borrowerUserId._id.toString();
            }
            const dateFields = ['applicationDate', 'approvedDate', 'disbursementDate', 'firstPaymentDueDate', 'maturityDate', 'lastPaymentDate', 'nextPaymentDueDate', 'createdAt', 'updatedAt'];
            dateFields.forEach(field => {
              if (ret[field] && ret[field] instanceof Date) {
                ret[field] = ret[field].toISOString();
              }
            });
            if (ret.rejectionDetails?.rejectedAt instanceof Date) {
              ret.rejectionDetails.rejectedAt = ret.rejectionDetails.rejectedAt.toISOString();
            }
            if (ret.repaymentSchedule && Array.isArray(ret.repaymentSchedule)) {
              ret.repaymentSchedule = ret.repaymentSchedule.map((entry: any) => ({
                ...entry,
                dueDate: entry.dueDate instanceof Date ? entry.dueDate.toISOString() : entry.dueDate,
              }));
            }
            delete ret._id;
            if (ret.__v !== undefined) delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        getters: true,
        transform: function(doc: any, ret: any) {
            ret.id = ret._id?.toString();
            if (ret.borrowerUserId && typeof ret.borrowerUserId === 'object' && ret.borrowerUserId._id && !ret.borrowerUserId.id) {
              ret.borrowerUserId.id = ret.borrowerUserId._id.toString();
            }
            const dateFields = ['applicationDate', 'approvedDate', 'disbursementDate', 'firstPaymentDueDate', 'maturityDate', 'lastPaymentDate', 'nextPaymentDueDate', 'createdAt', 'updatedAt'];
            dateFields.forEach(field => {
              if (ret[field] && ret[field] instanceof Date) {
                ret[field] = ret[field].toISOString();
              }
            });
            if (ret.rejectionDetails?.rejectedAt instanceof Date) {
              ret.rejectionDetails.rejectedAt = ret.rejectionDetails.rejectedAt.toISOString();
            }
            if (ret.repaymentSchedule && Array.isArray(ret.repaymentSchedule)) {
              ret.repaymentSchedule = ret.repaymentSchedule.map((entry: any) => ({
                ...entry,
                dueDate: entry.dueDate instanceof Date ? entry.dueDate.toISOString() : entry.dueDate,
              }));
            }
            delete ret._id;
            if (ret.__v !== undefined) delete ret.__v;
        }
    }
  }
);

// Explicitly define virtual 'id'
(LoanApplicationSchema.virtuals as any)['id'] = LoanApplicationSchema.virtual('id').get(function(this: any) {
  return this._id?.toHexString();
});

// Ensure the model is correctly typed and registered
const LoanApplicationModel = (models.LoanApplication as Model<LoanApplicationDocument, {}, {}>) || // Added empty {} for methods and virtuals if none
  mongoose.model<LoanApplicationDocument>('LoanApplication', LoanApplicationSchema);

export default LoanApplicationModel;
