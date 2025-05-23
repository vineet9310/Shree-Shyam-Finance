
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LoanApplication, LoanApplicationStatus } from "@/lib/types";
import { getMockApplications } from '@/components/custom/LoanApplicationClient'; // Import the mock data
import { Eye, ShieldCheck, Clock, AlertTriangle, CheckCircle2, FileText, UserCircle, DollarSign } from "lucide-react";
import { ROUTES } from '@/lib/constants';
import FormattedDate from "@/components/custom/FormattedDate";

const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = <Clock className="mr-1 h-3 w-3" />;

  switch (status) {
    case "Approved":
      variant = "default";
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
      variant = "outline";
      icon = <FileText className="mr-1 h-3 w-3" />;
      break;
  }
  return <Badge variant={variant} className="capitalize text-xs flex items-center whitespace-nowrap">{icon}{status}</Badge>;
};


export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);

  useEffect(() => {
    // Fetch mock applications
    // In a real app, this would be an API call
    setApplications(getMockApplications() as LoanApplication[]);
  }, []);

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
                    <TableCell className="font-medium">{app.fullName}</TableCell>
                    <TableCell>${app.loanAmount.toLocaleString()}</TableCell>
                    <TableCell><FormattedDate dateString={app.submittedDate} /></TableCell>
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
