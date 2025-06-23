// /src/app/(main)/admin/payment-verifications/[transactionId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ILoanApplication, ILoanTransaction, IUser } from '@/lib/types';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Eye, XCircle } from 'lucide-react';

interface ITransactionDetails extends ILoanTransaction {
  user: Pick<IUser, 'name' | 'email'>;
  loanApplication: Pick<ILoanApplication, 'loanId'>;
}

export default function PaymentVerificationDetailPage() {
  const { toast } = useToast();

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [details, setDetails] = useState<ITransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/');
      const id = pathSegments[pathSegments.length - 1];
      setTransactionId(id);
    }
  }, []);

  useEffect(() => {
    if (transactionId) {
      const fetchTransactionDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/transactions/${transactionId}/details`);
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to fetch transaction details.');
          }
          const data = await res.json();
          setDetails(data.transaction);
        } catch (err: any) {
          setError(err.message);
          toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransactionDetails();
    }
  }, [transactionId, toast]);

  const handleVerification = async (status: 'verified' | 'rejected') => {
    setIsSubmitting(true);
    try {
        const res = await fetch(`/api/transactions/${transactionId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Failed to ${status} payment.`);
        }
        toast({ title: "Success", description: `Payment has been successfully ${status}.` });
        window.location.href = '/admin/payment-verifications';
    } catch (err: any) {
        toast({ variant: "destructive", title: `Failed to ${status} payment`, description: err.message });
        setIsSubmitting(false);
    }
  };

  const DetailRow = ({ label, value, isBadge = false, badgeVariant = 'default' }: { label: string; value: any; isBadge?: boolean; badgeVariant?: any}) => (
    <div className="flex justify-between items-center py-3 border-b last:border-b-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isBadge ? <Badge variant={badgeVariant}>{value}</Badge> : <p className="text-sm font-semibold text-right">{value}</p>}
    </div>
  );
  
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
        case 'pending_verification': return 'default';
        case 'verified': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  }

  if (isLoading) {
      return (
          <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Card>
                  <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                  <CardContent className="space-y-4">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                  </CardContent>
              </Card>
          </div>
      )
  }
  if (error) return <Alert variant="destructive" className="m-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  if (!details) return <p className="p-4 text-center">No transaction details found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Payment Verification</h1>
      <Card>
        <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
            <DetailRow label="Applicant Name" value={details.user.name} />
            <DetailRow label="Loan ID" value={details.loanApplication.loanId} />
            <DetailRow 
                label="Payment Status" 
                value={details.verificationStatus.replace(/_/g, ' ')} 
                isBadge={true}
                badgeVariant={getStatusBadgeVariant(details.verificationStatus)}
            />
            <DetailRow label="Amount Submitted" value={`₹${details.amountPaid.toLocaleString('en-IN')}`} />
            <DetailRow label="Payment Method" value={details.paymentMethod} />
            <DetailRow label="Submitted On" value={format(new Date(details.createdAt), 'PPpp')} />
            <DetailRow label="Payment Reference ID" value={details.transactionReference || 'N/A'} />
            <div className="py-3">
              <p className="text-sm text-muted-foreground mb-2">User Notes</p>
              <p className="text-sm font-medium p-3 bg-muted rounded-md min-h-[60px]">{details.notes || 'No notes provided.'}</p>
            </div>
            
            {details.userSubmittedScreenshotUrl && (
                 <div className="py-3">
                    <p className="text-sm text-muted-foreground mb-2">Payment Receipt</p>
                    <a href={details.userSubmittedScreenshotUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline"><Eye className="mr-2 h-4 w-4"/> View Receipt</Button>
                    </a>
                 </div>
            )}
        </CardContent>
        {details.verificationStatus === 'pending_verification' && (
          <CardFooter className="flex justify-end gap-2">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isSubmitting}>
                          <XCircle className="mr-2 h-4 w-4"/>Reject
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogDescription>This will mark the payment as rejected. This action cannot be undone.</AlertDialogDescription>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleVerification('rejected')} className="bg-destructive hover:bg-destructive/90">
                              {isSubmitting ? 'Rejecting...' : 'Yes, Reject Payment'}
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                          <CheckCircle2 className="mr-2 h-4 w-4"/>Approve
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogDescription>This will mark the payment as verified and approved. This action cannot be undone.</AlertDialogDescription>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleVerification('verified')} className="bg-green-600 hover:bg-green-700">
                              {isSubmitting ? 'Approving...' : 'Yes, Approve Payment'}
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
