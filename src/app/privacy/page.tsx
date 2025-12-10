// src/app/privacy/page.tsx
import { APP_NAME } from "@/lib/constants";
import { AppLogo } from "@/components/custom/AppLogo";
import Link from "next/link";

export default function PrivacyPage() {
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
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
                        <p className="text-muted-foreground">
                            We collect information you provide directly to us, including:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Personal identification information (Name, email, phone, address)</li>
                            <li>Government ID documents (Aadhaar, PAN, Voter ID, etc.)</li>
                            <li>Financial information (Income, employment details, bank statements)</li>
                            <li>Collateral documentation</li>
                            <li>Transaction history</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
                        <p className="text-muted-foreground">We use the information we collect to:</p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Process and evaluate loan applications</li>
                            <li>Verify your identity and eligibility</li>
                            <li>Manage your loan account</li>
                            <li>Send payment reminders and notifications</li>
                            <li>Comply with legal and regulatory requirements</li>
                            <li>Improve our services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Security</h2>
                        <p className="text-muted-foreground">
                            We implement appropriate security measures to protect your personal information:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Encrypted data transmission (SSL/TLS)</li>
                            <li>Secure cloud storage for documents</li>
                            <li>Password protection with hashing</li>
                            <li>Access controls and authentication</li>
                            <li>Regular security audits</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Information Sharing</h2>
                        <p className="text-muted-foreground">
                            We may share your information with:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Credit bureaus for credit reporting</li>
                            <li>Government authorities as required by law</li>
                            <li>Service providers who assist in our operations</li>
                            <li>Legal entities in case of disputes</li>
                        </ul>
                        <p className="text-muted-foreground mt-4">
                            We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Retention</h2>
                        <p className="text-muted-foreground">
                            We retain your personal information as long as necessary to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Maintain your loan account</li>
                            <li>Comply with legal obligations</li>
                            <li>Resolve disputes</li>
                            <li>Enforce agreements</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
                        <p className="text-muted-foreground">You have the right to:</p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                            <li>Access your personal information</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your data (subject to legal requirements)</li>
                            <li>Opt-out of marketing communications</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies</h2>
                        <p className="text-muted-foreground">
                            We use cookies and similar technologies to improve your experience on our platform.
                            You can manage cookie preferences through your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to This Policy</h2>
                        <p className="text-muted-foreground">
                            We may update this Privacy Policy from time to time. We will notify you of any
                            material changes by posting the new policy on this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
                        <p className="text-muted-foreground">
                            If you have questions about this Privacy Policy, please contact us at:
                        </p>
                        <p className="text-muted-foreground mt-2">
                            Email: privacy@shreeshyamfinance.com<br />
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
