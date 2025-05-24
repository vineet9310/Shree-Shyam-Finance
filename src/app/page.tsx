
"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { AppLogo } from "@/components/custom/AppLogo";
import Image from "next/image";
import shyamImage from '@/assets/Shyam.jpg'; // Import the local image

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
        <p className="text-foreground">Loading {APP_NAME}...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-8">
        <AppLogo className="justify-center" iconClassName="h-12 w-12" textClassName="text-4xl" />
        
        <div className="relative w-full max-w-md h-72 mx-auto rounded-lg overflow-hidden shadow-xl">
          <Image 
            src={shyamImage} 
            alt={`${APP_NAME} illustration`}
            layout="fill" 
            objectFit="cover" 
            priority 
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-lg text-muted-foreground">
          Secure and intuitive financial services tailored for you. Access your loans, apply for new ones, and manage your finances with ease.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={ROUTES.LOGIN}>Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground/90">
            <Link href={ROUTES.REGISTER}>Register</Link>
          </Button>
        </div>
         <p className="text-xs text-muted-foreground pt-8">
           For login: Admins use `vineetbeniwal9310@gmail.com` (bypass). Other users, register first.
        </p>
      </div>
    </div>
  );
}
