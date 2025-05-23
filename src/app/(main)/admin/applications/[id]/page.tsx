
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication, LoanApplicationStatus } from '@/lib/types';
// Removed: import { getMockApplications } from '@/components/custom/LoanApplicationClient';
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

// Utility to convert File to Base64 Data URI (Placeholder - not fully used without actual file uploads)
const fileToDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export default function AdminApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationId = params.id as string;

  useEffect(() => {
    if (!isValidMongoIdClientSide(applicationId)) {
      setError("Invalid Application ID in URL.");
      setIsLoading(false);
      setApplication(null); // Ensure application is null
      return;
    }

    setIsLoading(true);
    setError(null);
    fetch(`/api/loan-applications/${applicationId}`)
      .then(res => {
        if (!res.ok) {
          // Try to parse error message from backend if available
          return res.json().then(errData => {
            throw new Error(errData.message || `Failed to fetch application. Status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.application) {
          // Placeholder for document processing - adapt when file uploads are implemented
          // For now, RiskAssessmentClient might not have actual document content.
          const appWithProcessedDocs = {
            ...data.application,
            // Example: if your LoanApplication type from API contains file metadata
            // and you need to simulate data URIs for RiskAssessmentClient
            processedDocuments: data.application.submittedCollateral?.filter((doc: any) => doc.someDocumentUrl)
              .map((doc: any) => ({ name: doc.description || 'document', dataUri: doc.someDocumentUrl || '' })) || []
          };
          setApplication(appWithProcessedDocs);
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

  const updateApplicationStatus = (status: LoanApplicationStatus) => {
    if (application) {
      // TODO: Implement API call to update status
      // For now, just update client state and show toast
      console.log(`TODO: API call to update status to ${status} for app ID ${application.id}`);
      setApplication({ ...application, status });
      toast({
        title: `Application status would be ${status}`,
        description: `(Backend update not yet implemented) Loan application for ${application.borrowerFullName || 'N/A'} would be ${status.toLowerCase()}.`,
      });
    }
  };

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
            <AlertDescription>The requested loan application could not be found or an error occurred.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
      </Button>
      
      {/* The ApplicationDetails component needs a 'fullName' and 'email' from the application object */}
      {/* It also expects 'loanAmount', 'loanPurpose', etc. */}
      {/* Let's ensure we pass what it needs based on LoanApplication type. */}
      <ApplicationDetails 
        application={{
          ...application,
          // Ensure these fields are present and correctly typed for ApplicationDetails
          fullName: application.borrowerFullName || 'N/A', 
          email: application.borrowerEmail || 'N/A',
          loanAmount: application.requestedAmount,
          loanPurpose: application.purpose,
          submittedDate: application.applicationDate,
          // Ensure other fields expected by ApplicationDetails are mapped if names differ
        }} 
      />
      
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
