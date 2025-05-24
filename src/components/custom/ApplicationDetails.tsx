
"use client";
import type { LoanApplication, CollateralDocument } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCircle, CalendarDays, IndianRupee, Briefcase, ShieldQuestion, Info, Paperclip, Users as UsersIcon } from "lucide-react";
import FormattedDate from "@/components/custom/FormattedDate";

interface ApplicationDetailsProps {
  application: LoanApplication;
}

// Helper to format document names for display
const formatDocumentName = (prefix: string, name?: string) => {
  if (name) {
    return { label: prefix, value: name };
  }
  return null;
};

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
  const allDocumentNames: { label: string; value: string }[] = [];

  // Borrower documents
  if (application.borrowerIdProofDocumentName) {
    allDocumentNames.push({ label: "Borrower ID Proof", value: application.borrowerIdProofDocumentName });
  }
  if (application.borrowerAddressProofDocumentName) {
    allDocumentNames.push({ label: "Borrower Address Proof", value: application.borrowerAddressProofDocumentName });
  }

  // Guarantor documents
  if (application.guarantor) {
    if (application.guarantor.idProofDocumentName) {
      allDocumentNames.push({ label: "Guarantor ID Proof", value: application.guarantor.idProofDocumentName });
    }
    if (application.guarantor.addressProofDocumentName) {
      allDocumentNames.push({ label: "Guarantor Address Proof", value: application.guarantor.addressProofDocumentName });
    }
  }

  // Collateral documents
  if (application.submittedCollateral && application.submittedCollateral.length > 0) {
    application.submittedCollateral.forEach((collateral, index) => {
      const prefix = `Collateral ${index + 1} (${collateral.type.replace(/_/g, ' ')})`;
      const collateralDocs: (ReturnType<typeof formatDocumentName>)[] = [
        formatDocumentName(`${prefix} - ATM Front`, collateral.atmCardFrontImageName),
        formatDocumentName(`${prefix} - ATM Back`, collateral.atmCardBackImageName),
        formatDocumentName(`${prefix} - Cheque Image`, collateral.chequeImageName),
        formatDocumentName(`${prefix} - Bank Statement`, collateral.bankStatementFileName),
        formatDocumentName(`${prefix} - Vehicle RC`, collateral.vehicleRcImageName),
        formatDocumentName(`${prefix} - Vehicle Image`, collateral.vehicleImageName),
        formatDocumentName(`${prefix} - Property Papers`, collateral.propertyPapersFileName),
        formatDocumentName(`${prefix} - Property Image`, collateral.propertyImageName),
        formatDocumentName(`${prefix} - Asset Image`, collateral.assetImageName),
      ];
      collateralDocs.forEach(doc => {
        if (doc) allDocumentNames.push(doc);
      });
    });
  }
  
  // General supporting documents (if we add this field to the model later)
  // Example:
  // if (application.generalSupportingDocuments && application.generalSupportingDocuments.length > 0) {
  //   application.generalSupportingDocuments.forEach((doc, index) => {
  //     if (doc.name) allDocumentNames.push({ label: `General Document ${index + 1}`, value: doc.name });
  //   });
  // }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Loan Application Details
        </CardTitle>
        <CardDescription>Application ID: {application.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-1 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />Applicant Information</h3>
            <p><strong className="text-muted-foreground">Name:</strong> {application.borrowerFullName || application.fullName}</p>
            <p><strong className="text-muted-foreground">Email:</strong> {application.borrowerEmail || application.email}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />Application Timeline</h3>
            <p><strong className="text-muted-foreground">Submitted:</strong> <FormattedDate dateString={application.applicationDate || application.submittedDate} /></p>
            <div>
                <strong className="text-muted-foreground">Status:</strong>{' '}
                <Badge variant={application.status === "Approved" ? "default" : application.status === "Rejected" ? "destructive" : "secondary"} className="capitalize">{application.status}</Badge>
            </div>
            {application.approvedDate && (
                 <p><strong className="text-muted-foreground">Approved:</strong> <FormattedDate dateString={application.approvedDate} /></p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold flex items-center"><IndianRupee className="mr-2 h-5 w-5 text-muted-foreground" />Loan Details</h3>
          <p><strong className="text-muted-foreground">Amount Requested:</strong> ₹{application.requestedAmount?.toLocaleString() || application.loanAmount?.toLocaleString() || 'N/A'}</p>
          <p><strong className="text-muted-foreground">Purpose:</strong> {application.purpose || application.loanPurpose}</p>
           {application.approvedAmount && application.approvedAmount > 0 && (
             <p><strong className="text-muted-foreground">Amount Approved:</strong> ₹{application.approvedAmount.toLocaleString()}</p>
           )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
                <h3 className="font-semibold mb-1 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />Financial Profile (User Stated)</h3>
                <p><strong className="text-muted-foreground">Annual Income:</strong> ₹{application.income?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">Employment:</strong> {application.employmentStatus || 'N/A'}</p>
            </div>
            <div>
                <h3 className="font-semibold mb-1 flex items-center"><ShieldQuestion className="mr-2 h-5 w-5 text-muted-foreground" />Credit Information (User Stated)</h3>
                <p><strong className="text-muted-foreground">Credit Score:</strong> {application.creditScore || 'Not Provided'}</p>
            </div>
        </div>

        {application.guarantor && (
            <div className="space-y-2">
                <h3 className="font-semibold mb-1 flex items-center"><UsersIcon className="mr-2 h-5 w-5 text-muted-foreground" />Guarantor Information</h3>
                <p><strong className="text-muted-foreground">Name:</strong> {application.guarantor.fullName}</p>
                <p><strong className="text-muted-foreground">Contact:</strong> {application.guarantor.contactNo}</p>
                <p><strong className="text-muted-foreground">Address:</strong> {application.guarantor.address}</p>
            </div>
        )}

        {application.submittedCollateral && application.submittedCollateral.length > 0 && (
             <div className="space-y-2">
                <h3 className="font-semibold mb-1 flex items-center"><Paperclip className="mr-2 h-5 w-5 text-muted-foreground" />Submitted Collateral</h3>
                {application.submittedCollateral.map((collateral, index) => (
                    <div key={index} className="pl-4 border-l-2 border-muted-foreground/20 py-1 my-1">
                        <p className="font-medium">{collateral.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{collateral.description}</p>
                        {collateral.estimatedValue && <p className="text-xs text-muted-foreground">Value: ₹{collateral.estimatedValue.toLocaleString()}</p>}
                        {collateral.atmPin && <p className="text-xs text-destructive">ATM PIN Provided (Sensitive)</p>}
                        {collateral.chequeNumber && <p className="text-xs text-muted-foreground">Cheque No: {collateral.chequeNumber}</p>}
                         {collateral.vehicleChallanDetails && <p className="text-xs text-muted-foreground">Challan: {collateral.vehicleChallanDetails}</p>}
                         {collateral.assetDetails && <p className="text-xs text-muted-foreground">Asset Details: {collateral.assetDetails}</p>}
                    </div>
                ))}
            </div>
        )}


        <div className="space-y-2">
          <h3 className="font-semibold flex items-center"><Info className="mr-2 h-5 w-5 text-muted-foreground" />Uploaded Document Names</h3>
          {allDocumentNames.length > 0 ? (
            <ul className="list-disc list-inside pl-5 space-y-1 text-sm">
              {allDocumentNames.map((doc, index) => (
                <li key={index}>
                  <strong className="text-muted-foreground">{doc.label}:</strong> {doc.value}
                  {/* Later, if doc.value becomes a URL: <a href={doc.value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-1">(View)</a> */}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No document names found in this application record.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
