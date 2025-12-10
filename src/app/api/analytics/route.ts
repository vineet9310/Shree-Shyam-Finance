// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import LoanTransactionModel from '@/models/LoanTransaction';
import UserModel from '@/models/User';
import { LoanApplicationStatusEnum } from '@/lib/types';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30'; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get all loans for analytics
        const allLoans = await LoanApplicationModel.find({});
        const recentLoans = await LoanApplicationModel.find({
            createdAt: { $gte: startDate }
        });

        // Calculate metrics
        const totalUsers = await UserModel.countDocuments({ role: 'user' });
        const totalLoans = allLoans.length;
        const activeLoans = allLoans.filter(l =>
            ['Active', 'Disbursed'].includes(l.status)
        ).length;
        const pendingLoans = allLoans.filter(l =>
            ['QueryInitiated', 'PendingAdminVerification', 'Submitted'].includes(l.status)
        ).length;
        const approvedLoans = allLoans.filter(l => l.status === 'Approved').length;
        const rejectedLoans = allLoans.filter(l => l.status === 'Rejected').length;
        const overdueLoans = allLoans.filter(l => l.status === 'Overdue').length;
        const paidOffLoans = allLoans.filter(l => l.status === 'PaidOff').length;

        // Financial metrics
        const totalDisbursed = allLoans
            .filter(l => ['Active', 'Disbursed', 'PaidOff', 'Overdue'].includes(l.status))
            .reduce((sum, l) => sum + (l.principalDisbursed || 0), 0);

        const totalOutstanding = allLoans
            .filter(l => ['Active', 'Disbursed', 'Overdue'].includes(l.status))
            .reduce((sum, l) => sum + (l.currentPrincipalOutstanding || 0) + (l.currentInterestOutstanding || 0), 0);

        const totalCollected = allLoans.reduce((sum, l) =>
            sum + (l.totalPrincipalRepaid || 0) + (l.totalInterestRepaid || 0), 0);

        const totalInterestEarned = allLoans.reduce((sum, l) =>
            sum + (l.totalInterestRepaid || 0), 0);

        const totalPenaltiesCollected = allLoans.reduce((sum, l) =>
            sum + (l.totalPenaltiesPaid || 0), 0);

        // Get transactions for chart data
        const transactions = await LoanTransactionModel.find({
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 });

        // Group by date for chart
        const dailyCollections: Record<string, number> = {};
        const dailyDisbursements: Record<string, number> = {};

        transactions.forEach((t: any) => {
            const date = new Date(t.createdAt).toISOString().split('T')[0];
            if (t.type === 'repayment' || t.type === 'user_submitted_payment') {
                dailyCollections[date] = (dailyCollections[date] || 0) + (t.amountPaid || 0);
            } else if (t.type === 'disbursement') {
                dailyDisbursements[date] = (dailyDisbursements[date] || 0) + (t.amountPaid || 0);
            }
        });

        // Status distribution for pie chart
        const statusDistribution = [
            { name: 'Active', value: activeLoans, color: '#3b82f6' },
            { name: 'Pending', value: pendingLoans, color: '#eab308' },
            { name: 'Approved', value: approvedLoans, color: '#22c55e' },
            { name: 'Rejected', value: rejectedLoans, color: '#ef4444' },
            { name: 'Overdue', value: overdueLoans, color: '#f97316' },
            { name: 'Paid Off', value: paidOffLoans, color: '#10b981' },
        ].filter(s => s.value > 0);

        // Monthly trend data
        const monthlyData: Record<string, { disbursed: number; collected: number; applications: number }> = {};

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { disbursed: 0, collected: 0, applications: 0 };
        }

        allLoans.forEach((loan: any) => {
            const loanDate = new Date(loan.createdAt);
            const key = `${loanDate.getFullYear()}-${String(loanDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                monthlyData[key].applications += 1;
                if (loan.principalDisbursed) {
                    monthlyData[key].disbursed += loan.principalDisbursed;
                }
            }
        });

        transactions.forEach((t: any) => {
            const tDate = new Date(t.createdAt);
            const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key] && (t.type === 'repayment' || t.type === 'user_submitted_payment')) {
                monthlyData[key].collected += t.amountPaid || 0;
            }
        });

        const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            ...data
        }));

        // Collection efficiency
        const collectionEfficiency = totalDisbursed > 0
            ? Math.round((totalCollected / totalDisbursed) * 100)
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    totalLoans,
                    activeLoans,
                    pendingLoans,
                    overdueLoans,
                    paidOffLoans,
                    totalDisbursed,
                    totalOutstanding,
                    totalCollected,
                    totalInterestEarned,
                    totalPenaltiesCollected,
                    collectionEfficiency,
                },
                charts: {
                    statusDistribution,
                    monthlyTrend,
                    dailyCollections: Object.entries(dailyCollections).map(([date, amount]) => ({ date, amount })),
                    dailyDisbursements: Object.entries(dailyDisbursements).map(([date, amount]) => ({ date, amount })),
                }
            }
        });

    } catch (error: any) {
        console.error('[Analytics API] Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
