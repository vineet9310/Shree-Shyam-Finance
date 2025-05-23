// src/app/actions.ts
'use server';
import { assessLoanRisk, AssessLoanRiskInput, AssessLoanRiskOutput } from '@/ai/flows/loan-risk-assessment';
import { LoanApplication } from '@/lib/types'; // Assuming this type exists and includes processedDocuments

// Helper to convert File to Base64 Data URI (cannot be in this server action file directly if used on client before sending)
// This implies files are already converted to data URIs before this action is called.

export async function performRiskAssessmentAction(application: LoanApplication): Promise<AssessLoanRiskOutput> {
  if (!application.processedDocuments || application.processedDocuments.length === 0) {
    console.warn("No supporting documents provided for risk assessment for application ID:", application.id);
    // Optionally, proceed without documents or return a specific error/response
  }

  const applicationDataForAI = {
    fullName: application.fullName,
    email: application.email,
    loanAmount: application.loanAmount,
    loanPurpose: application.loanPurpose,
    income: application.income,
    employmentStatus: application.employmentStatus,
    creditScore: application.creditScore,
    submittedDate: application.submittedDate,
    status: application.status,
  };

  const input: AssessLoanRiskInput = {
    applicationData: JSON.stringify(applicationDataForAI),
    supportingDocuments: application.processedDocuments?.map(doc => doc.dataUri) || [],
  };

  try {
    console.log("Calling assessLoanRisk with input:", {
      applicationDataLength: input.applicationData.length,
      numDocuments: input.supportingDocuments.length,
      firstDocUriLength: input.supportingDocuments[0]?.length
    });
    const result = await assessLoanRisk(input);
    return result;
  } catch (error) {
    console.error("Error in performRiskAssessmentAction:", error);
    // Check if error is an object and has a message property
    const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred during risk assessment.";
    throw new Error(`Failed to perform risk assessment: ${errorMessage}`);
  }
}
