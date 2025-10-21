// src/lib/constants.ts

export const APP_NAME = "Shree Shyam Finance";

// ========== LOAN CONFIGURATION ==========

// Interest Rates (Annual %)
export const INTEREST_RATES = {
  PERSONAL_LOAN_MIN: 10,
  PERSONAL_LOAN_MAX: 18,
  PERSONAL_LOAN_DEFAULT: 12,
  BUSINESS_LOAN_MIN: 12,
  BUSINESS_LOAN_MAX: 20,
  BUSINESS_LOAN_DEFAULT: 15,
  SECURED_LOAN_MIN: 8,
  SECURED_LOAN_MAX: 15,
  SECURED_LOAN_DEFAULT: 10,
};

// Loan Amount Limits (INR)
export const LOAN_LIMITS = {
  MIN_AMOUNT: 10000,
  MAX_AMOUNT: 10000000, // 1 Crore
  MIN_TENURE_MONTHS: 3,
  MAX_TENURE_MONTHS: 60, // 5 years
  DEFAULT_TENURE_MONTHS: 12,
};

// Processing Fees & Charges
export const FEES = {
  PROCESSING_FEE_PERCENTAGE: 2, // 2% of loan amount
  LATE_PAYMENT_PENALTY_RATE: 0.005, // 0.5% per day
  PREPAYMENT_CHARGES_PERCENTAGE: 2, // 2% if closed before 6 months
  BOUNCE_CHARGES: 500, // INR 500 for bounced payments
};

// Loan Eligibility Criteria
export const ELIGIBILITY = {
  MIN_CREDIT_SCORE: 550,
  RECOMMENDED_CREDIT_SCORE: 700,
  MAX_DTI_RATIO: 40, // Debt-to-Income ratio %
  MIN_MONTHLY_INCOME: 15000, // INR 15,000
  MIN_AGE: 21,
  MAX_AGE: 65,
};

// Payment Configuration
export const PAYMENT_CONFIG = {
  REMINDER_DAYS_BEFORE_DUE: 3,
  OVERDUE_GRACE_PERIOD_DAYS: 3,
  AUTO_DEFAULT_AFTER_DAYS: 90,
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  APPLY_LOAN: "/apply-loan",
  ADMIN_DASHBOARD: "/admin",
  ADMIN_APPLICATION_DETAIL: (id: string) => `/admin/applications/${id}`,
  ADMIN_USERS: "/admin/users",
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}`,
  ADMIN_PAYMENT_VERIFICATIONS: "/admin/payment-verifications",
  USER_APPLICATION_DETAIL: (id: string) => `/dashboard/application/${id}`, 
  FORGOT_PASSWORD: '/forgot-password',
};

// Notification Messages Templates
export const NOTIFICATION_TEMPLATES = {
  LOAN_APPROVED: (amount: number, purpose: string) =>
    `Congratulations! Your loan application for ₹${amount.toLocaleString()} for ${purpose} has been approved.`,
  LOAN_REJECTED: (purpose: string) =>
    `We regret to inform you that your loan application for ${purpose} has been rejected.`,
  LOAN_DISBURSED: (amount: number) =>
    `Your loan amount of ₹${amount.toLocaleString()} has been disbursed to your account.`,
  PAYMENT_DUE: (amount: number, dueDate: string) =>
    `Payment of ₹${amount.toLocaleString()} is due on ${dueDate}.`,
  PAYMENT_RECEIVED: (amount: number) =>
    `We have received your payment of ₹${amount.toLocaleString()}.`,
  PAYMENT_OVERDUE: (amount: number, daysLate: number) =>
    `Your payment of ₹${amount.toLocaleString()} is overdue by ${daysLate} days. Please pay immediately to avoid penalties.`,
  LOAN_PAID_OFF: () =>
    `Congratulations! Your loan has been fully paid off.`,
};

// Status Display Configurations
export const STATUS_CONFIG = {
  QueryInitiated: {
    label: 'Query Initiated',
    color: 'bg-blue-100 text-blue-800',
    icon: '📝',
  },
  PendingAdminVerification: {
    label: 'Pending Verification',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
  },
  AdditionalInfoRequired: {
    label: 'Additional Info Required',
    color: 'bg-orange-100 text-orange-800',
    icon: '❓',
  },
  Approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  Rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
  },
  Active: {
    label: 'Active',
    color: 'bg-blue-100 text-blue-800',
    icon: '💰',
  },
  Disbursed: {
    label: 'Disbursed',
    color: 'bg-cyan-100 text-cyan-800',
    icon: '💸',
  },
  PaidOff: {
    label: 'Paid Off',
    color: 'bg-green-100 text-green-800',
    icon: '🎉',
  },
  Overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-800',
    icon: '⚠️',
  },
  Defaulted: {
    label: 'Defaulted',
    color: 'bg-gray-100 text-gray-800',
    icon: '🚫',
  },
};

