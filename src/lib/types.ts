// src/lib/types.ts

import type mongoose from 'mongoose';

export type LoanApplicationStatusOriginal = 'Pending' | 'Approved' | 'Rejected' | 'Under Review';

// --- New Detailed Types for Lending Application ---

export interface User {
  id: string; // Corresponds to Mongoose _id
  email: string;
  name: string;
  role: 'user' | 'admin';
  borrowerProfileId?: string; 
  contactNo?: string;
  address?: string;
  idProofType?: string;
  idProofDocumentUrl?: string; 
  addressProofType?: string;
  addressProofDocumentUrl?: string; 
  passwordHash?: string; 
  createdAt?: string; 
  updatedAt?: string; 
  // Added from detailed loan application form if user model is updated
  monthlyIncome?: number;
  employmentStatus?: string;
  jobType?: string;
  businessDescription?: string;
  creditScore?: number;
}

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
  idProofDocumentUrl?: string; 
  idProofDocument?: string; 
  idProofOtherDetails?: string;
  addressProofType: 'aadhaar' | 'utility_bill' | 'rent_agreement' | 'passport' | 'other';
  addressProofDocumentUrl?: string; 
  addressProofDocument?: string; 
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
  atmCardFrontImageUrl?: string; 
  atmCardBackImageUrl?: string;  
  atmCardFrontImage?: string; 
  atmCardBackImage?: string; 

  chequeImageUrl?: string; 
  chequeImage?: string; 
  chequeNumber?: string;
  chequeBankName?: string;

  bankStatementUrl?: string; 
  bankStatementFile?: string; 

  vehicleRcImageUrl?: string; 
  vehicleRcImage?: string; 
  vehicleImageUrl?: string; 
  vehicleImage?: string; 
  vehicleChallanDetails?: string;
  vehiclePapersUrl?: string; 

  propertyPapersUrl?: string; 
  propertyPapersFile?: string; 
  propertyImageUrl?: string; 
  propertyImage?: string; 

  assetDetails?: string;
  assetImageUrl?: string; 
  assetImage?: string; 

  estimatedValue?: number;
  documentUrls?: string[]; 
  notes?: string;
  additionalDocuments?: string[]; 
}

export interface RejectionReason {
  text?: string;
  imageUrl?: string; 
  audioUrl?: string; 
  adminId?: string; 
  rejectedAt?: string; 
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
  SUBMITTED = 'Submitted', 
  DISBURSED = 'Disbursed', 
}

// Type alias for string values
export type LoanApplicationStatus = 'QueryInitiated' | 'PendingAdminVerification' | 'AdditionalInfoRequired' | 'Approved' | 'Rejected' | 'Active' | 'PaidOff' | 'Overdue' | 'Defaulted' | 'Submitted' | 'Disbursed';

// Define LoanTransactionVerificationStatusEnum here
export enum LoanTransactionVerificationStatusEnum {
  PENDING_VERIFICATION = 'pending_verification', // User submitted, admin needs to check
  ADMIN_VERIFIED_PAID = 'admin_verified_paid',     // Admin confirmed payment received
  ADMIN_REJECTED_PROOF = 'admin_rejected_proof',   // Admin rejected the proof submitted by user
  SYSTEM_RECORDED = 'system_recorded',         // Payment directly recorded by admin (old flow)
}


export enum LoanTransactionTypeEnum {
  DISBURSEMENT = 'disbursement',
  REPAYMENT = 'repayment',
  FEE = 'fee',
  INTEREST_CHARGE = 'interest_charge',
  PENALTY_CHARGE = 'penalty_charge',
  ADJUSTMENT = 'adjustment',
  USER_SUBMITTED_PAYMENT = 'user_submitted_payment', 
}

export enum UserRoleEnum {
  USER = 'user',
  ADMIN = 'admin',
  AUDITOR = 'auditor', 
}

export interface RiskAssessment {
  score: number;
  reasoning: string;
  recommendation: 'approve' | 'reject' | 'further_review';
  assessedBy?: string; 
  assessedAt: string; 
}


export interface LoanRepaymentScheduleEntry {
  period: number;
  dueDate: string; 
  startingBalance: number;
  principalComponent: number;
  interestComponent: number;
  endingBalance: number;
  paymentAmount: number; 
  isPaid: boolean;
}

export interface LoanApplication {
  id: string; 
  borrowerUserId: string | User; 
  guarantor?: Guarantor;

  applicationDate: string;
  requestedAmount: number;
  purpose: string;

  monthlyIncome?: number; 
  employmentStatus?: string;
  jobType?: string; 
  businessDescription?: string; 


  submittedCollateral: CollateralDocument[];

  status: LoanApplicationStatusEnum; 
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
  lastReminderSentDate?: string; // Track when last reminder was sent

  borrowerIdProofDocumentUrl?: string;
  borrowerAddressProofDocumentUrl?: string;
  generalSupportingDocumentUrls?: string[]; 

  processedDocuments?: { name: string; dataUri: string }[]; 
  
  rejectionDetails?: RejectionReason; 

  createdAt?: string;
  updatedAt?: string;

  repaymentSchedule?: LoanRepaymentScheduleEntry[];

  riskAssessment?: RiskAssessment;
  
  totalRepayableAmount?: number;
  amountPaid?: number;
  balanceDue?: number;

  fullName?: string; 
  email?: string; 
  loanAmount?: number; 
  loanPurpose?: string; 
  submittedDate?: string; 
  income?: number; 
  // Fields from User model for convenience, if populated
  borrowerFullName?: string;
  borrowerEmail?: string;
  borrowerContactNo?: string;
  borrowerAddress?: string;
  borrowerIdProofType?: string;
  borrowerAddressProofType?: string;
  creditScore?: number; 
  applicationId?: string; 
  adminRemarks?: string; 
}

export interface PaymentRecord {
  id: string;
  loanApplicationId: string;
  borrowerUserId: string;
  paymentDate: string; 
  amountPaid: number;
  type: LoanTransactionTypeEnum; 
  paymentMethod: 'cash' | 'online_transfer_upi' | 'online_transfer_neft' | 'cheque_deposit' | 'other' | 'online'; 
  transactionReference?: string; 
  principalApplied: number;
  interestApplied: number;
  penaltyApplied?: number;
  notes?: string; 
  recordedByAdminId?: string;  
  submittedByUserId?: string; 
  userSubmittedScreenshotUrl?: string;
  verificationStatus?: LoanTransactionVerificationStatusEnum; // Using new enum
  adminVerifierId?: string;
  adminVerificationTimestamp?: string;
  adminVerificationNotes?: string;
  recordedAt: string; 
  isLatePayment?: boolean; 
  daysLate?: number; 
}

export enum NotificationTypeEnum {
  LOAN_APPLICATION_SUBMITTED = 'loan_application_submitted',
  LOAN_STATUS_UPDATED = 'loan_status_updated',
  PAYMENT_DUE_REMINDER = 'payment_due_reminder',
  PAYMENT_RECEIVED_CONFIRMATION = 'payment_received_confirmation',
  PAYMENT_OVERDUE_ALERT = 'payment_overdue_alert',
  LOAN_DEFAULT_ALERT = 'loan_default_alert',
  DOCUMENT_REQUEST = 'document_request',
  GENERAL_ADMIN_ALERT = 'general_admin_alert',
  GENERAL_USER_INFO = 'general_user_info',
  LOAN_REJECTED_DETAILS = 'loan_rejected_details',
  LOAN_DISBURSED_CONFIRMATION = 'loan_disbursed_confirmation',
  // New notification types for user payment submission flow
  USER_PAYMENT_SUBMITTED_FOR_VERIFICATION = 'user_payment_submitted_for_verification', // To admin
  PAYMENT_SUBMISSION_RECEIVED = 'payment_submission_received',                         // To user
  PAYMENT_CONFIRMED_BY_ADMIN = 'payment_confirmed_by_admin',                           // To user
  PAYMENT_VERIFICATION_FAILED = 'payment_verification_failed',                         // To user
  LOAN_APPROVED = 'loan_approved', 
  LOAN_REJECTED = 'loan_rejected', 
  QUERY_RAISED = 'query_raised', 
}


export interface SystemNotification {
  id: string;
  recipientUserId: string;
  loanApplicationId?: string;
  paymentRecordId?: string; // refers to LoanTransaction id
  message: string;
  type: NotificationTypeEnum; 
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
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
  creditScore?: number; 
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
  status: LoanApplicationStatusEnum; 
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

// Additional type aliases for compatibility
export type ILoanApplication = LoanApplication;
export type ILoanTransaction = PaymentRecord;
export type IUser = User;
