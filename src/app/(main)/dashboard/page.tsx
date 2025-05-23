
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LoanApplication, LoanApplicationStatus, PaymentHistoryEntry } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { TrendingUp, History, CalendarClock, AlertTriangle, CheckCircle2, Clock, IndianRupee, FileText, Loader2, Eye } from "lucide-react";
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
  const [userLoanApplications, setUserLoanApplications] = useState<LoanApplication[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [errorLoans, setErrorLoans] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserLoans = async () => {
      if (!user?.id) {
        setIsLoadingLoans(false);
        setUserLoanApplications([]); // Clear applications if no user
        return;
      }
      setIsLoadingLoans(true);
      setErrorLoans(null);
      try {
        // Fetch applications specifically for the current user
        const response = await fetch(`/api/loan-applications?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch loan applications for user');
        }
        const data = await response.json();
        if (data.success && data.applications) {
          setUserLoanApplications(data.applications);
        } else {
          throw new Error(data.message || 'Could not parse user loan applications');
        }
      } catch (err: any) {
        console.error("Error fetching user loans:", err);
        setErrorLoans(err.message);
        toast({
          title: "Error loading loan applications",
          description: err.message || "Could not load your loan applications.",
          variant: "destructive",
        });
        setUserLoanApplications([]); // Clear on error
      } finally {
        setIsLoadingLoans(false);
      }
    };

    fetchUserLoans();
    // Reset payment history (actual fetching would be separate)
    setPaymentHistory([]); 

  }, [user, toast]); // user.id could be added, but user object change should be enough

  const applicationQueries = userLoanApplications.filter(
    app => app.status === 'QueryInitiated' || app.status === 'PendingAdminVerification' || app.status === 'AdditionalInfoRequired'
  );
  const activeLoans = userLoanApplications.filter(
    app => app.status === 'Active' || app.status === 'Overdue'
  );


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

      {/* Submitted Application Queries Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />My Loan Application Queries</CardTitle>
          <CardDescription>Track your submitted loan applications that are under review.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLoans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p>Loading your applications...</p>
            </div>
          ) : errorLoans ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load applications</p>
              <p className="text-sm">{errorLoans}</p>
            </div>
          ) : applicationQueries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {applicationQueries.map((app) => (
                <Card key={app.id} className="bg-card-foreground/5">
                  <CardHeader>
                    <CardTitle className="text-lg truncate" title={app.purpose}>{app.purpose.substring(0,30)}{app.purpose.length > 30 ? "..." : ""}</CardTitle>
                    <StatusBadge status={app.status} />
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Amount Requested: <span className="font-semibold">₹{app.requestedAmount.toLocaleString()}</span></p>
                    <p className="flex items-center text-xs text-muted-foreground"><Clock className="mr-1 h-3 w-3" /> Applied: <FormattedDate dateString={app.applicationDate} /></p>
                     <Button variant="outline" size="sm" className="mt-2 w-full" disabled> 
                        <Eye className="mr-2 h-4 w-4" /> View/Edit (Soon)
                     </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">You have no submitted loan queries under review. <Link href={ROUTES.APPLY_LOAN} className="text-accent hover:underline">Apply for one now!</Link></p>
          )}
        </CardContent>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IndianRupee className="h-6 w-6 text-primary" />Active Loans</CardTitle>
          <CardDescription>Your current active loans and their statuses.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingLoans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p>Loading your active loans...</p>
            </div>
          ) : errorLoans ? (
             <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load active loans</p>
              <p className="text-sm">{errorLoans}</p>
            </div>
          ) : activeLoans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeLoans.map((loan) => (
                <Card key={loan.id} className="bg-card-foreground/5">
                  <CardHeader>
                    <CardTitle className="text-lg truncate" title={loan.purpose}>{loan.purpose.substring(0,30)}{loan.purpose.length > 30 ? "..." : ""}</CardTitle>
                    <StatusBadge status={loan.status} />
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Approved Amount: <span className="font-semibold">₹{loan.approvedAmount?.toLocaleString() || loan.requestedAmount.toLocaleString()}</span></p>
                    {loan.nextPaymentDueDate && (
                      <p className="flex items-center"><CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" /> Next Payment: <FormattedDate dateString={loan.nextPaymentDueDate} /></p>
                    )}
                    {loan.nextPaymentAmount && (
                       <p>Next Payment Amount: <span className="font-semibold">₹{loan.nextPaymentAmount.toLocaleString()}</span></p>
                    )}
                     <p className="flex items-center text-xs text-muted-foreground"><Clock className="mr-1 h-3 w-3" /> Disbursed: <FormattedDate dateString={loan.disbursementDate || loan.approvedDate} /></p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">You have no active loans.</p>
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
                  <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
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

    