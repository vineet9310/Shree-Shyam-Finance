// /src/app/(main)/admin/payment-verifications/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, AlertTriangle, Inbox, Users } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Zaroori types ko yahi define kiya gaya hai taaki import errors na aayein
export enum NotificationTypeEnum {
    LOAN_APPLICATION_SUBMITTED = 'loan_application_submitted',
    LOAN_STATUS_CHANGED = 'loan_status_changed',
    PAYMENT_DUE = 'payment_due',
    PAYMENT_RECEIVED = 'payment_received',
    PAYMENT_OVERDUE = 'payment_overdue',
    LOAN_DISBURSED = 'loan_disbursed',
    USER_PAYMENT_SUBMITTED_FOR_VERIFICATION = 'user_payment_submitted_for_verification',
    PAYMENT_SUBMISSION_RECEIVED = 'payment_submission_received',
    PAYMENT_VERIFICATION_COMPLETED = 'payment_verification_completed',
}

export interface SystemNotification {
    id: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    linkTo?: string;
    type: NotificationTypeEnum;
    loanApplicationId?: string;
    recipientUserId: string;
}

const parsePaymentNotificationMessage = (message: string): { applicantName: string, amount: string } => {
    const amountMatch = message.match(/₹([\d,]+\.?\d*)/);
    const applicantMatch = message.match(/submitted by (.*?) for/);
    return {
        applicantName: applicantMatch ? applicantMatch[1].trim() : "N/A",
        amount: amountMatch ? amountMatch[1] : "N/A",
    };
};

export default function AdminPaymentVerificationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [pendingVerificationPayments, setPendingVerificationPayments] = useState<SystemNotification[]>([]);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // *** YEH SABSE ZAROORI FIX HAI: `{ cache: 'no-store' }` ***
        // Isse data hamesha server se fresh aayega.
        const response = await fetch(`/api/notifications?type=${NotificationTypeEnum.USER_PAYMENT_SUBMITTED_FOR_VERIFICATION}`, {
            cache: 'no-store' 
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
          throw new Error(errorData.message || 'Failed to fetch payments for verification');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.notifications)) {
          const sortedNotifications = [...data.notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPendingVerificationPayments(sortedNotifications);
        } else {
          setPendingVerificationPayments([]);
        }
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error Loading Payments",
          description: err.message || "Could not load payments needing verification.",
          variant: "destructive",
        });
         setPendingVerificationPayments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingPayments();
  }, [toast]);

  const handleVerifyClick = (link: string | undefined) => {
      if (link) {
          window.location.href = link;
      } else {
          toast({
              title: "Navigation Error",
              description: "The link for this notification is missing.",
              variant: "destructive",
          });
      }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <Inbox className="h-8 w-8 text-primary" /> Payment Verification Queue
      </h1>
      
      <Card className="shadow-lg border-orange-500/70">
        <CardHeader className="bg-orange-500/10">
          <CardTitle className="text-xl text-orange-700 dark:text-orange-400">Pending User Payments</CardTitle>
          <CardDescription className="text-orange-600 dark:text-orange-300/90">
            Review and verify payments submitted by users. Click 'Verify' to view details and approve/reject.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertTriangle className="h-10 w-10 mb-3" />
              <p className="font-semibold text-lg">Failed to Load Payments</p>
              <p className="text-sm">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Retry</Button>
            </div>
          ) : pendingVerificationPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-orange-500/40">
                    <TableHead className="text-orange-800 dark:text-orange-300">Applicant</TableHead>
                    <TableHead className="text-orange-800 dark:text-orange-300">Loan ID</TableHead>
                    <TableHead className="text-orange-800 dark:text-orange-300">Amount (₹)</TableHead>
                    <TableHead className="text-orange-800 dark:text-orange-300">Submitted On</TableHead>
                    <TableHead className="text-right text-orange-800 dark:text-orange-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVerificationPayments.map((notif) => {
                    const paymentDetails = parsePaymentNotificationMessage(notif.message);
                    return (
                      <TableRow key={notif.id} className="border-b-orange-500/20 hover:bg-orange-500/5 dark:hover:bg-orange-500/10">
                        <TableCell className="font-medium text-foreground">{paymentDetails.applicantName}</TableCell>
                        <TableCell className="text-muted-foreground font-mono">{notif.loanApplicationId ? `...${notif.loanApplicationId.toString().slice(-6)}` : 'N/A'}</TableCell>
                        <TableCell className="text-foreground font-semibold">₹{paymentDetails.amount}</TableCell>
                        <TableCell>{format(new Date(notif.createdAt), 'MMM d, yyyy, h:mm a')}</TableCell>
                        <TableCell className="text-right">
                          {notif.linkTo ? (
                            <Button variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700" onClick={() => handleVerifyClick(notif.linkTo)}>
                                <Eye className="mr-1.5 h-4 w-4" /> Verify Payment
                            </Button>
                          ) : (
                              <span className="text-xs text-muted-foreground">Link Error</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-lg">No payments are currently pending verification.</p>
                <p className="text-sm text-muted-foreground">When a user submits a payment proof, it will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
