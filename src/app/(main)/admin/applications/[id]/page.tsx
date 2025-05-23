
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
  const [isLoading, setIsLoading] = useState(true); // Start with true
  const [error, setError] = useState<string | null>(null);

  const applicationId = params.id as string;

  useEffect(() => {
    // If applicationId is not yet available from the router, keep loading.
    if (!applicationId) {
      setIsLoading(true);
      setError(null); // Clear any previous error
      setApplication(null);
      return;
    }

    // If applicationId is the literal string "[id]", it's an invalid navigation.
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

    // Proceed with fetching only if ID is valid and not the placeholder
    setIsLoading(true);
    setError(null); // Clear previous errors before fetching
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
          // Map fields carefully for ApplicationDetails and RiskAssessmentClient
          setApplication({
            ...appData,
            // Fields expected by ApplicationDetails component
            fullName: appData.borrowerFullName || (appData.borrowerUserId as any)?.name || 'N/A',
            email: appData.borrowerEmail || (appData.borrowerUserId as any)?.email || 'N/A',
            loanAmount: appData.requestedAmount, // ApplicationDetails uses loanAmount
            loanPurpose: appData.purpose,       // ApplicationDetails uses loanPurpose
            submittedDate: appData.applicationDate, // ApplicationDetails uses submittedDate
            income: appData.income || 0, // Ensure income is present
            employmentStatus: appData.employmentStatus || 'N/A', // Ensure present
            creditScore: appData.creditScore || 0, // Ensure present
            // processedDocuments for RiskAssessmentClient
            // The API currently does not return processedDocuments.
            // This will be an empty array unless API is updated.
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

  const updateApplicationStatus = (status: LoanApplication['status']) => {
    if (application) {
      // TODO: Implement API call to update status
      console.log(`TODO: API call to update status to ${status} for app ID ${application.id}`);
      setApplication({ ...application, status });
      toast({
        title: `Application status would be ${status}`,
        description: `(Backend update not yet implemented) Loan application for ${application.borrowerFullName || 'N/A'} would be ${status.toLowerCase()}.`,
      });
    }
  };

  // Initial loading state if applicationId isn't available yet and no error has occurred
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
          <CardDescription>Approve or reject this loan application (Backend for status update not yet implemented).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" disabled={application.status === 'Approved'}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve this loan application for {application.borrowerFullName || 'N/A'}? This action cannot be undone easily.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => updateApplicationStatus('Approved')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Confirm Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto" disabled={application.status === 'Rejected'}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reject this loan application for {application.borrowerFullName || 'N/A'}? This action cannot be undone easily.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => updateApplicationStatus('Rejected')} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
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
