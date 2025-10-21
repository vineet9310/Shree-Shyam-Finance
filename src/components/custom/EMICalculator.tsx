// src/components/custom/EMICalculator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { calculateEMI, calculateTotalInterest, calculateTotalPayable } from '@/lib/loan-calculations';
import { INTEREST_RATES, LOAN_LIMITS } from '@/lib/constants';

interface EMICalculatorProps {
  onCalculate?: (emi: number, totalInterest: number, totalAmount: number) => void;
  defaultAmount?: number;
  defaultTenure?: number;
  defaultInterestRate?: number;
}

export default function EMICalculator({ 
  onCalculate, 
  defaultAmount = 100000,
  defaultTenure = 12,
  defaultInterestRate = INTEREST_RATES.PERSONAL_LOAN_DEFAULT 
}: EMICalculatorProps) {
  const [loanAmount, setLoanAmount] = useState(defaultAmount);
  const [tenure, setTenure] = useState(defaultTenure);
  const [interestRate, setInterestRate] = useState(defaultInterestRate);
  
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const calculatedEMI = calculateEMI(loanAmount, interestRate, tenure);
    const calculatedTotalInterest = calculateTotalInterest(loanAmount, interestRate, tenure);
    const calculatedTotalAmount = calculateTotalPayable(loanAmount, interestRate, tenure);

    setEmi(calculatedEMI);
    setTotalInterest(calculatedTotalInterest);
    setTotalAmount(calculatedTotalAmount);

    if (onCalculate) {
      onCalculate(calculatedEMI, calculatedTotalInterest, calculatedTotalAmount);
    }
  }, [loanAmount, tenure, interestRate, onCalculate]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>EMI Calculator</CardTitle>
        <CardDescription>Calculate your monthly installment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loan Amount */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label htmlFor="loan-amount">Loan Amount</Label>
            <span className="text-sm font-semibold">₹{loanAmount.toLocaleString('en-IN')}</span>
          </div>
          <Slider
            id="loan-amount"
            min={LOAN_LIMITS.MIN_AMOUNT}
            max={LOAN_LIMITS.MAX_AMOUNT}
            step={10000}
            value={[loanAmount]}
            onValueChange={(value) => setLoanAmount(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹{LOAN_LIMITS.MIN_AMOUNT.toLocaleString('en-IN')}</span>
            <span>₹{LOAN_LIMITS.MAX_AMOUNT.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Tenure */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label htmlFor="tenure">Loan Tenure</Label>
            <span className="text-sm font-semibold">{tenure} months ({(tenure / 12).toFixed(1)} years)</span>
          </div>
          <Slider
            id="tenure"
            min={LOAN_LIMITS.MIN_TENURE_MONTHS}
            max={LOAN_LIMITS.MAX_TENURE_MONTHS}
            step={1}
            value={[tenure]}
            onValueChange={(value) => setTenure(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{LOAN_LIMITS.MIN_TENURE_MONTHS} months</span>
            <span>{LOAN_LIMITS.MAX_TENURE_MONTHS} months</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label htmlFor="interest-rate">Interest Rate (p.a.)</Label>
            <span className="text-sm font-semibold">{interestRate}%</span>
          </div>
          <Slider
            id="interest-rate"
            min={INTEREST_RATES.PERSONAL_LOAN_MIN}
            max={INTEREST_RATES.PERSONAL_LOAN_MAX}
            step={0.5}
            value={[interestRate]}
            onValueChange={(value) => setInterestRate(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{INTEREST_RATES.PERSONAL_LOAN_MIN}%</span>
            <span>{INTEREST_RATES.PERSONAL_LOAN_MAX}%</span>
          </div>
        </div>

        {/* Results */}
        <div className="pt-4 border-t space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Monthly EMI</p>
              <p className="text-2xl font-bold text-primary">₹{emi.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Interest</p>
              <p className="text-2xl font-bold text-orange-600">₹{totalInterest.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Amount Payable</p>
            <p className="text-3xl font-bold text-green-700">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Principal Amount:</span>
              <span className="font-semibold">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Interest:</span>
              <span className="font-semibold text-orange-600">₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total Payable:</span>
              <span className="font-bold text-green-700">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Visual Breakdown */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Payment Breakdown</p>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500" 
                style={{ width: `${(loanAmount / totalAmount) * 100}%` }}
                title={`Principal: ${((loanAmount / totalAmount) * 100).toFixed(1)}%`}
              />
              <div 
                className="bg-orange-500" 
                style={{ width: `${(totalInterest / totalAmount) * 100}%` }}
                title={`Interest: ${((totalInterest / totalAmount) * 100).toFixed(1)}%`}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
                Principal ({((loanAmount / totalAmount) * 100).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-orange-500 rounded-sm"></span>
                Interest ({((totalInterest / totalAmount) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
