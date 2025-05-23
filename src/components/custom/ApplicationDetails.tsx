
"use client";
import type { LoanApplication } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Link as LinkIcon, UserCircle, CalendarDays, DollarSign, Briefcase, ShieldQuestion, Info } from "lucide-react";
import FormattedDate from "@/components/custom/FormattedDate";

interface ApplicationDetailsProps {
  application: LoanApplication;
}

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
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
            <p><strong className="text-muted-foreground">Name:</strong> {application.fullName}</p>
            <p><strong className="text-muted-foreground">Email:</strong> {application.email}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />Application Timeline</h3>
            <p><strong className="text-muted-foreground">Submitted:</strong> <FormattedDate dateString={application.submittedDate} /></p>
            <p><strong className="text-muted-foreground">Status:</strong> <Badge variant={application.status === "Approved" ? "default" : application.status === "Rejected" ? "destructive" : "secondary"} className="capitalize">{application.status}</Badge></p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold flex items-center"><DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />Loan Details</h3>
          <p><strong className="text-muted-foreground">Amount Requested:</strong> ${application.loanAmount.toLocaleString()}</p>
          <p><strong className="text-muted-foreground">Purpose:</strong> {application.loanPurpose}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
                <h3 className="font-semibold mb-1 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />Financial Profile</h3>
                <p><strong className="text-muted-foreground">Annual Income:</strong> ${application.income.toLocaleString()}</p>
                <p><strong className="text-muted-foreground">Employment:</strong> {application.employmentStatus}</p>
            </div>
            <div>
                <h3 className="font-semibold mb-1 flex items-center"><ShieldQuestion className="mr-2 h-5 w-5 text-muted-foreground" />Credit Information</h3>
                <p><strong className="text-muted-foreground">Credit Score:</strong> {application.creditScore || 'Not Provided'}</p>
            </div>
        </div>

        {application.processedDocuments && application.processedDocuments.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Supporting Documents</h3>
            <ul className="list-disc list-inside pl-5 space-y-1">
              {application.processedDocuments.map((doc, index) => (
                <li key={index} className="text-sm">
                  <a 
                    href={doc.dataUri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent hover:underline flex items-center"
                  >
                    <LinkIcon className="mr-1 h-4 w-4" /> {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
         {(!application.processedDocuments || application.processedDocuments.length === 0) && (
            <div className="space-y-2">
                <h3 className="font-semibold flex items-center"><Info className="mr-2 h-5 w-5 text-muted-foreground" />Supporting Documents</h3>
                <p className="text-sm text-muted-foreground">No supporting documents were uploaded with this application.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
