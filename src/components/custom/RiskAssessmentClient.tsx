"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown, CircleHelp } from "lucide-react";
import { performRiskAssessmentAction } from '@/app/actions';
import type { LoanApplication } from '@/lib/types';
import type { AssessLoanRiskOutput } from '@/ai/flows/loan-risk-assessment';
import { Progress } from '@/components/ui/progress';

interface RiskAssessmentClientProps {
  application: LoanApplication;
}

export function RiskAssessmentClient({ application }: RiskAssessmentClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessLoanRiskOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAssessRisk = async () => {
    setIsLoading(true);
    setError(null);
    setAssessmentResult(null);
    try {
      // Ensure application.processedDocuments exists and contains data URIs
      if (!application.processedDocuments || application.processedDocuments.length === 0) {
        // If there are no documents from the application processing step,
        // we should handle this. For now, we might proceed or show an error.
        // The action itself also has a check.
        console.warn("Attempting risk assessment without processed documents for application:", application.id);
      }
      const result = await performRiskAssessmentAction(application);
      setAssessmentResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return "text-green-400"; // Low risk
    if (score <= 60) return "text-yellow-400"; // Medium risk
    if (score <= 100) return "text-red-400"; // High risk
    return "text-foreground";
  };
  
  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.toLowerCase().includes("approve")) return <ThumbsUp className="h-5 w-5 text-green-400" />;
    if (recommendation.toLowerCase().includes("reject") || recommendation.toLowerCase().includes("decline")) return <ThumbsDown className="h-5 w-5 text-red-400" />;
    return <CircleHelp className="h-5 w-5 text-yellow-400" />;
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          AI Risk Assessment
        </CardTitle>
        <CardDescription>Powered by GenAI to provide insights on loan applications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAssessRisk} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assessing...
            </>
          ) : (
            "Run Risk Assessment"
          )}
        </Button>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold">Assessment Failed</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {assessmentResult && (
          <div className="space-y-6 pt-4">
            <Card className="bg-card-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" />Assessment Complete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Overall Risk Score</p>
                  <div className="flex items-center gap-2">
                    <Progress value={assessmentResult.riskScore} className="w-full h-3" />
                    <span className={`text-2xl font-bold ${getRiskScoreColor(assessmentResult.riskScore)}`}>
                      {assessmentResult.riskScore}
                    </span>
                  </div>
                   <p className="text-xs text-muted-foreground mt-1">Score out of 100 (Lower is better)</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Recommended Action</h4>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    {getRecommendationIcon(assessmentResult.recommendedAction)}
                    {assessmentResult.recommendedAction}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Risk Assessment Summary</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{assessmentResult.riskAssessment}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
