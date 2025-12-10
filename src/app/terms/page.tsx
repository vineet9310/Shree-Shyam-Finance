// src/app/terms/page.tsx
import { APP_NAME } from "@/lib/constants";
import { AppLogo } from "@/components/custom/AppLogo";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/">
                        <AppLogo iconClassName="h-8 w-8" textClassName="text-xl" />
                    </Link>
                    <Link href="/" className="text-primary hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
                <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground">
                            Welcome to {APP_NAME}. These Terms and Conditions govern your use of our loan services
                            and platform. By accessing or using our services, you agree to be bound by these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility</h2>
                        <p className="text-muted-foreground">To be eligible for a loan, you must:</p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Be at least 21 years of age</li>
                            <li>Be an Indian resident</li>
                            <li>Have a valid government-issued ID proof</li>
                            <li>Have a valid address proof</li>
                            <li>Meet our minimum credit score requirements</li>
                            <li>Have a regular source of income</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Loan Terms</h2>
                        <p className="text-muted-foreground">
                            Our loan terms include but are not limited to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Interest rates ranging from 8% to 18% per annum depending on loan type and risk assessment</li>
                            <li>Loan tenure from 3 months to 60 months</li>
                            <li>Processing fee of 2% of the loan amount</li>
                            <li>Late payment penalty of 0.5% per day on overdue amount</li>
                            <li>Prepayment charges of 2% if loan is closed before 6 months</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Repayment</h2>
                        <p className="text-muted-foreground">
                            You agree to repay the loan amount along with interest as per the agreed repayment schedule.
                            Payments should be made on or before the due date to avoid late payment penalties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Collateral</h2>
                        <p className="text-muted-foreground">
                            Depending on the loan type and amount, collateral may be required. The collateral provided
                            remains our security until the loan is fully repaid. Failure to repay may result in
                            forfeiture of collateral.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Default</h2>
                        <p className="text-muted-foreground">
                            In case of default (non-payment for more than 90 days), we reserve the right to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Report to credit bureaus</li>
                            <li>Initiate legal proceedings</li>
                            <li>Forfeit any collateral provided</li>
                            <li>Recover outstanding amount through legal means</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Privacy</h2>
                        <p className="text-muted-foreground">
                            Your personal and financial information is handled as per our Privacy Policy.
                            We are committed to protecting your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Modifications</h2>
                        <p className="text-muted-foreground">
                            We reserve the right to modify these terms at any time. Changes will be effective
                            upon posting on our website. Continued use of our services constitutes acceptance
                            of modified terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Governing Law</h2>
                        <p className="text-muted-foreground">
                            These terms are governed by the laws of India. Any disputes shall be subject to
                            the exclusive jurisdiction of courts in [Your City], India.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact</h2>
                        <p className="text-muted-foreground">
                            For any questions regarding these terms, please contact us at:
                        </p>
                        <p className="text-muted-foreground mt-2">
                            Email: support@shreeshyamfinance.com<br />
                            Address: Your Business Address
                        </p>
                    </section>
                </div>
            </main>

            <footer className="border-t bg-card mt-12">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
