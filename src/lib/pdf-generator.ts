// src/lib/pdf-generator.ts
// PDF generation utilities for loan statements and agreements
// Uses jsPDF for client-side PDF generation

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { LoanApplication, PaymentRecord } from './types';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface LoanStatementData {
    loan: LoanApplication;
    transactions: PaymentRecord[];
    generatedDate: string;
}

// Format currency for PDF
function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date for PDF
function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// Generate Loan Statement PDF
export function generateLoanStatement(data: LoanStatementData): jsPDF {
    const { loan, transactions, generatedDate } = data;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 128, 0);
    doc.text('Shree Shyam Finance', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Loan Statement', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Line separator
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    // Borrower Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Borrower Details', 15, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const borrowerName = loan.borrowerFullName || (typeof loan.borrowerUserId === 'object' ? (loan.borrowerUserId as any).name : 'N/A');
    const borrowerEmail = loan.borrowerEmail || (typeof loan.borrowerUserId === 'object' ? (loan.borrowerUserId as any).email : 'N/A');

    doc.text(`Name: ${borrowerName}`, 15, yPos);
    doc.text(`Statement Date: ${generatedDate}`, pageWidth - 60, yPos);
    yPos += 5;
    doc.text(`Email: ${borrowerEmail}`, 15, yPos);
    yPos += 5;
    doc.text(`Loan ID: ${loan.id}`, 15, yPos);
    yPos += 12;

    // Loan Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Loan Summary', 15, yPos);
    yPos += 7;

    // Summary table
    const summaryData = [
        ['Approved Amount', formatCurrency(loan.approvedAmount || 0)],
        ['Disbursed Amount', formatCurrency(loan.principalDisbursed || 0)],
        ['Interest Rate', `${loan.interestRate || 0}% p.a.`],
        ['Tenure', `${loan.loanTermMonths || 0} months`],
        ['Status', loan.status],
        ['Disbursement Date', formatDate(loan.disbursementDate)],
        ['Maturity Date', formatDate(loan.maturityDate)],
    ];

    doc.autoTable({
        startY: yPos,
        head: [],
        body: summaryData,
        theme: 'plain',
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 60 },
        },
        margin: { left: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Outstanding Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Outstanding Summary', 15, yPos);
    yPos += 7;

    const outstandingData = [
        ['Principal Outstanding', formatCurrency(loan.currentPrincipalOutstanding || 0)],
        ['Interest Outstanding', formatCurrency(loan.currentInterestOutstanding || 0)],
        ['Total Outstanding', formatCurrency((loan.currentPrincipalOutstanding || 0) + (loan.currentInterestOutstanding || 0))],
        ['Total Principal Repaid', formatCurrency(loan.totalPrincipalRepaid || 0)],
        ['Total Interest Paid', formatCurrency(loan.totalInterestRepaid || 0)],
        ['Total Penalties Paid', formatCurrency(loan.totalPenaltiesPaid || 0)],
    ];

    doc.autoTable({
        startY: yPos,
        head: [],
        body: outstandingData,
        theme: 'plain',
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 60 },
        },
        margin: { left: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Transaction History
    if (transactions.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Transaction History', 15, yPos);
        yPos += 5;

        const transactionTableData = transactions.map((t) => [
            formatDate(t.paymentDate),
            t.type.replace(/_/g, ' ').toUpperCase(),
            formatCurrency(t.amountPaid),
            formatCurrency(t.principalApplied),
            formatCurrency(t.interestApplied),
            t.paymentMethod.replace(/_/g, ' '),
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Date', 'Type', 'Amount', 'Principal', 'Interest', 'Method']],
            body: transactionTableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 128, 0] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 8 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Repayment Schedule
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
        // Check if we need a new page
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Repayment Schedule', 15, yPos);
        yPos += 5;

        const scheduleData = loan.repaymentSchedule.map((s) => [
            s.period.toString(),
            formatDate(s.dueDate),
            formatCurrency(s.paymentAmount),
            formatCurrency(s.principalComponent),
            formatCurrency(s.interestComponent),
            formatCurrency(s.endingBalance),
            s.isPaid ? '✓ Paid' : 'Pending',
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['#', 'Due Date', 'EMI', 'Principal', 'Interest', 'Balance', 'Status']],
            body: scheduleData,
            theme: 'striped',
            headStyles: { fillColor: [0, 128, 0] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 7 },
        });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
            `Page ${i} of ${pageCount} | Generated on ${generatedDate} | Shree Shyam Finance`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc;
}

// Generate Loan Agreement PDF
export function generateLoanAgreement(loan: LoanApplication): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 128, 0);
    doc.text('LOAN AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Shree Shyam Finance', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Agreement content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const borrowerName = loan.borrowerFullName || 'Borrower';
    const loanAmount = formatCurrency(loan.approvedAmount || loan.requestedAmount || 0);
    const interestRate = loan.interestRate || 12;
    const tenure = loan.loanTermMonths || 12;
    const agreementDate = formatDate(loan.approvedDate || new Date().toISOString());

    const agreementText = `
This Loan Agreement ("Agreement") is entered into on ${agreementDate} between:

LENDER: Shree Shyam Finance
(hereinafter referred to as "Lender")

AND

BORROWER: ${borrowerName}
Email: ${loan.borrowerEmail || 'N/A'}
Address: ${loan.borrowerAddress || 'N/A'}
(hereinafter referred to as "Borrower")

LOAN TERMS:

1. Loan Amount: ${loanAmount}
2. Interest Rate: ${interestRate}% per annum
3. Loan Tenure: ${tenure} months
4. Repayment Frequency: ${loan.repaymentFrequency || 'Monthly'}
5. Purpose: ${loan.purpose || 'Personal Use'}

TERMS AND CONDITIONS:

1. The Borrower agrees to repay the loan amount along with interest as per the repayment schedule.

2. Late payment will attract a penalty of 0.5% per day on the overdue amount.

3. Prepayment is allowed with 2% charges if closed before 6 months.

4. The Borrower has provided collateral/guarantee as per the loan application.

5. In case of default, the Lender has the right to take legal action and recover the outstanding amount.

6. This agreement shall be governed by the laws of India.


SIGNATURES:


_____________________________          _____________________________
Authorized Signatory (Lender)          Borrower Signature
Shree Shyam Finance                    ${borrowerName}

Date: _____________                     Date: _____________
`;

    const lines = doc.splitTextToSize(agreementText, pageWidth - 30);
    doc.text(lines, 15, yPos);

    return doc;
}

// Download PDF helper (for client-side use)
export function downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(filename);
}
