
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LoanApplication, LoanApplicationStatus, UserLoan, PaymentHistoryEntry } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { TrendingUp, History, CalendarClock, AlertTriangle, CheckCircle2, Clock, DollarSign, FileText, Loader2 } from "lucide-react";
import FormattedDate from "@/components/custom/FormattedDate";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";


const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = <Clock className="mr-1 h-3 w-3" />;

  switch (status) {
    case "Approved":
    case "Active":
    case "PaidOff":
      variant = "default"; 
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "QueryInitiated":
    case "PendingAdminVerification":
      variant = "secondary";
      icon = <Clock className="mr-1 h-3 w-3" />;
      break;
    case "Rejected":
    case "Overdue":
    case "Defaulted":
      variant = "destructive";
      icon = <AlertTriangle className="mr-1 h-3 w-3" />;
      break;
    case "AdditionalInfoRequired":
      variant = "outline"; 
      icon = <FileText className="mr-1 h-3 w-3" />;
      break;
    default:
      icon = <FileText className="mr-1 h-3 w-3" />; 
  }
  return <Badge variant={variant} className="capitalize text-xs flex items-center whitespace-nowrap">{icon}{status}</Badge>;
};


export default function DashboardPage() {
  const { user } = useAuth();
  const [userLoans, setUserLoans] = useState<LoanApplication[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]); // Will be empty for now
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserLoans = async () => {
      if (!user?.id) {
        setIsLoadingLoans(false);
        return;
      }
      setIsLoadingLoans(true);
      try {
        const response = await fetch('/api/loan-applications');
        if (!response.ok) {
          throw new Error('Failed to fetch loan applications');
        }
        const data = await response.json();
        if (data.success && data.applications) {
          // Filter applications for the current user.
          // Note: borrowerUserId might be an object if populated, or string if not.
          const filteredLoans = data.applications.filter(
            (app: LoanApplication) => (typeof app.borrowerUserId === 'string' && app.borrowerUserId === user.id) || 
                                      (typeof app.borrowerUserId === 'object' && (app.borrowerUserId as any)?.id === user.id)
          );
          setUserLoans(filteredLoans);
        } else {
          throw new Error(data.message || 'Could not parse loan applications');
        }
      } catch (err: any) {
        toast({
          title: "Error loading loans",
          description: err.message || "Could not load your loan applications.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLoans(false);
      }
    };

    fetchUserLoans();
    // For now, payment history will remain empty.
    // In a real app, you'd fetch this from an API:
    // fetchUserPaymentHistory(user.id).then(setPaymentHistory);
    setPaymentHistory([]); 

  }, [user, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground">Here's an overview of your loan activities.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={ROUTES.APPLY_LOAN}>
            <TrendingUp className="mr-2 h-4 w-4" /> Apply for New Loan
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" />Active Loans</CardTitle>
          <CardDescription>Your current loan applications and their statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLoans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p>Loading your loans...</p>
            </div>
          ) : userLoans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userLoans.map((loan) => (
                <Card key={loan.id} className="bg-card-foreground/5">
                  <CardHeader>
                    <CardTitle className="text-lg">{loan.purpose.substring(0,30)}{loan.purpose.length > 30 ? "..." : ""}</CardTitle>
                    <StatusBadge status={loan.status} />
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Amount: <span className="font-semibold">${loan.requestedAmount.toLocaleString()}</span></p>
                    {loan.nextPaymentDueDate && (
                      <p className="flex items-center"><CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" /> Next Payment: <FormattedDate dateString={loan.nextPaymentDueDate} /></p>
                    )}
                    {loan.nextPaymentAmount && (
                       <p>Next Payment Amount: <span className="font-semibold">${loan.nextPaymentAmount.toLocaleString()}</span></p>
                    )}
                     <p className="flex items-center text-xs text-muted-foreground"><Clock className="mr-1 h-3 w-3" /> Applied: <FormattedDate dateString={loan.applicationDate} /></p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">You have no active loan applications. <Link href={ROUTES.APPLY_LOAN} className="text-accent hover:underline">Apply for one now!</Link></p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-6 w-6 text-primary" />Payment History</CardTitle>
          <CardDescription>Your recent payment activities.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell><FormattedDate dateString={payment.date} /></TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={payment.status === 'Paid' ? 'default' : payment.status === 'Missed' ? 'destructive' : 'secondary'} className="capitalize text-xs">
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           ) : (
            <p className="text-muted-foreground text-center py-8">No payment history available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

