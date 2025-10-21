"use server";

import dbConnect from "@/lib/mongodb";
import LoanApplicationModel from "@/models/LoanApplication";
// FIX: The imported function name was incorrect. It's 'assessLoanRisk'.
import { assessLoanRisk } from "@/ai/flows/loan-risk-assessment";
import { revalidatePath } from "next/cache";
import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

export async function performRiskAssessmentAction(applicationId: string) {
  try {
    await dbConnect();
    const application = await LoanApplicationModel.findById(applicationId);

    if (!application) {
      throw new Error("Application not found");
    }

    if (application.riskAssessment) {
      console.log("Risk assessment already exists. Skipping.");
      return {
        success: true,
        message: "Risk assessment already performed.",
        assessment: application.riskAssessment,
      };
    }

    // FIX: Use the correct function name 'assessLoanRisk' here.
    // Convert application to proper format
    const applicationData = JSON.stringify(application.toObject());
    const supportingDocuments = (application as any).processedDocuments?.map((doc: any) => doc.dataUri) || [];
    
    const assessmentResult = await assessLoanRisk({
      applicationData,
      supportingDocuments
    });

    // Map the AI result to our RiskAssessment type
    const riskAssessment = {
      score: assessmentResult.riskScore,
      reasoning: assessmentResult.riskAssessment,
      recommendation: assessmentResult.recommendedAction.toLowerCase().includes('approve') 
        ? 'approve' as const
        : assessmentResult.recommendedAction.toLowerCase().includes('reject')
        ? 'reject' as const
        : 'further_review' as const,
      assessedAt: new Date().toISOString(),
    };

    application.riskAssessment = riskAssessment;
    await application.save();

    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath(`/dashboard/application/${applicationId}`);

    return {
      success: true,
      message: "Risk assessment performed successfully.",
      assessment: riskAssessment,
    };
  } catch (error: any) {
    console.error("Error in performRiskAssessmentAction:", error);
    return {
      success: false,
      message: error.message || "Failed to perform risk assessment.",
      assessment: null,
    };
  }
}

/**
 * Extracts and verifies the JWT from cookies to get the user ID.
 * @param request - The NextRequest object.
 * @returns The user ID from the token payload.
 * @throws An error if the token is missing, invalid, or expired.
 */
 // FIX: Server Actions must be async functions. The function is now correctly marked as 'async'.
export async function getUserIdFromToken(request: NextRequest): Promise<string> {
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }

        const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);
        const userId = decodedToken.id;

        if (!userId) {
            throw new Error('Authentication failed. User ID not found in token.');
        }

        return userId;
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new Error('Your session has expired. Please log in again.');
        }
        throw error;
    }
}
