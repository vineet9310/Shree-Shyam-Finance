
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication } from '@/lib/types';
import { ApplicationDetails } from '@/components/custom/ApplicationDetails';
import { ArrowLeft, Loader2, AlertTriangleIcon, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const isValidMongoIdClientSide = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export default function UserApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationId = params.id as string;

  useEffect(() => {
    if (!isValidMongoIdClientSide(applicationId)) {
      setError("Invalid Application ID in URL.");
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
          // Ensure the fetched application has the necessary fields for ApplicationDetails
          // The ApplicationDetails component expects fields like 'fullName', 'email', 'loanAmount', etc.
          // These should align with the LoanApplication type after backend population.
          const appData = data.application;
          setApplication({
            ...appData,
            // Map fields if necessary, assuming backend returns them directly in LoanApplication structure
            fullName: appData.borrowerFullName || (appData.borrowerUserId as any)?.name || 'N/A',
            email: appData.borrowerEmail || (appData.borrowerUserId as any)?.email || 'N/A',
            loanAmount: appData.requestedAmount,
            loanPurpose: appData.purpose,
            submittedDate: appData.applicationDate,
            income: appData.income || 0, // Example: ensure income is present
            employmentStatus: appData.employmentStatus || 'N/A', // Example
            creditScore: appData.creditScore || 0, // Example
            // Ensure all fields required by ApplicationDetails or LoanApplication are present
          });
        } else {
          setError(data.message || 'Could not fetch application details');
          setApplication(null);
        }
      })
      .catch(err => {
        console.error("Error fetching application details for user view:", err);
        setError(err.message || "An unexpected error occurred while fetching the application.");
        setApplication(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [applicationId]);

  const canEditApplication = application?.status === 'QueryInitiated' || application?.status === 'AdditionalInfoRequired';

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /><p>Loading application details...</p></div>;
  }

  if (error) {
     return (
      <div className="space-y-4 p-4">
         <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
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
         <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
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
      <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      
      <ApplicationDetails application={application} />

      {canEditApplication && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Manage Your Application</CardTitle>
                <CardDescription>You can edit your application details if needed.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button 
                    onClick={() => router.push(`${ROUTES.USER_APPLICATION_DETAIL(application.id)}/edit`)} // Placeholder for edit route
                    variant="outline"
                    disabled // Edit functionality to be implemented
                >
                    <Edit className="mr-2 h-4 w-4" /> Edit Application (Soon)
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
