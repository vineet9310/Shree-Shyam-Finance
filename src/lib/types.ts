
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
  idProofDocumentUrl?: string;
  addressProofType?: string;
  addressProofDocumentUrl?: string;
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
  // id: string; // Mongoose will handle _id if this becomes a sub-document or its own model
  // loanApplicationId: string; 
  fullName: string;
  address: string;
  contactNo: string;
  idProofType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport' | 'other';
  idProofDocumentUrl?: string; // Made optional for frontend type, backend model handles storage
  idProofDocument?: File | {name: string, type: string, size: number}; // For form state
  idProofOtherDetails?: string;
  addressProofType: 'aadhaar' | 'utility_bill' | 'rent_agreement' | 'passport' | 'other';
  addressProofDocumentUrl?: string; // Made optional
  addressProofDocument?: File | {name: string, type: string, size: number}; // For form state
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
  // id: string; // Mongoose will handle _id
  // loanApplicationId: string;
  type: CollateralType;
  description: string; 

  atmPin?: string; 
  atmCardFrontImageUrl?: string; 
  atmCardBackImageUrl?: string;  
  // File objects for form state, URLs for stored data
  atmCardFrontImage?: File | {name: string, type: string, size: number};
  atmCardBackImage?: File | {name: string, type: string, size: number};


  chequeImageUrl?: string; 
  chequeImage?: File | {name: string, type: string, size: number};
  chequeNumber?: string;
  chequeBankName?: string;

  bankStatementUrl?: string; 
  bankStatementFile?: File | {name: string, type: string, size: number};

  vehicleRcImageUrl?: string;
  vehicleRcImage?: File | {name: string, type: string, size: number};
  vehicleImageUrl?: string; 
  vehicleImage?: File | {name: string, type: string, size: number};
  vehicleChallanDetails?: string; 
  vehiclePapersUrl?: string;

  propertyPapersUrl?: string; 
  propertyPapersFile?: File | {name: string, type: string, size: number};
  propertyImageUrl?: string; 
  propertyImage?: File | {name: string, type: string, size: number};

  assetDetails?: string; 
  assetImageUrl?: string;
  assetImage?: File | {name: string, type: string, size: number};

  estimatedValue?: number;
  documentUrls?: string[]; 
  notes?: string;
  additionalDocuments?: (File | {name: string, type: string, size: number})[]; // for form
}

export type LoanApplicationStatus =
  | 'QueryInitiated'         
  | 'PendingAdminVerification' 
  | 'AdditionalInfoRequired' 
  | 'Approved'               
  | 'Rejected'               
  | 'Active'                 
  | 'PaidOff'                
  | 'Overdue'                
  | 'Defaulted';             

export interface LoanApplication {
  id: string; // Mongoose _id
  borrowerUserId: string | User; // string for ID, User object when populated
  guarantor?: Guarantor; 
  
  applicationDate: string; 
  requestedAmount: number;
  purpose: string;
  
  submittedCollateral: CollateralDocument[];
  
  status: LoanApplicationStatus;
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
  
  // Representing document names/placeholders from form for initial backend storage
  // These are temporary until full file upload logic is in place.
  borrowerIdProofDocumentName?: string;
  borrowerAddressProofDocumentName?: string;
  // Add more such fields for guarantor and collateral documents if needed for Mongoose schema

  processedDocuments?: { name: string; dataUri: string }[]; // For AI flow primarily

  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  loanApplicationId: string;
  borrowerUserId: string;
  paymentDate: string; 
  amountPaid: number;
  paymentMethod: 'cash' | 'online_transfer_upi' | 'online_transfer_neft' | 'cheque_deposit';
  transactionReference?: string; 
  principalApplied: number;
  interestApplied: number;
  penaltyApplied?: number;
  notes?: string; 
  recordedByAdminId: string; 
  recordedAt: string; 
}

export interface SystemNotification {
  id: string;
  recipientUserId: string; 
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
  createdAt: string; 
  linkTo?: string; 
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
  status: LoanApplicationStatus; 
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
