export type LoanApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Under Review';

export interface LoanApplicationData {
  fullName: string;
  email: string;
  loanAmount: number;
  loanPurpose: string;
  income: number;
  employmentStatus: 'Employed' | 'Self-Employed' | 'Unemployed' | 'Student';
  creditScore: number;
  supportingDocuments?: File[];
}

export interface LoanApplication extends LoanApplicationData {
  id: string;
  submittedDate: string; // ISO date string
  status: LoanApplicationStatus;
  // For AI flow, documents are stored as { name: string, dataUri: string }
  processedDocuments?: { name: string; dataUri: string }[];
}


export interface UserLoan {
  id: string;
  loanType: string;
  amount: number;
  status: LoanApplicationStatus;
  nextPaymentDate?: string; // ISO date string
  nextPaymentAmount?: number;
}

export interface PaymentHistoryEntry {
  id: string;
  loanId: string;
  date: string; // ISO date string
  amount: number;
  status: 'Paid' | 'Missed' | 'Upcoming';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}
