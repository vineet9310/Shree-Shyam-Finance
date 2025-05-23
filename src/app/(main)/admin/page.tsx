
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LoanApplication, LoanApplicationStatus } from "@/lib/types"; 
// Removed: import { getMockApplications } from '@/components/custom/LoanApplicationClient';
import { Eye, ShieldCheck, Clock, AlertTriangle, CheckCircle2, FileText, UserCircle, DollarSign, Loader2 } from "lucide-react";
import { ROUTES } from '@/lib/constants';
import FormattedDate from "@/components/custom/FormattedDate";
import { useToast } from '@/hooks/use-toast';

const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = <Clock className="mr-1 h-3 w-3" />;

  switch (status) {
    case "Approved":
    case "Active": // Treat Active similar to Approved for badge color
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
      variant = "outline"; // Neutral outline
      icon = <FileText className="mr-1 h-3 w-3" />;
      break;
    default:
      icon = <FileText className="mr-1 h-3 w-3" />; // Fallback for any new statuses
  }
  return <Badge variant={variant} className="capitalize text-xs flex items-center whitespace-nowrap">{icon}{status}</Badge>;
};


export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/loan-applications');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch loan applications');
        }
        const data = await response.json();
        if (data.success) {
          setApplications(data.applications);
        } else {
          throw new Error(data.message || 'Failed to fetch loan applications');
        }
      } catch (err: any) {
        console.error("Error fetching applications:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: err.message || "Could not load applications.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-destructive">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-xl font-semibold">Failed to load applications</p>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Retry</Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-primary" /> Admin Dashboard
      </h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Loan Applications Overview</CardTitle>
          <CardDescription>Review and manage all submitted loan applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><UserCircle className="inline-block mr-1 h-4 w-4" />Applicant Name</TableHead>
                  <TableHead><DollarSign className="inline-block mr-1 h-4 w-4" />Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{ (app.borrowerUserId as any)?.name || 'N/A'}</TableCell>
                    <TableCell>${app.requestedAmount.toLocaleString()}</TableCell>
                    <TableCell><FormattedDate dateString={app.applicationDate} /></TableCell>
                    <TableCell><StatusBadge status={app.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={ROUTES.ADMIN_APPLICATION_DETAIL(app.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No loan applications submitted yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
