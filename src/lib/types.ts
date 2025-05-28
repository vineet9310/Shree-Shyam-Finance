// src/lib/types.ts

import type mongoose from 'mongoose';

export type LoanApplicationStatusOriginal = 'Pending' | 'Approved' | 'Rejected' | 'Under Review';

// --- New Detailed Types for Lending Application ---

export interface User {
  id: string; // Corresponds to Mongoose _id
  email: string;
  name: string;
  role: 'user' | 'admin';
  borrowerProfileId?: string; // Link to detailed borrower profile (could be mongoose.Types.ObjectId string)
  // Optional fields that might come from User model
  contactNo?: string;
  address?: string;
  idProofType?: string;
  idProofDocumentUrl?: string; // Added for User documents
  addressProofType?: string;
  addressProofDocumentUrl?: string; // Added for User documents
  passwordHash?: string; // Only for backend, should not be sent to client
  createdAt?: string; // ISO Date string
  updatedAt?: string; // ISO Date string
}

// This interface might be merged into User or kept separate if admin needs extensive borrower-specific fields.
// For now, User model has some of these.
export interface BorrowerProfile {
  id: string;
  userId: string;
  fullName: string;
  address: string;
  contactNo: string;
  idProofType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport' | 'other';
  idProofDocumentUrl: string;
  idProofOtherDetails?: string;
  addressProofType: 'aadhaar' | 'utility_bill' | 'rent_agreement' | 'passport' | 'other';
  addressProofDocumentUrl: string;
  addressProofOtherDetails?: string;
  occupation?: string;
  notes?: string;
}

export interface Guarantor {
  fullName: string;
  address: string;
  contactNo: string;
  idProofType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport' | 'other';
  idProofDocumentUrl?: string; // Changed to URL
  idProofDocument?: string; // For form state, will be Base64 string
  idProofOtherDetails?: string;
  addressProofType: 'aadhaar' | 'utility_bill' | 'rent_agreement' | 'passport' | 'other';
  addressProofDocumentUrl?: string; // Changed to URL
  addressProofDocument?: string; // For form state, will be Base64 string
  addressProofOtherDetails?: string;
  relationshipToBorrower?: string;
}

export type CollateralType =
  | 'atm_card'
  | 'blank_cheque'
  | 'bank_statement'
  | 'vehicle_bike'
  | 'vehicle_car'
  | 'vehicle_scooty'
  | 'property_house'
  | 'property_land'
  | 'gold_jewelry'
  | 'other_asset';

export interface CollateralDocument {
  type: CollateralType;
  description: string;

  atmPin?: string;
  atmCardFrontImageUrl?: string; // Changed to URL
  atmCardBackImageUrl?: string;  // Changed to URL
  atmCardFrontImage?: string; // For form state, will be Base64 string
  atmCardBackImage?: string; // For form state, will be Base64 string

  chequeImageUrl?: string; // Changed to URL
  chequeImage?: string; // For form state, will be Base64 string
  chequeNumber?: string;
  chequeBankName?: string;

  bankStatementUrl?: string; // Changed to URL
  bankStatementFile?: string; // For form state, will be Base64 string

  vehicleRcImageUrl?: string; // Changed to URL
  vehicleRcImage?: string; // For form state, will be Base64 string
  vehicleImageUrl?: string; // Changed to URL
  vehicleImage?: string; // For form state, will be Base64 string
  vehicleChallanDetails?: string;
  vehiclePapersUrl?: string; // New field for general vehicle papers URL

  propertyPapersUrl?: string; // Changed to URL
  propertyPapersFile?: string; // For form state, will be Base64 string
  propertyImageUrl?: string; // Changed to URL
  propertyImage?: string; // For form state, will be Base64 string

  assetDetails?: string;
  assetImageUrl?: string; // Changed to URL
  assetImage?: string; // For form state, will be Base64 string

  estimatedValue?: number;
  documentUrls?: string[]; // Generic array of URLs for miscellaneous docs
  notes?: string;
  additionalDocuments?: string[]; // For form state, will be array of Base64 strings
}

export interface RejectionReason {
  text?: string;
  imageUrl?: string; // URL from Cloudinary
  audioUrl?: string; // URL from Cloudinary
  adminId?: string; // ID of the admin who rejected
  rejectedAt?: string; // ISO date string of rejection
}

export enum LoanApplicationStatusEnum {
  QUERY_INITIATED = 'QueryInitiated',
  PENDING_ADMIN_VERIFICATION = 'PendingAdminVerification',
  ADDITIONAL_INFO_REQUIRED = 'AdditionalInfoRequired',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  ACTIVE = 'Active',
  PAID_OFF = 'PaidOff',
  OVERDUE = 'Overdue',
  DEFAULTED = 'Defaulted',
}

export enum LoanTransactionTypeEnum {
  DISBURSEMENT = 'disbursement',
  REPAYMENT = 'repayment',
  FEE = 'fee',
  INTEREST_CHARGE = 'interest_charge',
  PENALTY_CHARGE = 'penalty_charge',
  ADJUSTMENT = 'adjustment',
}

export enum UserRoleEnum {
  USER = 'user',
  ADMIN = 'admin',
  AUDITOR = 'auditor', // Example of another role
}

export interface RiskAssessment {
  score: number;
  reasoning: string;
  recommendation: 'approve' | 'reject' | 'further_review';
  assessedBy?: string; // User ID of admin/AI who assessed
  assessedAt: string; // ISO Date string
}


// New type for a single repayment schedule entry
export interface LoanRepaymentScheduleEntry {
  period: number;
  dueDate: string; // ISO Date string
  startingBalance: number;
  principalComponent: number;
  interestComponent: number;
  endingBalance: number;
  paymentAmount: number; // EMI
  isPaid: boolean;
}

export interface LoanApplication {
  id: string; // Mongoose _id
  borrowerUserId: string | User; // string for ID, User object when populated
  guarantor?: Guarantor;

  applicationDate: string;
  requestedAmount: number;
  purpose: string;

  // New fields for financial profile
  monthlyIncome?: number; // Changed from income to monthlyIncome
  employmentStatus?: string;
  jobType?: string; // New field
  businessDescription?: string; // New field


  submittedCollateral: CollateralDocument[];

  status: LoanApplicationStatusEnum; // Use enum
  adminVerificationNotes?: string;
  adminAssignedTo?: string;

  approvedAmount?: number;
  interestRate?: number;
  interestType?: 'simple' | 'compound_monthly';
  repaymentFrequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  loanTermMonths?: number;
  processingFee?: number;
  otherCharges?: { description: string; amount: number }[];

  approvedDate?: string;
  disbursementDate?: string;
  firstPaymentDueDate?: string;
  maturityDate?: string;

  principalDisbursed: number;
  currentPrincipalOutstanding: number;
  currentInterestOutstanding: number;
  totalPrincipalRepaid: number;
  totalInterestRepaid: number;
  totalPenaltiesPaid: number;
  lastPaymentDate?: string;
  nextPaymentDueDate?: string;
  nextPaymentAmount?: number;

  // These fields will now directly store Cloudinary URLs
  borrowerIdProofDocumentUrl?: string;
  borrowerAddressProofDocumentUrl?: string;
  generalSupportingDocumentUrls?: string[]; // Array of URLs for general documents

  processedDocuments?: { name: string; dataUri: string }[]; // For AI flow primarily
  
  // New field for rejection details
  rejectionDetails?: RejectionReason; // Add this

  createdAt?: string;
  updatedAt?: string;

  // New field for generated repayment schedule
  repaymentSchedule?: LoanRepaymentScheduleEntry[];

  // New field for risk assessment
  riskAssessment?: RiskAssessment;
  
  // Derived fields (computed on server-side)
  totalRepayableAmount?: number;
  amountPaid?: number;
  balanceDue?: number;


  // For compatibility with old data structure in frontend (optional to keep)
  fullName?: string; // Derived from borrowerFullName or borrowerUserId.name
  email?: string; // Derived from borrowerEmail or borrowerUserId.email
  loanAmount?: number; // Derived from requestedAmount
  loanPurpose?: string; // Derived from purpose
  submittedDate?: string; // Derived from applicationDate
  income?: number; // Old name for monthlyIncome
}

export interface PaymentRecord {
  id: string;
  loanApplicationId: string;
  borrowerUserId: string;
  paymentDate: string; 
  amountPaid: number;
  type: LoanTransactionTypeEnum; // Use enum
  paymentMethod: 'cash' | 'online_transfer_upi' | 'online_transfer_neft' | 'cheque_deposit' | 'other'; // Added 'other'
  transactionReference?: string; 
  principalApplied: number;
  interestApplied: number;
  penaltyApplied?: number;
  notes?: string; 
  recordedByAdminId: string; 
  recordedAt: string; 
  isLatePayment?: boolean; // Added
  daysLate?: number; // Added
}

export enum NotificationTypeEnum {
  LOAN_APPLICATION_SUBMITTED = 'loan_application_submitted',
  LOAN_STATUS_UPDATED = 'loan_status_updated',
  PAYMENT_DUE_REMINDER = 'payment_due_reminder',
  PAYMENT_RECEIVED_CONFIRMATION = 'payment_received_confirmation',
  PAYMENT_OVERDUE_ALERT = 'payment_overdue_alert',
  DOCUMENT_REQUEST = 'document_request',
  GENERAL_ADMIN_ALERT = 'general_admin_alert',
  GENERAL_USER_INFO = 'general_user_info',
  LOAN_REJECTED_DETAILS = 'loan_rejected_details',
  LOAN_DISBURSED_CONFIRMATION = 'loan_disbursed_confirmation', // New type for disbursement confirmation
}


export interface SystemNotification {
  id: string;
  recipientUserId: string;
  loanApplicationId?: string;
  paymentRecordId?: string;
  message: string;
  type: NotificationTypeEnum; // Use enum
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
  // New fields to store rejection details in notification, for direct display
  rejectionReasonText?: string;
  rejectionReasonImageUrl?: string;
  rejectionReasonAudioUrl?: string;
}


// --- Existing types (can be reviewed/merged if needed) ---
export interface LoanApplicationData_Old {
  fullName: string;
  email: string;
  loanAmount: number;
  loanPurpose: string;
  income: number;
  employmentStatus: 'Employed' | 'Self-Employed' | 'Unemployed' | 'Student';
  creditScore?: number; // Made optional as in form
  supportingDocuments?: File[]; 
}

export interface LoanApplication_Old extends LoanApplicationData_Old {
  id: string;
  submittedDate: string; 
  status: LoanApplicationStatusOriginal;
  processedDocuments?: { name: string; dataUri: string }[]; 
}

export interface UserLoan {
  id: string; 
  loanType: string; 
  amount: number; 
  status: LoanApplicationStatusEnum; // Use enum
  nextPaymentDate?: string; 
  nextPaymentAmount?: number; 
}

export interface PaymentHistoryEntry {
  id: string; 
  loanId: string; 
  date: string; 
  amount: number; 
  status: 'Paid' | 'Missed' | 'Upcoming'; 
}

