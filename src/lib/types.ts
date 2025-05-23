
export type LoanApplicationStatusOriginal = 'Pending' | 'Approved' | 'Rejected' | 'Under Review';

// --- New Detailed Types for Lending Application ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin'; // 'user' here means borrower
  borrowerProfileId?: string; // Link to detailed borrower profile
}

export interface BorrowerProfile {
  id: string;
  userId: string; // Link back to the main User ID
  fullName: string; // May differ from user.name if admin edits
  address: string;
  contactNo: string;
  idProofType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport' | 'other';
  idProofDocumentUrl: string; // URL to stored document (e.g., data URI or cloud storage link)
  idProofOtherDetails?: string; // If idProofType is 'other'
  addressProofType: 'aadhaar' | 'utility_bill' | 'rent_agreement' | 'passport' | 'other';
  addressProofDocumentUrl: string;
  addressProofOtherDetails?: string; // If addressProofType is 'other'
  // Additional fields admin might want to store about a borrower
  occupation?: string;
  notes?: string; // Admin notes about the borrower
}

export interface Guarantor {
  id: string;
  loanApplicationId: string; // Which loan application this guarantor is for
  fullName: string;
  address: string;
  contactNo: string;
  idProofType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport' | 'other';
  idProofDocumentUrl: string;
  idProofOtherDetails?: string;
  addressProofType: 'aadhaar' | 'utility_bill' | 'rent_agreement' | 'passport' | 'other';
  addressProofDocumentUrl: string;
  addressProofOtherDetails?: string;
  relationshipToBorrower?: string;
}

export type CollateralType =
  | 'atm_card'
  | 'blank_cheque'
  | 'bank_statement' // 3 months
  | 'vehicle_bike'
  | 'vehicle_car'
  | 'vehicle_scooty'
  | 'property_house'
  | 'property_land'
  | 'gold_jewelry'
  | 'other_asset';

export interface CollateralDocument {
  id: string;
  loanApplicationId: string;
  type: CollateralType;
  description: string; // e.g., "SBI ATM Card ending XXXX" or "Bajaj Pulsar 150" or "2 Bigha Land in Village X"

  // Specific fields based on type
  // WARNING: Storing ATM PIN is a major security risk. Consider alternatives.
  atmPin?: string;
  atmCardFrontImageUrl?: string; // data URI or cloud storage link
  atmCardBackImageUrl?: string;  // data URI or cloud storage link

  chequeImageUrl?: string; // Image of the blank cheque
  chequeNumber?: string;
  chequeBankName?: string;

  bankStatementUrl?: string; // For 3 months statement

  vehicleRcImageUrl?: string;
  vehicleImageUrl?: string; // Photo of the vehicle
  vehicleChallanDetails?: string; // Any outstanding challans
  vehiclePapersUrl?: string; // Other vehicle documents

  propertyPapersUrl?: string; // Deed, Khatauni, etc.
  propertyImageUrl?: string; // Photo of the property

  assetDetails?: string; // For gold, other assets
  assetImageUrl?: string;

  // Common fields
  estimatedValue?: number;
  documentUrls?: string[]; // For multiple related files for one collateral item
  notes?: string;
}

export type LoanApplicationStatus =
  | 'QueryInitiated'         // Borrower submitted initial query
  | 'PendingAdminVerification' // Admin is reviewing documents and details
  | 'AdditionalInfoRequired' // Admin needs more info from borrower
  | 'Approved'               // Loan approved by admin
  | 'Rejected'               // Loan rejected by admin
  | 'Active'                 // Loan disbursed and ongoing
  | 'PaidOff'                // Loan fully repaid
  | 'Overdue'                // Payments are overdue
  | 'Defaulted';             // Loan is in default

export interface LoanApplication {
  id: string;
  borrowerUserId: string; // Links to User.id
  guarantor?: Guarantor; // Guarantor details embedded or linked by ID
  
  applicationDate: string; // ISO date string
  requestedAmount: number;
  purpose: string;
  
  // Collateral submitted by user
  submittedCollateral: CollateralDocument[];
  
  // Admin assessment fields
  status: LoanApplicationStatus;
  adminVerificationNotes?: string;
  adminAssignedTo?: string; // Admin user ID who is handling this
  
  // Approved loan terms (set by admin)
  approvedAmount?: number;
  interestRate?: number; // Annual percentage, e.g., 24 for 24% p.a.
  interestType?: 'simple' | 'compound_monthly'; // How interest is calculated
  repaymentFrequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  loanTermMonths?: number; // Duration in months
  processingFee?: number;
  otherCharges?: { description: string; amount: number }[];
  
  // Dates
  approvedDate?: string; // ISO date string
  disbursementDate?: string; // ISO date string
  firstPaymentDueDate?: string; // ISO date string
  maturityDate?: string; // Expected loan end date
  
  // Financial Tracking (calculated and updated regularly)
  principalDisbursed: number;
  currentPrincipalOutstanding: number;
  currentInterestOutstanding: number;
  totalPrincipalRepaid: number;
  totalInterestRepaid: number;
  totalPenaltiesPaid: number;
  lastPaymentDate?: string;
  nextPaymentDueDate?: string;
  nextPaymentAmount?: number; // EMI or scheduled payment
  
  // Supporting documents from original LoanApplicationData, can be kept if distinct
  // from collateral. For simplicity, new collateral type covers most.
  // This 'processedDocuments' was more for the AI flow, might evolve.
  processedDocuments?: { name: string; dataUri: string }[];
}

export interface PaymentRecord {
  id: string;
  loanApplicationId: string;
  borrowerUserId: string;
  paymentDate: string; // ISO date string
  amountPaid: number;
  paymentMethod: 'cash' | 'online_transfer_upi' | 'online_transfer_neft' | 'cheque_deposit';
  transactionReference?: string; // For online/cheque
  principalApplied: number;
  interestApplied: number;
  penaltyApplied?: number;
  notes?: string; // e.g., "Payment for March EMI"
  recordedByAdminId: string; // Admin who recorded this payment
  recordedAt: string; // ISO date string
}

export interface SystemNotification {
  id: string;
  recipientUserId: string; // Borrower or Admin User.id
  loanApplicationId?: string;
  paymentRecordId?: string;
  message: string;
  type:
    | 'loan_application_submitted'
    | 'loan_status_updated'
    | 'payment_due_reminder'
    | 'payment_received_confirmation'
    | 'payment_overdue_alert'
    | 'document_request'
    | 'general_admin_alert'
    | 'general_user_info';
  isRead: boolean;
  createdAt: string; // ISO date string
  linkTo?: string; // e.g., `/admin/applications/[id]` or `/dashboard/loans/[id]`
}


// --- Existing types (can be reviewed/merged if needed) ---

// This was the original type for loan application, now superceded by the more detailed LoanApplication.
// Keep for reference or if parts are still used by AI flow directly, but aim to consolidate.
export interface LoanApplicationData_Old {
  fullName: string;
  email: string;
  loanAmount: number;
  loanPurpose: string;
  income: number;
  employmentStatus: 'Employed' | 'Self-Employed' | 'Unemployed' | 'Student';
  creditScore: number;
  supportingDocuments?: File[]; // These are File objects, client-side
}

// This was the extended version for mock data.
export interface LoanApplication_Old extends LoanApplicationData_Old {
  id: string;
  submittedDate: string; // ISO date string
  status: LoanApplicationStatusOriginal;
  processedDocuments?: { name: string; dataUri: string }[]; // For AI flow
}

export interface UserLoan {
  id: string; // Corresponds to LoanApplication.id
  loanType: string; // Corresponds to LoanApplication.purpose or a summary
  amount: number; // Corresponds to LoanApplication.approvedAmount
  status: LoanApplicationStatus; // From LoanApplication.status
  nextPaymentDate?: string; // ISO date string, from LoanApplication.nextPaymentDueDate
  nextPaymentAmount?: number; // From LoanApplication.nextPaymentAmount
}

export interface PaymentHistoryEntry {
  id: string; // Corresponds to PaymentRecord.id
  loanId: string; // Corresponds to PaymentRecord.loanApplicationId
  date: string; // ISO date string, from PaymentRecord.paymentDate
  amount: number; // From PaymentRecord.amountPaid
  status: 'Paid' | 'Missed' | 'Upcoming'; // This status might need to be derived or a new field.
}
