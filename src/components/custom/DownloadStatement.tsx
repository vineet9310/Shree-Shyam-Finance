"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LoanApplication, PaymentRecord } from "@/lib/types";

interface DownloadStatementProps {
    loan: LoanApplication;
    transactions?: PaymentRecord[];
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadStatement({
    loan,
    transactions = [],
    variant = "outline",
    size = "sm",
}: DownloadStatementProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDownload = useCallback(async () => {
        setLoading(true);
        try {
            // Dynamic import to avoid SSR issues
            const { generateLoanStatement, downloadPDF } = await import("@/lib/pdf-generator");

            const generatedDate = new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });

            const doc = generateLoanStatement({
                loan,
                transactions,
                generatedDate,
            });

            const filename = `LoanStatement_${loan.id}_${new Date().toISOString().split("T")[0]}.pdf`;
            downloadPDF(doc, filename);

            toast({
                title: "Statement Downloaded",
                description: "Your loan statement has been downloaded successfully.",
            });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({
                title: "Download Failed",
                description: "Failed to generate PDF. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [loan, transactions, toast]);

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Statement
                </>
            )}
        </Button>
    );
}

interface DownloadAgreementProps {
    loan: LoanApplication;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadAgreement({
    loan,
    variant = "outline",
    size = "sm",
}: DownloadAgreementProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDownload = useCallback(async () => {
        setLoading(true);
        try {
            const { generateLoanAgreement, downloadPDF } = await import("@/lib/pdf-generator");

            const doc = generateLoanAgreement(loan);

            const filename = `LoanAgreement_${loan.id}.pdf`;
            downloadPDF(doc, filename);

            toast({
                title: "Agreement Downloaded",
                description: "Your loan agreement has been downloaded successfully.",
            });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({
                title: "Download Failed",
                description: "Failed to generate PDF. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [loan, toast]);

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <FileText className="mr-2 h-4 w-4" />
                    Download Agreement
                </>
            )}
        </Button>
    );
}
