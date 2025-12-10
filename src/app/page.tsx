// src/app/page.tsx
"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { AppLogo } from "@/components/custom/AppLogo";
import Image from "next/image";
import shyamImage from '@/assets/KHATUSHYAM.jpg';
import { Shield, Clock, Calculator, Users, FileCheck, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "Instant EMI Calculator",
    description: "Calculate your loan EMI instantly with our smart calculator"
  },
  {
    icon: Clock,
    title: "Quick Approval",
    description: "Get loan approval within 24-48 hours of application"
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Your documents and data are encrypted and protected"
  },
  {
    icon: FileCheck,
    title: "Minimal Documentation",
    description: "Easy application process with minimal paperwork"
  },
  {
    icon: Users,
    title: "Flexible Terms",
    description: "Choose repayment plans that suit your budget"
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Our team is always here to help you"
  }
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.replace(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.replace(ROUTES.DASHBOARD);
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-foreground">Loading {APP_NAME}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-20 px-4 py-3 sm:p-6 flex justify-between items-center bg-background/95 backdrop-blur-sm shadow-sm h-16">
        <AppLogo iconClassName="h-8 w-8" textClassName="text-[18px] sm:text-2xl" />
        <nav>
          <ul className="flex items-center space-x-2 sm:space-x-4">
            <li><Link href={ROUTES.LOGIN} className="text-foreground hover:text-primary transition-colors font-medium">Login</Link></li>
            <li>
              <Button asChild className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Link href={ROUTES.REGISTER}>Register</Link>
              </Button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-screen overflow-hidden py-16 px-4 md:px-8 lg:px-12 pt-24">
        <Image
          src={shyamImage}
          alt="Background"
          fill
          style={{ objectFit: 'cover' }}
          priority
          className="z-0 opacity-20"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/90 to-background/70"></div>
        <div className="relative z-20 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left py-8">
            <p className="text-primary font-semibold text-lg mb-2">Your Trusted Financial Partner</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-6">
              Welcome to <span className="text-primary">{APP_NAME}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Secure and intuitive financial services tailored for you. Access your loans, apply for new ones, and manage your finances with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 px-6 rounded-lg">
                <Link href={ROUTES.APPLY_LOAN}>Get Started Today</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
                <Link href={ROUTES.LOGIN}>Existing Customer? Login</Link>
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="hidden lg:grid grid-cols-2 gap-6">
            <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border">
              <div className="text-4xl font-bold text-primary mb-2">₹10L+</div>
              <div className="text-muted-foreground">Max Loan Amount</div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border">
              <div className="text-4xl font-bold text-primary mb-2">8%</div>
              <div className="text-muted-foreground">Starting Interest Rate</div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border">
              <div className="text-4xl font-bold text-primary mb-2">24hrs</div>
              <div className="text-muted-foreground">Quick Approval</div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="w-full py-16 px-4 md:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why Choose {APP_NAME}?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            We offer the best financial solutions with transparent terms and quick processing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-border group">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 px-4 md:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Apply for a loan today and get quick approval with minimal documentation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link href={ROUTES.APPLY_LOAN}>Apply Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
              <Link href={ROUTES.LOGIN}>Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 bg-card text-muted-foreground border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <AppLogo iconClassName="h-8 w-8" textClassName="text-xl" />
              <p className="mt-4 text-sm">
                Your trusted partner for all your financial needs. We provide quick and easy loan solutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href={ROUTES.APPLY_LOAN} className="hover:text-primary transition-colors">Apply for Loan</Link></li>
                <li><Link href={ROUTES.LOGIN} className="hover:text-primary transition-colors">Login</Link></li>
                <li><Link href={ROUTES.REGISTER} className="hover:text-primary transition-colors">Register</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: support@shreeshyamfinance.com</li>
                <li>Phone: +91 XXXXX XXXXX</li>
                <li>Address: Your Business Address</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}