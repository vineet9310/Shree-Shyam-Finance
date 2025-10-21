// src/lib/loan-calculations.ts
/**
 * Comprehensive Loan Calculation Utilities
 * Handles EMI calculation, interest computation, and repayment schedule generation
 * for Shree Shyam Finance platform
 */

import type { LoanRepaymentScheduleEntry } from './types';

/**
 * Calculate EMI (Equated Monthly Installment) for a loan
 * Formula: EMI = [P x R x (1+R)^N] / [(1+R)^N-1]
 * where:
 * P = Principal loan amount
 * R = Monthly interest rate (annual rate / 12 / 100)
 * N = Number of monthly installments
 */
export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number {
  if (principal <= 0 || tenureMonths <= 0) {
    return 0;
  }

  // If interest rate is 0, return simple division
  if (annualInterestRate === 0) {
    return principal / tenureMonths;
  }

  const monthlyRate = annualInterestRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  return parseFloat(emi.toFixed(2));
}

/**
 * Calculate simple interest
 * Formula: SI = (P × R × T) / 100
 */
export function calculateSimpleInterest(
  principal: number,
  annualInterestRate: number,
  timeInMonths: number
): number {
  const years = timeInMonths / 12;
  const interest = (principal * annualInterestRate * years) / 100;
  return parseFloat(interest.toFixed(2));
}

/**
 * Calculate compound interest (monthly compounding)
 * Formula: CI = P × (1 + R/12)^N - P
 */
export function calculateCompoundInterest(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number {
  const monthlyRate = annualInterestRate / 12 / 100;
  const compoundAmount = principal * Math.pow(1 + monthlyRate, tenureMonths);
  const interest = compoundAmount - principal;
  return parseFloat(interest.toFixed(2));
}

/**
 * Generate complete loan repayment schedule (Amortization Table)
 * This shows period-by-period breakdown of principal and interest
 */
export function generateRepaymentSchedule(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  startDate: Date,
  interestType: 'simple' | 'compound_monthly' = 'compound_monthly',
  repaymentFrequency: 'daily' | 'weekly' | 'monthly' = 'monthly'
): LoanRepaymentScheduleEntry[] {
  const schedule: LoanRepaymentScheduleEntry[] = [];

  if (principal <= 0 || tenureMonths <= 0) {
    return schedule;
  }

  let remainingBalance = principal;
  const monthlyRate = annualInterestRate / 12 / 100;

  // Calculate EMI for compound interest (reducing balance)
  const emiAmount = calculateEMI(principal, annualInterestRate, tenureMonths);

  // Calculate number of periods based on frequency
  let totalPeriods = tenureMonths;
  let periodIncrement = 1; // months
  let ratePerPeriod = monthlyRate;

  switch (repaymentFrequency) {
    case 'daily':
      totalPeriods = tenureMonths * 30; // Approximate
      periodIncrement = 1 / 30; // days to months
      ratePerPeriod = annualInterestRate / 365 / 100;
      break;
    case 'weekly':
      totalPeriods = Math.ceil((tenureMonths * 30) / 7); // Approximate weeks
      periodIncrement = 7 / 30; // weeks to months
      ratePerPeriod = annualInterestRate / 52 / 100;
      break;
    case 'monthly':
    default:
      totalPeriods = tenureMonths;
      periodIncrement = 1;
      ratePerPeriod = monthlyRate;
      break;
  }

  // Recalculate payment amount based on frequency
  let paymentAmount = emiAmount;
  if (repaymentFrequency === 'daily') {
    paymentAmount = calculateEMI(principal, annualInterestRate, totalPeriods);
  } else if (repaymentFrequency === 'weekly') {
    paymentAmount = calculateEMI(principal, annualInterestRate, totalPeriods);
  }

  for (let period = 1; period <= totalPeriods; period++) {
    const startingBalance = remainingBalance;

    // Calculate interest for this period
    let interestComponent: number;
    if (interestType === 'simple') {
      // For simple interest, distribute total interest evenly
      const totalSimpleInterest = calculateSimpleInterest(
        principal,
        annualInterestRate,
        tenureMonths
      );
      interestComponent = totalSimpleInterest / totalPeriods;
    } else {
      // Compound interest (reducing balance)
      interestComponent = startingBalance * ratePerPeriod;
    }

    // Principal component is payment minus interest
    let principalComponent = paymentAmount - interestComponent;

    // For the last payment, adjust to clear remaining balance
    if (period === totalPeriods || principalComponent >= remainingBalance) {
      principalComponent = remainingBalance;
      paymentAmount = principalComponent + interestComponent;
    }

    remainingBalance -= principalComponent;

    // Ensure no negative balances
    if (remainingBalance < 0) remainingBalance = 0;

    // Calculate due date based on frequency
    const dueDate = new Date(startDate);
    switch (repaymentFrequency) {
      case 'daily':
        dueDate.setDate(dueDate.getDate() + period);
        break;
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + period * 7);
        break;
      case 'monthly':
      default:
        dueDate.setMonth(dueDate.getMonth() + period);
        break;
    }

    schedule.push({
      period,
      dueDate: dueDate.toISOString(),
      startingBalance: parseFloat(startingBalance.toFixed(2)),
      principalComponent: parseFloat(principalComponent.toFixed(2)),
      interestComponent: parseFloat(interestComponent.toFixed(2)),
      endingBalance: parseFloat(remainingBalance.toFixed(2)),
      paymentAmount: parseFloat(paymentAmount.toFixed(2)),
      isPaid: false,
    });
  }

  return schedule;
}

/**
 * Calculate total amount payable (Principal + Interest)
 */
export function calculateTotalPayable(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  interestType: 'simple' | 'compound_monthly' = 'compound_monthly'
): number {
  if (interestType === 'simple') {
    const interest = calculateSimpleInterest(
      principal,
      annualInterestRate,
      tenureMonths
    );
    return principal + interest;
  } else {
    const emi = calculateEMI(principal, annualInterestRate, tenureMonths);
    return emi * tenureMonths;
  }
}

/**
 * Calculate total interest payable
 */
export function calculateTotalInterest(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  interestType: 'simple' | 'compound_monthly' = 'compound_monthly'
): number {
  const totalPayable = calculateTotalPayable(
    principal,
    annualInterestRate,
    tenureMonths,
    interestType
  );
  return totalPayable - principal;
}

/**
 * Calculate penalty for late payment
 * @param dueAmount - Amount that was due
 * @param daysLate - Number of days payment is late
 * @param dailyPenaltyRate - Daily penalty rate (default 0.5% = 0.005)
 */
export function calculateLatePenalty(
  dueAmount: number,
  daysLate: number,
  dailyPenaltyRate: number = 0.005
): number {
  const penalty = dueAmount * dailyPenaltyRate * daysLate;
  return parseFloat(penalty.toFixed(2));
}

/**
 * Calculate remaining balance after a payment
 */
export function calculateRemainingBalance(
  currentBalance: number,
  paymentAmount: number,
  interestRate: number
): { remainingPrincipal: number; interestPaid: number; principalPaid: number } {
  const monthlyRate = interestRate / 12 / 100;
  const interestPaid = currentBalance * monthlyRate;
  const principalPaid = paymentAmount - interestPaid;
  const remainingPrincipal = currentBalance - principalPaid;

  return {
    remainingPrincipal: parseFloat(Math.max(0, remainingPrincipal).toFixed(2)),
    interestPaid: parseFloat(interestPaid.toFixed(2)),
    principalPaid: parseFloat(Math.max(0, principalPaid).toFixed(2)),
  };
}

/**
 * Calculate processing fee (typically a percentage of loan amount)
 */
export function calculateProcessingFee(
  loanAmount: number,
  feePercentage: number = 2
): number {
  return parseFloat((loanAmount * (feePercentage / 100)).toFixed(2));
}

/**
 * Validate if a loan amount is within acceptable limits
 */
export function validateLoanAmount(
  amount: number,
  minAmount: number = 10000,
  maxAmount: number = 10000000
): { valid: boolean; message?: string } {
  if (amount < minAmount) {
    return {
      valid: false,
      message: `Loan amount must be at least ₹${minAmount.toLocaleString()}`,
    };
  }
  if (amount > maxAmount) {
    return {
      valid: false,
      message: `Loan amount cannot exceed ₹${maxAmount.toLocaleString()}`,
    };
  }
  return { valid: true };
}

/**
 * Calculate loan affordability based on income
 * DTI (Debt-to-Income) ratio should ideally be below 40%
 */
export function calculateAffordability(
  monthlyIncome: number,
  emiAmount: number,
  existingEMIs: number = 0
): {
  affordable: boolean;
  dtiRatio: number;
  maxAffordableEMI: number;
  message: string;
} {
  const totalEMI = emiAmount + existingEMIs;
  const dtiRatio = (totalEMI / monthlyIncome) * 100;
  const maxAffordableEMI = monthlyIncome * 0.4; // 40% DTI threshold

  const affordable = totalEMI <= maxAffordableEMI;

  return {
    affordable,
    dtiRatio: parseFloat(dtiRatio.toFixed(2)),
    maxAffordableEMI: parseFloat(maxAffordableEMI.toFixed(2)),
    message: affordable
      ? 'Loan is affordable based on income'
      : `EMI exceeds 40% of monthly income. Maximum affordable EMI: ₹${maxAffordableEMI.toFixed(
          0
        )}`,
  };
}

/**
 * Get recommended loan terms based on amount and income
 */
export function getRecommendedLoanTerms(
  loanAmount: number,
  monthlyIncome: number,
  annualInterestRate: number = 12
): {
  minTenure: number;
  maxTenure: number;
  recommendedTenure: number;
  emiAtRecommended: number;
} {
  const maxAffordableEMI = monthlyIncome * 0.35; // Conservative 35%

  // Calculate minimum tenure (EMI shouldn't exceed max affordable)
  let minTenure = 1;
  while (minTenure < 360) {
    // Max 30 years
    const emi = calculateEMI(loanAmount, annualInterestRate, minTenure);
    if (emi <= maxAffordableEMI) break;
    minTenure++;
  }

  // Typical max tenure for personal loans
  const maxTenure = 60; // 5 years

  // Recommended tenure - balance between affordability and total interest
  const recommendedTenure = Math.min(
    Math.max(minTenure, 12),
    maxTenure
  ); // At least 1 year
  const emiAtRecommended = calculateEMI(
    loanAmount,
    annualInterestRate,
    recommendedTenure
  );

  return {
    minTenure,
    maxTenure,
    recommendedTenure,
    emiAtRecommended,
  };
}

/**
 * Calculate loan summary for display
 */
export function calculateLoanSummary(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  interestType: 'simple' | 'compound_monthly' = 'compound_monthly',
  processingFeePercentage: number = 2
) {
  const emi = calculateEMI(principal, annualInterestRate, tenureMonths);
  const totalInterest = calculateTotalInterest(
    principal,
    annualInterestRate,
    tenureMonths,
    interestType
  );
  const totalPayable = principal + totalInterest;
  const processingFee = calculateProcessingFee(principal, processingFeePercentage);
  const netDisbursement = principal - processingFee;

  return {
    principal: parseFloat(principal.toFixed(2)),
    emi: parseFloat(emi.toFixed(2)),
    tenure: tenureMonths,
    interestRate: annualInterestRate,
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    totalPayable: parseFloat(totalPayable.toFixed(2)),
    processingFee: parseFloat(processingFee.toFixed(2)),
    netDisbursement: parseFloat(netDisbursement.toFixed(2)),
  };
}
