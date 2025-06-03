// src/app/(main)/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LoanApplication, LoanApplicationStatus } from "@/lib/types";
import { Eye, ShieldCheck, Clock, AlertTriangle, CheckCircle2, FileText, UserCircle, IndianRupee, Loader2, BellRing, CalendarDays, Landmark, Mail } from "lucide-react"; // Added Mail
import { ROUTES } from '@/lib/constants';
import FormattedDate from "@/components/custom/FormattedDate";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton"; // For mobile card skeletons

const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" = "outline"; // Expanded variants for better mapping
  let icon = <Clock className="mr-1 h-3 w-3" />;
  let badgeClass = "capitalize text-xs flex items-center whitespace-nowrap px-2 py-0.5"; // Adjusted padding

  switch (status) {
    case "Approved":
      variant = "success"; // More semantic for Shadcn UI
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "Active":
      variant = "info"; // Using info for active
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "PaidOff":
      variant = "success";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "QueryInitiated":
      variant = "warning"; // Using warning for query
      icon = <BellRing className="mr-1 h-3 w-3" />;
      badgeClass += " animate-pulse"; // Added pulse for new queries
      break;
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
      variant = "outline"; // Kept outline, can be changed
      icon = <FileText className="mr-1 h-3 w-3" />;
      break;
    default:
      icon = <FileText className="mr-1 h-3 w-3" />;
  }
  return <Badge variant={variant} className={badgeClass}>{icon}{status}</Badge>;
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
      console.log("[AdminDashboardPage] Fetching applications...");
      try {
        const response = await fetch('/api/loan-applications');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from API' }));
          console.error("[AdminDashboardPage] API error response:", errorData);
          throw new Error(errorData.message || 'Failed to fetch loan applications');
        }
        const data = await response.json();
        console.log("[AdminDashboardPage] API success response data:", data);
        if (data.success && Array.isArray(data.applications)) {
          console.log("[AdminDashboardPage] Fetched applications from API. Count:", data.applications.length);
          if (data.applications.length > 0) {
            console.log("[AdminDashboardPage] First application object:", JSON.stringify(data.applications[0], null, 2));
          }
          // Filter out applications with missing or invalid IDs before setting state
          const validApplications = data.applications.filter(app => app && typeof app.id === 'string' && app.id.trim() !== '');
          setApplications(validApplications);
        } else {
          const errMsg = data.message || (Array.isArray(data.applications) ? 'Failed to fetch loan applications' : 'Invalid application data format from API');
          console.error("[AdminDashboardPage] Error or invalid data format from API:", errMsg, data);
          throw new Error(errMsg);
        }
      } catch (err: any) {
        console.error("[AdminDashboardPage] Error fetching applications:", err);
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

  const newApplicationCount = applications.filter(app => app && app.status === 'QueryInitiated').length;

  const renderMobileSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
        <Card key={`skeleton-mobile-${index}`} className="mb-4 shadow-md">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
            <div className="flex items-center justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
            <div className="flex items-center justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
            <Skeleton className="h-9 w-full mt-3" />
          </CardContent>
        </Card>
    ));
  };

  if (isLoading && applications.length === 0) { // Show full page loader only if no data yet
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 mt-2">Loading applications...</p>
      </div>
    );
  }

  if (error && applications.length === 0) { // Show full page error only if no data yet
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-12 w-12 mb-4 text-destructive" />
        <p className="text-xl font-semibold text-destructive">Failed to load applications</p>
        <p className="text-muted-foreground mt-1">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 w-full min-w-0"> {/* Added padding and min-w-0 */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 md:h-8 md:w-8 text-primary" /> Admin Dashboard
      </h1>

      {/* Summary Cards can be added here if needed, similar to previous versions */}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Loan Applications Overview</CardTitle>
          <CardDescription>
            Review and manage all submitted loan applications.
            {newApplicationCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
                <BellRing className="mr-1 h-3 w-3" /> {newApplicationCount} New Query
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            {isLoading && applications.length === 0 ? ( // Show loader inside card if still loading but no apps yet
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2">Loading table data...</p>
                 </div>
            ) : applications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]"><UserCircle className="inline-block mr-1.5 h-4 w-4" />Applicant Name</TableHead>
                    <TableHead><IndianRupee className="inline-block mr-1.5 h-4 w-4" />Amount</TableHead>
                    <TableHead><CalendarDays className="inline-block mr-1.5 h-4 w-4" />Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    if (!app || typeof app.id !== 'string' || app.id.trim() === '') {
                      console.warn("[AdminDashboardPage] Skipping rendering desktop row for app with missing or invalid ID:", app);
                      return null; 
                    }
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {app.borrowerFullName || ((app.borrowerUserId as any)?.name) || 'N/A'}
                        </TableCell>
                        <TableCell>₹{app.requestedAmount?.toLocaleString() || '0'}</TableCell>
                        <TableCell><FormattedDate dateString={app.applicationDate} /></TableCell>
                        <TableCell><StatusBadge status={app.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={ROUTES.ADMIN_APPLICATION_DETAIL(app.id)}>
                              <Eye className="mr-1.5 h-4 w-4" /> View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">No loan applications submitted yet.</p>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {isLoading && applications.length === 0 ? (
                renderMobileSkeletons(3)
            ): applications.length > 0 ? (
              applications.map((app) => {
                if (!app || typeof app.id !== 'string' || app.id.trim() === '') {
                  console.warn("[AdminDashboardPage] Skipping rendering mobile card for app with missing or invalid ID:", app);
                  return null;
                }
                const applicantName = app.borrowerFullName || ((app.borrowerUserId as any)?.name) || "Unknown Applicant";
                const loanAmount = app.requestedAmount;
                return (
                <Card key={app.id} className="shadow-md border">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                        <CardTitle className="text-base font-semibold truncate" title={applicantName}>
                            <UserCircle className="inline-block mr-2 h-4 w-4 text-muted-foreground" />
                            {applicantName}
                        </CardTitle>
                        <StatusBadge status={app.status} />
                    </div>
                    {app.borrowerEmail && (
                        <p className="text-xs text-muted-foreground flex items-center truncate">
                            <Mail className="inline-block mr-1.5 h-3 w-3" />
                            {app.borrowerEmail}
                        </p>
                    )}
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-2 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><IndianRupee className="mr-1.5 h-4 w-4"/>Amount:</span>
                        <span className="font-medium">
                            {typeof loanAmount === 'number' ? `₹${loanAmount.toLocaleString('en-IN')}` : 'N/A'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-1.5 h-4 w-4"/>Submitted:</span>
                        <FormattedDate dateString={app.applicationDate} />
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full mt-3">
                      <Link href={ROUTES.ADMIN_APPLICATION_DETAIL(app.id)}>
                        <Eye className="mr-2 h-4 w-4" /> View Application
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )})
            ) : (
              <p className="text-muted-foreground text-center py-8">No loan applications submitted yet.</p>
            )}
          </div>
           {/* Common error display if fetch fails but some apps were already loaded */}
           {error && applications.length > 0 && (
             <p className="text-center text-sm text-destructive mt-4">{error}</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
