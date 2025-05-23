
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication } from '@/lib/types';
import { ApplicationDetails } from '@/components/custom/ApplicationDetails';
import { RiskAssessmentClient } from '@/components/custom/RiskAssessmentClient';
import { ArrowLeft, CheckCircle, XCircle, Edit3, Loader2, AlertTriangleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Helper function for client-side basic ID validation
const isValidMongoIdClientSide = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export default function AdminApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const applicationId = params.id as string;

  useEffect(() => {
    if (!applicationId) {
      setIsLoading(true);
      setError(null);
      setApplication(null);
      return;
    }

    if (applicationId === "[id]") {
        setError("Invalid page URL. Please select a specific application to view from the dashboard.");
        setIsLoading(false);
        setApplication(null);
        return;
    }

    if (!isValidMongoIdClientSide(applicationId)) {
      setError("Invalid Application ID format in URL.");
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
          const appData = data.application;
          setApplication({
            ...appData,
            fullName: appData.borrowerFullName || (appData.borrowerUserId as any)?.name || 'N/A',
            email: appData.borrowerEmail || (appData.borrowerUserId as any)?.email || 'N/A',
            loanAmount: appData.requestedAmount, 
            loanPurpose: appData.purpose,      
            submittedDate: appData.applicationDate, 
            income: appData.income || 0, 
            employmentStatus: appData.employmentStatus || 'N/A', 
            creditScore: appData.creditScore || 0, 
            processedDocuments: appData.processedDocuments || [],
          });
        } else {
          setError(data.message || 'Could not fetch application details');
          setApplication(null);
        }
      })
      .catch(err => {
        console.error("Error fetching application details:", err);
        setError(err.message || "An unexpected error occurred while fetching the application.");
        setApplication(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [applicationId]);

  const handleUpdateApplicationStatus = async (newStatus: LoanApplication['status']) => {
    if (!application || !application.id) {
      toast({ title: "Error", description: "Application data not available.", variant: "destructive" });
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/loan-applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setApplication(prev => prev ? {
          ...prev,
          ...result.application, // Update with the full application object from API
           // Ensure frontend specific mappings are reapplied if API response structure differs
           fullName: result.application.borrowerFullName || (result.application.borrowerUserId as any)?.name || 'N/A',
           email: result.application.borrowerEmail || (result.application.borrowerUserId as any)?.email || 'N/A',
           loanAmount: result.application.requestedAmount,
           loanPurpose: result.application.purpose,
           submittedDate: result.application.applicationDate,
        } : null);
        toast({
          title: "Status Updated",
          description: `Loan application for ${application.borrowerFullName || 'N/A'} is now ${newStatus.toLowerCase()}.`,
        });
      } else {
        throw new Error(result.message || "Failed to update application status.");
      }
    } catch (err: any) {
      console.error("Error updating application status:", err);
      toast({
        title: "Update Failed",
        description: err.message || "Could not update application status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!applicationId && !error && isLoading) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /><p>Loading application ID...</p></div>;
  }
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /><p>Loading application details...</p></div>;
  }

  if (error) {
     return (
      <div className="space-y-4 p-4">
         <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
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
         <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
          </Button>
        <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Application Not Found</AlertTitle>
            <AlertDescription>The requested loan application could not be found or an error occurred after attempting to load.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
      </Button>
      
      <ApplicationDetails application={application} />
      
      <RiskAssessmentClient application={application} />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Edit3 className="h-6 w-6 text-primary"/>Application Actions</CardTitle>
          <CardDescription>Approve or reject this loan application.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" 
                disabled={application.status === 'Approved' || isUpdatingStatus}
              >
                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve this loan application for {application.borrowerFullName || 'N/A'}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleUpdateApplicationStatus('Approved')} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUpdatingStatus}>
                  {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto" 
                disabled={application.status === 'Rejected' || isUpdatingStatus}
              >
                 {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reject this loan application for {application.borrowerFullName || 'N/A'}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleUpdateApplicationStatus('Rejected')} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isUpdatingStatus}>
                  {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Reject
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

