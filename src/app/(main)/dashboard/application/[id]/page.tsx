// src/app/(main)/dashboard/application/[id]/page.tsx

"use client";
import { useEffect, useState, useCallback } from 'react'; 
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication, PaymentRecord, LoanTransactionTypeEnum } from '@/lib/types'; // Added LoanTransactionTypeEnum
import { ApplicationDetails } from '@/components/custom/ApplicationDetails';
import { UserMakePaymentPanel } from '@/components/custom/UserMakePaymentPanel'; 
import { ArrowLeft, Loader2, AlertTriangleIcon, Edit, History, IndianRupee, CheckCircle, ShieldAlert, XCircle } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; 
import FormattedDate from '@/components/custom/FormattedDate';
import { Badge } from '@/components/ui/badge';
import { LoanTransactionVerificationStatusEnum } from '@/lib/types'; // Corrected: Import enum from types.ts

const isValidMongoIdClientSide = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export default function UserApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [transactions, setTransactions] = useState<PaymentRecord[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);

  const applicationId = params.id as string;

  const fetchApplicationData = useCallback(async () => {
    if (!isValidMongoIdClientSide(applicationId)) {
      setError("Invalid Application ID in URL.");
      setIsLoading(false);
      setApplication(null);
      return;
    }

    setIsLoading(true); 
    setError(null);
    try {
      const res = await fetch(`/api/loan-applications/${applicationId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed to fetch application. Status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.application) {
        const appData = data.application;
        setApplication({
          ...appData,
          fullName: appData.borrowerFullName || (appData.borrowerUserId as any)?.name || 'N/A',
          email: appData.borrowerEmail || (appData.borrowerUserId as any)?.email || 'N/A',
          loanAmount: appData.requestedAmount,
          loanPurpose: appData.purpose,
          submittedDate: appData.applicationDate,
          monthlyIncome: appData.monthlyIncome || 0,
          employmentStatus: appData.employmentStatus || 'N/A',
          jobType: appData.jobType || 'N/A',
          businessDescription: appData.businessDescription || 'N/A',
          creditScore: appData.creditScore || 0,
        });
      } else {
        setError(data.message || 'Could not fetch application details');
        setApplication(null);
      }
    } catch (err: any) {
      console.error("Error fetching application details for user view:", err);
      setError(err.message || "An unexpected error occurred while fetching the application.");
      setApplication(null);
    } finally {
      setIsLoading(false); 
    }
  }, [applicationId]);

  const fetchTransactionsData = useCallback(async () => {
    if (!isValidMongoIdClientSide(applicationId)) {
        setErrorTransactions("Invalid Application ID for transactions.");
        setIsLoadingTransactions(false);
        setTransactions([]);
        return;
    }
    setIsLoadingTransactions(true);
    setErrorTransactions(null);
    try {
      const res = await fetch(`/api/loan-applications/${applicationId}/transactions`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed to fetch transactions. Status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      } else {
        throw new Error(data.message || 'Could not parse loan transactions');
      }
    } catch (err: any) {
      console.error("Error fetching loan transactions:", err);
      setErrorTransactions(err.message || "An unexpected error occurred while fetching transactions.");
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [applicationId]);


  useEffect(() => {
    fetchApplicationData();
    fetchTransactionsData();
  }, [fetchApplicationData, fetchTransactionsData]);

  const handlePaymentSubmitted = () => {
    fetchApplicationData();
    fetchTransactionsData();
  };

  const canEditApplication = application?.status === 'QueryInitiated' || application?.status === 'AdditionalInfoRequired';
  const canMakePayment = application?.status === 'Active' || application?.status === 'Overdue';

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /><p>Loading application details...</p></div>;
  }

  if (error) {
     return (
      <div className="space-y-4 p-4">
         <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error Loading Application</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!application) {
    return (
       <div className="space-y-4 p-4">
         <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Application Not Found</AlertTitle>
            <AlertDescription>The requested loan application could not be found or an error occurred.</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const getVerificationStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
        case LoanTransactionVerificationStatusEnum.PENDING_VERIFICATION:
            return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500"><ShieldAlert className="mr-1 h-3 w-3"/>Pending</Badge>;
        case LoanTransactionVerificationStatusEnum.ADMIN_VERIFIED_PAID:
            return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500"><CheckCircle className="mr-1 h-3 w-3"/>Verified</Badge>;
        case LoanTransactionVerificationStatusEnum.ADMIN_REJECTED_PROOF:
            return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Rejected</Badge>;
        case LoanTransactionVerificationStatusEnum.SYSTEM_RECORDED: 
             return <Badge variant="outline" className="text-gray-400 border-gray-500">By Admin</Badge>;
        default:
            return <Badge variant="outline">{status.replace(/_/g, ' ').toLowerCase()}</Badge>;
    }
  };

  const formatTransactionType = (type?: LoanTransactionTypeEnum | string): string => {
    if (typeof type === 'string' && type.trim() !== '') {
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ');
    }
    return 'N/A';
  };


  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <ApplicationDetails application={application} />

      {canMakePayment && (
        <UserMakePaymentPanel application={application} onPaymentSubmitted={handlePaymentSubmitted} />
      )}


      <Card className="shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardHeader className="bg-gray-800 border-b border-gray-700 p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-primary-foreground">
            <History className="h-6 w-6 text-blue-400" />
            Payment History & Submissions
          </CardTitle>
          <CardDescription className="text-gray-400">All recorded transactions and payment submissions for this loan.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p className="text-gray-300">Loading transactions...</p>
            </div>
          ) : errorTransactions ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-400">
              <AlertTriangleIcon className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load payment history</p>
              <p className="text-sm">{errorTransactions}</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Amount (₹)</TableHead>
                    <TableHead className="text-gray-300">Method</TableHead>
                    <TableHead className="text-gray-300">Ref.</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-700/50 border-gray-700">
                      <TableCell className="text-gray-200"><FormattedDate dateString={transaction.paymentDate} options={{ year: 'numeric', month: 'short', day: 'numeric' }} /></TableCell>
                      <TableCell className="text-gray-200">
                        <Badge 
                          variant={transaction.type === "disbursement" ? "secondary" : "default"} 
                          className={transaction.type === "disbursement" ? "bg-blue-500/20 text-blue-300 border-blue-500" : "bg-green-500/20 text-green-300 border-green-500"}
                        >
                          {formatTransactionType(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-semibold ${transaction.type === "disbursement" ? 'text-red-400' : 'text-green-400'}`}>
                        {transaction.amountPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-200 capitalize">{transaction.paymentMethod ? transaction.paymentMethod.replace(/_/g, ' ') : 'N/A'}</TableCell>
                      <TableCell className="text-gray-200 text-xs truncate max-w-[100px]" title={transaction.transactionReference || 'N/A'}>{transaction.transactionReference || 'N/A'}</TableCell>
                      <TableCell className="text-gray-200">
                        {getVerificationStatusBadge((transaction as any).verificationStatus)}
                      </TableCell>
                      <TableCell className="text-gray-200 text-xs truncate max-w-[150px]" title={transaction.notes || 'N/A'}>{transaction.notes || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No payment history available for this loan yet.</p>
          )}
        </CardContent>
      </Card>

      {canEditApplication && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Manage Your Application</CardTitle>
                <CardDescription>You can edit your application details if needed.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button
                    onClick={() => router.push(`${ROUTES.USER_APPLICATION_DETAIL(application.id)}/edit`)} 
                    variant="outline"
                    disabled 
                >
                    <Edit className="mr-2 h-4 w-4" /> Edit Application (Soon)
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
