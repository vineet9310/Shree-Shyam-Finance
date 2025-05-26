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
import shyamImage from '@/assets/KHATUSHYAM.jpg'; // Import the local image

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
        <p className="text-foreground ">Loading {APP_NAME}...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
       <header className="fixed top-0 left-0 w-full z-20 px-4 py-3 sm:p-6 flex justify-between items-center bg-background shadow-sm h-16">
        {/* Adjusted AppLogo text size for responsiveness */}
        <AppLogo iconClassName="h-8 w-8" textClassName="text-[18px] sm:text-2xl" />
        <nav>
          {/* Adjusted space-x for responsiveness */}
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
      <div className="relative w-full flex-1 flex items-center justify-center min-h-screen overflow-hidden py-16 px-4 md:px-8 lg:px-12 pt-24">
        <Image
          src={shyamImage} // Using the local KHATUSHYAM.jpg image
          alt="Transparent background image"
          layout="fill"
          objectFit="cover"
          priority
          className="z-0 opacity-1" // Increased opacity from 05 to 10
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
        <div className="relative z-20 max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left py-8">
            <p className="text-primary font-semibold text-lg mb-2">Your Trusted Financial Partner</p>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground mb-6">
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
                <Link href={ROUTES.DASHBOARD}>Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:flex justify-center items-center">
          </div>
        </div>
      </div>
      <footer className="w-full text-center py-4 bg-card text-muted-foreground text-sm z-20">
        <p className="text-xs">
          For login: Admins use `vineetbeniwal9310@gmail.com` (dev bypass). Other users, register first.
        </p>
        <p className="mt-1">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}