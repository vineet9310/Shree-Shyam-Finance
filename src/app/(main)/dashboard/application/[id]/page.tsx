// src/app/(main)/dashboard/application/[id]/page.tsx

"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication, PaymentRecord } from '@/lib/types'; // Import PaymentRecord
import { ApplicationDetails } from '@/components/custom/ApplicationDetails';
import { ArrowLeft, Loader2, AlertTriangleIcon, Edit, History, IndianRupee } from "lucide-react"; // Added History, IndianRupee
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import Table components
import FormattedDate from '@/components/custom/FormattedDate';
import { Badge } from '@/components/ui/badge';

const isValidMongoIdClientSide = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export default function UserApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [transactions, setTransactions] = useState<PaymentRecord[]>([]); // State for transactions
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);


  const applicationId = params.id as string;

  useEffect(() => {
    if (!isValidMongoIdClientSide(applicationId)) {
      setError("Invalid Application ID in URL.");
      setIsLoading(false);
      setApplication(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    fetch(`/api/loan-applications/${applicationId}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || `Failed to fetch application. Status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.application) {
          // Ensure the fetched application has the necessary fields for ApplicationDetails
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
      })
      .catch(err => {
        console.error("Error fetching application details for user view:", err);
        setError(err.message || "An unexpected error occurred while fetching the application.");
        setApplication(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

      // Fetch transactions for this loan
      setIsLoadingTransactions(true);
      setErrorTransactions(null);
      fetch(`/api/loan-applications/${applicationId}/transactions`)
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.message || `Failed to fetch transactions. Status: ${res.status}`);
            });
          }
          return res.json();
        })
        .then(data => {
          if (data.success && data.transactions) {
            setTransactions(data.transactions);
          } else {
            throw new Error(data.message || 'Could not parse loan transactions');
          }
        })
        .catch(err => {
          console.error("Error fetching loan transactions:", err);
          setErrorTransactions(err.message || "An unexpected error occurred while fetching transactions.");
          setTransactions([]);
        })
        .finally(() => {
          setIsLoadingTransactions(false);
        });

  }, [applicationId]);

  const canEditApplication = application?.status === 'QueryInitiated' || application?.status === 'AdditionalInfoRequired';

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

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <ApplicationDetails application={application} />

      {/* Payment History Section */}
      <Card className="shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardHeader className="bg-gray-800 border-b border-gray-700 p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-primary-foreground">
            <History className="h-6 w-6 text-blue-400" />
            Payment History
          </CardTitle>
          <CardDescription className="text-gray-400">All recorded transactions for this loan.</CardDescription>
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
                  <TableRow>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Principal</TableHead>
                    <TableHead className="text-gray-300">Interest</TableHead>
                    <TableHead className="text-gray-300">Penalty</TableHead>
                    <TableHead className="text-gray-300">Method</TableHead>
                    <TableHead className="text-gray-300">Reference</TableHead>
                    <TableHead className="text-gray-300">Notes</TableHead>
                    <TableHead className="text-gray-300">Late?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-700/50">
                      <TableCell className="text-gray-200"><FormattedDate dateString={transaction.paymentDate} options={{ year: 'numeric', month: 'short', day: 'numeric' }} /></TableCell>
                      <TableCell className="text-gray-200">
                        <Badge variant={transaction.amountPaid > 0 ? "default" : "secondary"}>
                          {transaction.amountPaid > 0 ? "Payment" : "Disbursement"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-semibold ${transaction.amountPaid > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{transaction.amountPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-200">₹{transaction.principalApplied.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-200">₹{transaction.interestApplied.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-200">₹{transaction.penaltyApplied?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-gray-200 capitalize">{transaction.paymentMethod.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-gray-200 text-xs">{transaction.transactionReference || 'N/A'}</TableCell>
                      <TableCell className="text-gray-200 text-xs">{transaction.notes || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.isLatePayment ? "destructive" : "secondary"}>
                          {transaction.isLatePayment ? `Yes (${transaction.daysLate} days)` : "No"}
                        </Badge>
                      </TableCell>
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
                    onClick={() => router.push(`${ROUTES.USER_APPLICATION_DETAIL(application.id)}/edit`)} // Placeholder for edit route
                    variant="outline"
                    disabled // Edit functionality to be implemented
                >
                    <Edit className="mr-2 h-4 w-4" /> Edit Application (Soon)
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
