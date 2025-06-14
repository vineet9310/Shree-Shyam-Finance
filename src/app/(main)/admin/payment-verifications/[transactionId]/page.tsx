// src/app/(main)/admin/payment-verifications/[transactionId]/page.tsx
"use client";

// Step 1: Zaroori libraries aur components ko import karna
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LoanTransactionDocument } from '@/models/LoanTransaction';
import type { LoanApplication } from '@/lib/types';
import { ArrowLeft, Loader2, AlertTriangleIcon, CheckCircle, XCircle, UserCircle, IndianRupee, CalendarDays, LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import FormattedDate from '@/components/custom/FormattedDate';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';

// Step 2: Page ke data ke liye TypeScript interface define karna
interface VerificationData {
  transaction: LoanTransactionDocument;
  application: LoanApplication;
}

// Helper function to check if an ID is a valid MongoDB ObjectID
const isValidMongoId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Step 3: Page ka main component
export default function PaymentVerificationDetailPage() {
  // Hooks ka istemal
  const params = useParams(); // URL se `transactionId` lene ke liye
  const router = useRouter(); // Page navigation ke liye
  const { toast } = useToast(); // Notifications dikhane ke liye
  const { user } = useAuth();   // Logged-in admin ki jaankari ke liye

  // Component ki state manage karne ke liye
  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const transactionId = params.transactionId as string;

  // Step 4: API se data fetch karna
  useEffect(() => {
    if (!isValidMongoId(transactionId)) {
      setError("Invalid Transaction ID format in URL.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/transactions/${transactionId}/details`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Failed to fetch verification details.`);
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Could not fetch verification details');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [transactionId]);

  // Step 5: Approve ya Reject karne ka logic
  const handleVerification = async (isApproved: boolean) => {
    if (!data || !user?.id) {
      toast({ title: "Error", description: "Missing data or admin not logged in.", variant: "destructive"});
      return;
    }

    if (!isApproved && !rejectionReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for rejecting the payment proof.", variant: "destructive"});
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          approved: isApproved,
          rejectionReason: isApproved ? undefined : rejectionReason,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Success", description: `Payment has been successfully ${isApproved ? 'approved' : 'rejected'}.`});
        router.push(ROUTES.ADMIN_PAYMENT_VERIFICATIONS); // Kaam hone ke baad wapas list page par bhej do
      } else {
        throw new Error(result.message || 'Verification action failed.');
      }
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message, variant: "destructive"});
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 6: Alag-alag states ke liye UI render karna (Loading, Error, No Data)
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading Verification Details...</p></div>;
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <Button variant="outline" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Alert variant="destructive"><AlertTriangleIcon className="h-4 w-4" /><AlertTitle>Error Loading Data</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center p-8">Verification data not found.</div>;
  }

  const { transaction, application } = data;
  const isActionable = transaction.verificationStatus === 'pending_verification';

  // Step 7: Main page ka UI
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(ROUTES.ADMIN_PAYMENT_VERIFICATIONS)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue</Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Payment Verification</CardTitle>
          <CardDescription>Review the details below and verify the payment submitted by the user.</CardDescription>
          {!isActionable && (
            <Alert variant="default" className="mt-4 bg-blue-900/30 border-blue-700 text-blue-300">
              <AlertTriangleIcon className="h-4 w-4 !text-blue-400" />
              <AlertTitle>Already Processed</AlertTitle>
              <AlertDescription>This payment has already been <span className='font-bold'>{transaction.verificationStatus.replace(/_/g, ' ')}</span> and no further actions can be taken.</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Payment Proof Details */}
          <div className='space-y-4'>
            <h3 className='font-semibold text-lg border-b pb-2'>Payment Proof</h3>
            <p><strong>Amount Submitted:</strong> <span className="font-bold text-green-400 text-lg">₹{transaction.amountPaid.toLocaleString()}</span></p>
            <p><strong>Payment Date (User Reported):</strong> <FormattedDate dateString={transaction.paymentDate.toString()} /></p>
            <p><strong>Payment Method:</strong> <Badge variant="secondary" className="capitalize">{transaction.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</Badge></p>
            {transaction.transactionReference && <p><strong>Transaction Ref ID:</strong> <span className='font-mono bg-muted text-muted-foreground px-2 py-1 rounded'>{transaction.transactionReference}</span></p>}
            {transaction.notes && <p><strong>User Notes:</strong> <span className='italic'>"{transaction.notes}"</span></p>}

            {transaction.userSubmittedScreenshotUrl ? (
              <div>
                <Label>User's Screenshot:</Label>
                <a href={transaction.userSubmittedScreenshotUrl} target="_blank" rel="noopener noreferrer">
                  <Image src={transaction.userSubmittedScreenshotUrl} alt="Payment Screenshot" width={400} height={600} className="rounded-md border-2 border-primary mt-2 hover:opacity-80 transition-opacity" />
                </a>
              </div>
            ) : (
              <p className='text-muted-foreground'>No screenshot was submitted for this transaction (e.g., Cash payment).</p>
            )}
          </div>

          {/* Right Column: Loan and Borrower Details */}
          <div className='space-y-4'>
            <h3 className='font-semibold text-lg border-b pb-2'>Associated Loan & Borrower</h3>
            <Card className="bg-muted/30">
              <CardHeader className='pb-2'>
                <CardTitle className='text-base flex items-center gap-2'><UserCircle className='h-5 w-5' /> Borrower Details</CardTitle>
              </CardHeader>
              <CardContent className='text-sm space-y-1'>
                <p><strong>Name:</strong> {application.borrowerFullName}</p>
                <p><strong>Email:</strong> {application.borrowerEmail}</p>
                <p><strong>Contact:</strong> {application.borrowerContactNo}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className='pb-2'>
                <CardTitle className='text-base flex items-center gap-2'><LinkIcon className='h-5 w-5' /> Loan Details</CardTitle>
              </CardHeader>
              <CardContent className='text-sm space-y-1'>
                <p><strong>Loan ID:</strong> <Link href={ROUTES.ADMIN_APPLICATION_DETAIL(application.id)} className='font-mono text-primary hover:underline'>{`...${application.id.slice(-12)}`}</Link></p>
                <p><strong>Outstanding Principal:</strong> ₹{application.currentPrincipalOutstanding?.toLocaleString()}</p>
                <p><strong>Outstanding Interest:</strong> ₹{application.currentInterestOutstanding?.toLocaleString()}</p>
                <p><strong>Next Due Amount:</strong> ₹{application.nextPaymentAmount?.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        {/* Action Buttons: Sirf tab dikhenge jab verification pending ho */}
        {isActionable && (
          <CardFooter className="flex justify-end gap-4 border-t pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isVerifying}><XCircle className="mr-2 h-4 w-4"/> Reject Payment</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Payment Proof?</AlertDialogTitle>
                  <AlertDialogDescription>Please provide a reason for rejecting this payment. This reason will be sent to the user.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="rejectionReason" className="sr-only">Rejection Reason</Label>
                  <Textarea id="rejectionReason" placeholder="e.g., Screenshot is unclear, amount does not match..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleVerification(false)} disabled={isVerifying || !rejectionReason.trim()} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Confirm Rejection
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button onClick={() => handleVerification(true)} disabled={isVerifying}>
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
              Approve Payment
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
