"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication, LoanApplicationStatus } from '@/lib/types';
import { getMockApplications } from '@/components/custom/LoanApplicationClient'; // Import the mock data
import { ApplicationDetails } from '@/components/custom/ApplicationDetails';
import { RiskAssessmentClient } from '@/components/custom/RiskAssessmentClient';
import { ArrowLeft, CheckCircle, XCircle, Edit3 } from "lucide-react";
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
} from "@/components/ui/alert-dialog"


// Utility to convert File to Base64 Data URI
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

  const applicationId = params.id as string;

  useEffect(() => {
    if (applicationId) {
      setIsLoading(true);
      const mockApps = getMockApplications() as LoanApplication[]; // This is how it was typed in LoanApplicationClient
      const foundApp = mockApps.find(app => app.id === applicationId);
      
      if (foundApp) {
        // Simulate processing documents if they exist from form submission
        // The form stores File objects in `supportingDocuments` (if any)
        // The AI flow expects `processedDocuments` with data URIs.
        const processDocs = async () => {
          if (foundApp.supportingDocuments && Array.isArray(foundApp.supportingDocuments)) {
            const processedDocs = await Promise.all(
              (foundApp.supportingDocuments as unknown as File[]).map(async (file) => {
                // Check if it's actually a File object, not just metadata
                if (file instanceof File) { 
                  const dataUri = await fileToDataURI(file);
                  return { name: file.name, dataUri };
                }
                // If it's already metadata (e.g. from a previous load where File objects aren't persisted)
                // This scenario needs careful handling in a real app. For mock, assume we always have files if needed.
                // For now, if it's not a File, we can't generate a dataUri.
                return { name: (file as any).name || 'unknown_file', dataUri: ''}; // Or filter out
              })
            );
            // Filter out docs that couldn't be processed
            return processedDocs.filter(doc => doc.dataUri !== '');
          }
          return [];
        };

        processDocs().then(processedDocuments => {
          setApplication({ ...foundApp, processedDocuments });
          setIsLoading(false);
        }).catch(err => {
          console.error("Error processing documents:", err);
          setApplication(foundApp); // Set app without processed docs or with partial
          setIsLoading(false);
        });

      } else {
        setIsLoading(false);
        // Handle not found, e.g. redirect or show error
      }
    }
  }, [applicationId]);

  const updateApplicationStatus = (status: LoanApplicationStatus) => {
    if (application) {
      // In a real app, this would be an API call.
      // For mock: update the status in the mockApplications array.
      const mockApps = getMockApplications();
      const appIndex = mockApps.findIndex(app => app.id === application.id);
      if (appIndex !== -1) {
        mockApps[appIndex].status = status;
      }
      setApplication({ ...application, status });
      toast({
        title: `Application ${status}`,
        description: `Loan application for ${application.fullName} has been ${status.toLowerCase()}.`,
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p>Loading application details...</p></div>;
  }

  if (!application) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p>Application not found.</p></div>;
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
              <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" disabled={application.status === 'Approved'}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve this loan application for {application.fullName}? This action cannot be undone easily.
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
                  Are you sure you want to reject this loan application for {application.fullName}? This action cannot be undone easily.
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
