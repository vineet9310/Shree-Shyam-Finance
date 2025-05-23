"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UserLoan, PaymentHistoryEntry, LoanApplicationStatus } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { TrendingUp, History, CalendarClock, AlertTriangle, CheckCircle2, Clock, DollarSign, FileText } from "lucide-react";

const mockUserLoans: UserLoan[] = [
  { id: "loan1", loanType: "Personal Loan", amount: 5000, status: "Approved", nextPaymentDate: "2024-08-15", nextPaymentAmount: 250 },
  { id: "loan2", loanType: "Mortgage", amount: 150000, status: "Under Review", },
  { id: "loan3", loanType: "Auto Loan", amount: 20000, status: "Pending" },
];

const mockPaymentHistory: PaymentHistoryEntry[] = [
  { id: "payment1", loanId: "loan1", date: "2024-07-15", amount: 250, status: "Paid" },
  { id: "payment2", loanId: "loan1", date: "2024-06-15", amount: 250, status: "Paid" },
  { id: "payment3", loanId: "loan1", date: "2024-05-15", amount: 250, status: "Missed" },
];

const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = <Clock className="mr-1 h-3 w-3" />;

  switch (status) {
    case "Approved":
      variant = "default"; // Uses primary color
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "Pending":
      variant = "secondary";
      icon = <Clock className="mr-1 h-3 w-3" />;
      break;
    case "Rejected":
      variant = "destructive";
      icon = <AlertTriangle className="mr-1 h-3 w-3" />;
      break;
    case "Under Review":
      variant = "outline"; // Neutral outline
      icon = <FileText className="mr-1 h-3 w-3" />;
      break;
  }
  return <Badge variant={variant} className="capitalize text-xs flex items-center whitespace-nowrap">{icon}{status}</Badge>;
};


export default function DashboardPage() {
  const { user } = useAuth();

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
          {mockUserLoans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockUserLoans.map((loan) => (
                <Card key={loan.id} className="bg-card-foreground/5">
                  <CardHeader>
                    <CardTitle className="text-lg">{loan.loanType}</CardTitle>
                    <StatusBadge status={loan.status} />
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Amount: <span className="font-semibold">${loan.amount.toLocaleString()}</span></p>
                    {loan.nextPaymentDate && (
                      <p className="flex items-center"><CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" /> Next Payment: {new Date(loan.nextPaymentDate).toLocaleDateString()}</p>
                    )}
                    {loan.nextPaymentAmount && (
                       <p>Next Payment Amount: <span className="font-semibold">${loan.nextPaymentAmount.toLocaleString()}</span></p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You have no active loans. <Link href={ROUTES.APPLY_LOAN} className="text-accent hover:underline">Apply for one now!</Link></p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-6 w-6 text-primary" />Payment History</CardTitle>
          <CardDescription>Your recent payment activities for Loan ID: loan1.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockPaymentHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPaymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
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
            <p className="text-muted-foreground">No payment history available for this loan.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
