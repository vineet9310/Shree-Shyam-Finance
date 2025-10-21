# Shree Shyam Finance - Complete Loan Management System

## 🏦 Overview
Shree Shyam Finance is a comprehensive digital lending platform where users can apply for loans and you (the admin) can manage loan applications, disburse funds, collect payments, and earn interest on loans.

## 💰 Business Model - How You Earn Money

### Interest Income
- **Primary Revenue Source**: Interest on disbursed loans
- **Default Interest Rate**: 12% per annum (configurable 10-18%)
- **Interest Calculation**: Compound interest (reducing balance method)
- **Example**: 
  - Loan Amount: ₹1,00,000
  - Interest Rate: 12% p.a.
  - Tenure: 12 months
  - **Monthly EMI**: ₹8,885
  - **Total Interest Earned**: ₹6,616
  - **Total Amount Recovered**: ₹1,06,616

### Additional Income Sources
1. **Processing Fees**: 2% of loan amount (deducted upfront)
   - Example: ₹1,00,000 loan = ₹2,000 processing fee
2. **Late Payment Penalties**: 0.5% per day on overdue amounts
   - Example: ₹10,000 overdue for 10 days = ₹500 penalty
3. **Prepayment Charges**: 2% if loan closed before 6 months

## 📊 Complete Loan Lifecycle

### Stage 1: Application Submission
**User Actions:**
- User registers/logs in to the platform
- Fills loan application form with:
  - Personal details (name, contact, address)
  - Financial profile (monthly income, employment status)
  - Loan details (amount, purpose, tenure)
  - Documents (ID proof, address proof, income proof)
  - Collateral documents (if applicable)
  - Guarantor information (if applicable)

**System Actions:**
- Creates loan application with status: `QueryInitiated`
- Stores all documents in Cloudinary
- Sends notification to admin
- User can see application in their dashboard

### Stage 2: Admin Verification
**Admin Actions:**
- Reviews application in admin dashboard at `/admin`
- Checks all submitted documents
- Verifies user's financial profile
- Can use AI Risk Assessment tool for decision support
- Options:
  - **Approve**: Set loan terms and approve
  - **Reject**: Provide reason (text/image/audio)
  - **Request More Info**: Ask for additional documents

**Approval Process:**
When admin approves, they set:
- **Approved Amount**: May be different from requested amount
- **Interest Rate**: Based on risk assessment (8-18%)
- **Loan Tenure**: Number of months (3-60 months)
- **Repayment Frequency**: Monthly/Weekly/Daily

**System Auto-Calculations on Approval:**
1. Calculates EMI using formula: `EMI = [P × R × (1+R)^N] / [(1+R)^N-1]`
2. Generates complete repayment schedule with period-wise breakdown
3. Calculates processing fee (2% of approved amount)
4. Sets first payment due date
5. Updates status to `Approved`
6. Sends approval notification to user

**Example Approval:**
```
Requested Amount: ₹1,50,000
Approved Amount: ₹1,00,000
Interest Rate: 12% p.a.
Tenure: 12 months
Processing Fee: ₹2,000

Generated Schedule:
Month 1: Principal ₹7,885 + Interest ₹1,000 = EMI ₹8,885
Month 2: Principal ₹7,964 + Interest ₹921 = EMI ₹8,885
...and so on
```

### Stage 3: Loan Disbursement
**Admin Actions:**
- Goes to approved loan details
- Clicks "Disburse Loan"
- Enters:
  - Disbursement amount (usually approved amount)
  - Payment method (Bank Transfer/UPI/Cash)
  - Transaction reference
  - Notes (bank details, etc.)

**System Actions:**
1. Updates loan status from `Approved` to `Active`
2. Records disbursement date
3. Sets `principalDisbursed` = disbursed amount
4. Sets `currentPrincipalOutstanding` = disbursed amount
5. Creates transaction record (type: `disbursement`)
6. Sends disbursement notification to user
7. Activates repayment schedule

**Database Changes:**
```javascript
{
  status: "Active",
  principalDisbursed: 100000,
  currentPrincipalOutstanding: 100000,
  currentInterestOutstanding: 0,
  nextPaymentDueDate: "2025-11-21",
  nextPaymentAmount: 8885
}
```

### Stage 4: Payment Collection

#### Method A: Admin Records Payment
**When User Pays Offline:**
- User pays via cash/bank transfer/UPI
- User may show payment receipt to admin
- Admin logs into system
- Goes to active loan
- Clicks "Record Payment"
- Enters:
  - Payment amount
  - Payment date
  - Payment method
  - Transaction reference
  - Notes

**System Auto-Processing:**
1. **Penalty Calculation** (if payment is late):
   ```
   Days Late = Payment Date - Due Date
   Penalty = Next Payment Amount × 0.5% × Days Late
   ```

2. **Payment Allocation Order**:
   - First: Pay penalties (if any)
   - Second: Pay outstanding interest
   - Third: Pay principal

3. **Example Payment Processing**:
   ```
   Payment Received: ₹10,000
   Days Late: 5 days
   Next Payment: ₹8,885
   
   Penalty = ₹8,885 × 0.5% × 5 = ₹222
   Remaining after penalty: ₹10,000 - ₹222 = ₹9,778
   
   Outstanding Interest: ₹1,000
   Remaining after interest: ₹9,778 - ₹1,000 = ₹8,778
   
   Applied to Principal: ₹8,778
   
   Final Breakdown:
   - Penalty Paid: ₹222
   - Interest Paid: ₹1,000
   - Principal Paid: ₹8,778
   ```

4. **Update Outstanding Balances**:
   ```
   currentPrincipalOutstanding -= principalPaid
   currentInterestOutstanding -= interestPaid
   totalPenaltiesPaid += penaltyPaid
   ```

5. **Mark Schedule Period as Paid** (if EMI fully paid)

6. **Update Next Payment Details** from schedule

7. **Check Loan Completion**:
   - If principal & interest both = 0:
     - Status → `PaidOff`
     - Set maturity date
     - Send completion notification

#### Method B: User Submits Payment (For Verification)
**User Flow:**
- User makes online payment
- Uploads payment screenshot
- System status: `pending_verification`
- Admin gets notification
- Admin reviews screenshot
- Admin either:
  - **Verifies**: Payment processed as above
  - **Rejects**: User gets notification to resubmit

### Stage 5: Ongoing Monitoring

**System Auto-Monitoring:**
1. **Payment Due Reminders**:
   - 3 days before due date → Send reminder notification

2. **Overdue Detection**:
   - Payment date > due date + 3 days grace period
   - Status changes to `Overdue`
   - Daily penalty starts accumulating

3. **Default Detection**:
   - Overdue for > 90 days
   - Status changes to `Defaulted`
   - May trigger legal/recovery process

## 💹 Financial Calculations

### EMI Formula
```
EMI = [P × R × (1+R)^N] / [(1+R)^N-1]

Where:
P = Principal loan amount
R = Monthly interest rate (Annual Rate / 12 / 100)
N = Number of monthly installments
```

### Total Interest Earned
```
Total Interest = (EMI × Tenure) - Principal
```

### Example Calculation
```
Loan Amount (P): ₹2,00,000
Annual Interest Rate: 15%
Monthly Rate (R): 15/12/100 = 0.0125
Tenure (N): 24 months

EMI = [200000 × 0.0125 × (1.0125)^24] / [(1.0125)^24 - 1]
EMI = [200000 × 0.0125 × 1.3474] / [0.3474]
EMI = ₹9,706

Total Payment = ₹9,706 × 24 = ₹2,32,944
Total Interest Earned = ₹2,32,944 - ₹2,00,000 = ₹32,944
```

## 🔧 Configuration Files

### Interest Rate Configuration
Located in: `src/lib/constants.ts`

```typescript
export const INTEREST_RATES = {
  PERSONAL_LOAN_DEFAULT: 12,
  BUSINESS_LOAN_DEFAULT: 15,
  SECURED_LOAN_DEFAULT: 10,
};

export const FEES = {
  PROCESSING_FEE_PERCENTAGE: 2,
  LATE_PAYMENT_PENALTY_RATE: 0.005, // 0.5% per day
};
```

### Loan Calculation Functions
Located in: `src/lib/loan-calculations.ts`

Key functions:
- `calculateEMI()` - Calculate monthly installment
- `generateRepaymentSchedule()` - Create amortization table
- `calculateLatePenalty()` - Calculate overdue penalties
- `calculateProcessingFee()` - Calculate upfront fees
- `calculateTotalInterest()` - Calculate total interest earned

## 📱 User Interface

### User Dashboard (`/dashboard`)
Shows:
- Active loans with next payment due
- Payment history
- Loan application status
- Payment submission form

### Admin Dashboard (`/admin`)
Shows:
- Pending applications for review
- Active loans requiring action
- Payment verification queue
- Overdue loans list
- Total outstanding amount
- Total interest earned

### Application Detail Page
Shows:
- Complete loan information
- Repayment schedule (amortization table)
- Payment history with breakdown
- Document uploads
- Action buttons (Approve/Reject/Disburse/Record Payment)

## 🎯 Key Revenue Metrics

### Track These Numbers:
1. **Total Principal Disbursed**: Sum of all active loan principals
2. **Total Outstanding**: Current receivable amount
3. **Total Interest Earned**: Sum of all interest payments received
4. **Total Penalties Collected**: Late payment penalties
5. **Processing Fees Collected**: Upfront fees from all loans
6. **Default Rate**: Percentage of loans that defaulted
7. **Average Interest Rate**: Weighted average across all loans

### Example Monthly Statement:
```
Loans Disbursed: 10 loans
Total Disbursed Amount: ₹10,00,000
Average Interest Rate: 13.5% p.a.

Repayments Received:
- Principal: ₹2,50,000
- Interest: ₹45,000
- Penalties: ₹5,000
- Processing Fees: ₹20,000

Total Revenue: ₹70,000
Outstanding Principal: ₹7,50,000
Expected Interest (if all paid on time): ₹1,35,000
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment variables
# Edit .env file with MongoDB, Cloudinary, Email credentials

# Run development server
npm run dev

# Access the application
# User Interface: http://localhost:9002
# Admin Interface: http://localhost:9002/admin
```

## 🔐 Default Admin Setup

Create first admin user by registering and manually updating in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@shreeshyam.com" },
  { $set: { role: "admin" } }
)
```

## 📊 Database Collections

1. **users** - User accounts (borrowers & admins)
2. **loanapplications** - Loan applications with status
3. **loantransactions** - All payment records
4. **notifications** - User notifications

## 🎓 Best Practices

1. **Always verify documents** before approval
2. **Use Risk Assessment tool** for decision support
3. **Set appropriate interest rates** based on risk
4. **Monitor overdue loans** regularly
5. **Keep detailed payment notes** for auditing
6. **Regular backups** of database
7. **Track key metrics** monthly

## 📞 Support

For any questions about the loan flow or calculations, refer to:
- `src/lib/loan-calculations.ts` - All calculation logic
- `src/lib/constants.ts` - Configuration values
- `docs/blueprint.md` - Original design document

---

**Remember**: Your profit = Interest + Fees - Defaults
Manage risk wisely and ensure timely collections! 💰
