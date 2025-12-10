// src/app/api/reports/route.ts
// CSV export endpoint for admin reports

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import LoanTransactionModel from '@/models/LoanTransaction';
import { createAuditLog } from '@/models/AuditLog';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const reportType = searchParams.get('type') || 'loans';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');
        const adminId = searchParams.get('adminId');
        const adminEmail = searchParams.get('adminEmail');

        let csvContent = '';
        let filename = '';

        const dateFilter: any = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }

        if (reportType === 'loans') {
            // Export loan applications
            const query: any = {};
            if (Object.keys(dateFilter).length > 0) {
                query.createdAt = dateFilter;
            }
            if (status) {
                query.status = status;
            }

            const loans = await LoanApplicationModel.find(query)
                .populate('borrowerUserId', 'name email')
                .sort({ createdAt: -1 })
                .lean();

            // CSV headers
            csvContent = 'ID,Borrower Name,Borrower Email,Requested Amount,Approved Amount,Interest Rate,Tenure,Status,Applied Date,Approved Date,Disbursed Date,Outstanding Principal,Outstanding Interest\n';

            // CSV rows
            loans.forEach((loan: any) => {
                const borrowerName = loan.borrowerFullName || (loan.borrowerUserId?.name || 'N/A');
                const borrowerEmail = loan.borrowerEmail || (loan.borrowerUserId?.email || 'N/A');

                csvContent += [
                    loan._id.toString(),
                    `"${borrowerName}"`,
                    borrowerEmail,
                    loan.requestedAmount || 0,
                    loan.approvedAmount || '',
                    loan.interestRate || '',
                    loan.loanTermMonths || '',
                    loan.status,
                    loan.createdAt ? new Date(loan.createdAt).toISOString().split('T')[0] : '',
                    loan.approvedDate ? new Date(loan.approvedDate).toISOString().split('T')[0] : '',
                    loan.disbursementDate ? new Date(loan.disbursementDate).toISOString().split('T')[0] : '',
                    loan.currentPrincipalOutstanding || 0,
                    loan.currentInterestOutstanding || 0,
                ].join(',') + '\n';
            });

            filename = `loan_report_${new Date().toISOString().split('T')[0]}.csv`;

        } else if (reportType === 'transactions') {
            // Export transactions
            const query: any = {};
            if (Object.keys(dateFilter).length > 0) {
                query.createdAt = dateFilter;
            }

            const transactions = await LoanTransactionModel.find(query)
                .populate('loanApplicationId', 'borrowerFullName')
                .sort({ createdAt: -1 })
                .lean();

            csvContent = 'ID,Loan ID,Borrower,Type,Amount,Principal Applied,Interest Applied,Penalty Applied,Payment Method,Payment Date,Verification Status\n';

            transactions.forEach((t: any) => {
                csvContent += [
                    t._id.toString(),
                    t.loanApplicationId?._id?.toString() || t.loanApplicationId?.toString() || '',
                    `"${t.loanApplicationId?.borrowerFullName || 'N/A'}"`,
                    t.type,
                    t.amountPaid || 0,
                    t.principalApplied || 0,
                    t.interestApplied || 0,
                    t.penaltyApplied || 0,
                    t.paymentMethod || '',
                    t.paymentDate ? new Date(t.paymentDate).toISOString().split('T')[0] : '',
                    t.verificationStatus || '',
                ].join(',') + '\n';
            });

            filename = `transactions_report_${new Date().toISOString().split('T')[0]}.csv`;

        } else if (reportType === 'summary') {
            // Summary report
            const loans = await LoanApplicationModel.find({}).lean();

            const totalDisbursed = loans.reduce((sum, l: any) => sum + (l.principalDisbursed || 0), 0);
            const totalOutstanding = loans.reduce((sum, l: any) => sum + (l.currentPrincipalOutstanding || 0) + (l.currentInterestOutstanding || 0), 0);
            const totalCollected = loans.reduce((sum, l: any) => sum + (l.totalPrincipalRepaid || 0) + (l.totalInterestRepaid || 0), 0);
            const totalInterestEarned = loans.reduce((sum, l: any) => sum + (l.totalInterestRepaid || 0), 0);
            const totalPenalties = loans.reduce((sum, l: any) => sum + (l.totalPenaltiesPaid || 0), 0);

            const statusCounts: Record<string, number> = {};
            loans.forEach((l: any) => {
                statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
            });

            csvContent = 'Metric,Value\n';
            csvContent += `Total Loans,${loans.length}\n`;
            csvContent += `Total Disbursed,${totalDisbursed}\n`;
            csvContent += `Total Outstanding,${totalOutstanding}\n`;
            csvContent += `Total Collected,${totalCollected}\n`;
            csvContent += `Interest Earned,${totalInterestEarned}\n`;
            csvContent += `Penalties Collected,${totalPenalties}\n`;
            csvContent += '\nStatus Breakdown\n';
            Object.entries(statusCounts).forEach(([status, count]) => {
                csvContent += `${status},${count}\n`;
            });

            filename = `summary_report_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        // Create audit log if admin info provided
        if (adminId && adminEmail) {
            await createAuditLog(
                adminId,
                adminEmail,
                'EXPORT_DATA',
                'system',
                { reportType, startDate, endDate, status },
                undefined
            );
        }

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('[Reports API] Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to generate report' },
            { status: 500 }
        );
    }
}
