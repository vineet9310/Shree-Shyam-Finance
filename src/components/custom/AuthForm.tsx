// src/components/custom/AuthForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/lib/types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Image, { StaticImageData } from 'next/image';
import { APP_NAME, ROUTES } from "@/lib/constants";
import { AppLogo } from "@/components/custom/AppLogo";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  contactNo: z.string().min(1, { message: "Contact number is required." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Eye icon for showing password (from Lucide React)
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// EyeOff icon for hiding password (from Lucide React)
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.01 18.01 0 0 1 8.63-4.57M2.92 2.92 22 22" />
    <path d="M9.37 5.62A9.09 9.09 0 0 1 12 5c7 0 10 7 10 7a18.01 18.01 0 0 1-3.94 2.94" />
    <line x1="12" x2="12" y1="17" y2="17" />
  </svg>
);


interface AuthFormProps {
  mode: "login" | "register";
  imageSrc: StaticImageData; // Ensure this is StaticImageData for local images
}

export function AuthForm({ mode, imageSrc }: AuthFormProps) {
  const { login: contextLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to read URL query parameters

  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formSchema = mode === "login" ? loginSchema : registerSchema;
  type FormValues = typeof mode extends "login" ? LoginFormValues : RegisterFormValues;

  // Get email from query parameter if present for login mode
  const initialEmail = mode === 'login' ? searchParams.get('email') || "" : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: mode === 'login'
      ? { email: initialEmail, password: "" } // Use initialEmail for login
      : { name: "", email: "", password: "", confirmPassword: "", contactNo: "" },
  });

  // Set email field value when initialEmail changes (e.g., on redirection)
  useEffect(() => {
    if (mode === 'login' && initialEmail) {
      form.setValue('email', initialEmail);
    }
  }, [initialEmail, mode, form]);


  async function onSubmit(values: FormValues) {
    setError(null);
    setIsLoading(true);

    // Developer Bypass for admin login - REMOVE FOR PRODUCTION
    if (mode === 'login' && values.email === 'vineetbeniwal9310@gmail.com') {
      console.warn("[AuthForm:Login] Developer bypass for admin login activated for:", values.email);
      const adminUser: User = {
        id: 'mockadmin_vineet',
        name: 'Vineet Beniwal',
        email: values.email,
        role: 'admin',
        contactNo: '0000000000',
        address: 'Admin Address', // This will still exist in the User type, but won't be collected on registration
      };
      contextLogin(adminUser);
      setIsLoading(false);
      return;
    }

    if (mode === "login") {
      try {
        console.log("[AuthForm:Login] Attempting API login for:", values.email);
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email, password: values.password }),
        });
        const result = await response.json();
        console.log("[AuthForm:Login] API Response:", result);

        if (response.ok && result.success && result.user) {
          console.log("[AuthForm:Login] Login API success, user from API:", JSON.stringify(result.user, null, 2));
          const loggedInUser: User = result.user;
          console.log("[AuthForm:Login] Calling contextLogin with (from API):", JSON.stringify(loggedInUser, null, 2));
          contextLogin(loggedInUser); // Still log in for actual login flow
        } else {
          setError(result.message || "Login failed. Please check your credentials.");
          toast({
            title: "Login Failed",
            description: result.message || "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("[AuthForm:Login] Login submission error:", err);
        setError(err instanceof Error ? err.message : "An unexpected network error occurred during login.");
        toast({
          title: "Login Error",
          description: err instanceof Error ? err.message : "An unexpected network error occurred.",
          variant: "destructive",
        });
      }
    } else { // Register mode
      try {
        const registerPayload = {
          name: (values as RegisterFormValues).name,
          email: values.email,
          password: values.password,
          contactNo: (values as RegisterFormValues).contactNo,
          role: 'user',
        };
        console.log("[AuthForm:Register] Attempting API registration with payload:", JSON.stringify(registerPayload, null, 2));
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerPayload),
        });
        const result = await response.json();
        console.log("[AuthForm:Register] Register API response:", JSON.stringify(result, null, 2));

        if (response.ok && result.success) { // Removed result.user check as we are not auto-logging in
          toast({
            title: "Registration Successful!",
            description: "Redirecting to login page in 5 seconds...",
          });
          
          // Store the registered email to autofill on login page
          const registeredEmail = values.email;

          // Introduce a 5-second delay before redirecting to login
          setTimeout(() => {
            router.push(`${ROUTES.LOGIN}?email=${registeredEmail}`);
          }, 5000); // 5000 milliseconds = 5 seconds

        } else {
          setError(result.message || "Registration failed. Please try again.");
          toast({
            title: "Registration Failed",
            description: result.message || "Could not create your account. Please try again.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("[AuthForm:Register] Registration submission error:", err);
        setError(err instanceof Error ? err.message : "An unexpected network error occurred during registration.");
        toast({
          title: "Registration Error",
          description: err instanceof Error ? err.message : "An unexpected network error occurred.",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
  }

  const welcomeTitle = mode === "login" ? "Welcome Back!" : "Create Your Account";
  const welcomeSubtitle = mode === "login" 
    ? `Log in to ${APP_NAME} to manage your finances.` 
    : `Join ${APP_NAME} to unleash your financial dreams.`;
  
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Panel (Image Background) */}
      <div className="relative hidden lg:flex w-1/2 h-screen items-center justify-center overflow-hidden">
        <Image
          src={imageSrc} // This will be KHATUSHYAM.jpg
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
          priority
          className="z-0"
        />
        {/* Dark overlay to make text/elements stand out and match theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent z-10"></div>

        {/* Optional: Logo and text on the left panel, similar to Generative AI image */}
        <div className="relative z-20 p-8 text-white flex flex-col items-start justify-end h-full w-full">
          <div className="absolute top-8 left-8">
            <AppLogo iconClassName="h-10 w-10 text-primary" textClassName="text-3xl text-white" />
          </div>
          <div className="mb-12">
            <h2 className="text-4xl font-bold leading-tight mb-4">
              {mode === "login" ? "Secure Your Finances" : "Unleash Your Financial Dreams"}
            </h2>
            <p className="text-lg text-gray-300">
              {mode === "login" ? "Access your personalized dashboard and manage your loans with confidence." : "Start your journey towards financial freedom with our intuitive platform."}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col justify-start px-4 sm:px-8 overflow-y-auto bg-card"> {/* Adjusted horizontal padding */}
        {/* Inner content container - added py-16 for vertical padding */}
        <div className="w-full max-w-sm sm:max-w-md space-y-8 mx-auto py-16"> {/* Adjusted max-width for better scaling, removed p-6 */}
          {/* Logo for mobile view (if left panel is hidden) */}
          <div className="lg:hidden flex justify-center mb-8">
            <AppLogo iconClassName="h-10 w-10 text-primary" textClassName="text-xl sm:text-3xl" /> {/* Adjusted font size for responsiveness */}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground text-center">{welcomeTitle}</h1> {/* Adjusted font size for responsiveness */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-center">{welcomeSubtitle}</p> {/* Adjusted font size for responsiveness */}


          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {mode === "register" && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} value={field.value || ''} disabled={isLoading} className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 placeholder:text-muted-foreground/70 text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} disabled={isLoading} className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 placeholder:text-muted-foreground/70 text-foreground"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center relative">
                      <FormLabel className="text-xs text-muted-foreground">Password</FormLabel>
                      {mode === "login" && (
                        <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                          value={field.value || ''}
                          disabled={isLoading}
                          className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 pr-10 placeholder:text-muted-foreground/70 text-foreground"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-10 px-0 py-0 text-muted-foreground hover:bg-transparent"
                          onClick={() => setShowPassword((prev) => !prev)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "register" && (
                <>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              {...field}
                              value={field.value || ''}
                              disabled={isLoading}
                              className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 pr-10 placeholder:text-muted-foreground/70 text-foreground"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-10 px-0 py-0 text-muted-foreground hover:bg-transparent"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              disabled={isLoading}
                            >
                              {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Contact Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Your contact number" {...field} value={field.value || ''} disabled={isLoading} className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 placeholder:text-muted-foreground/70 text-foreground" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* 'address' field has been removed */}
                </>
              )}
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 text-base font-semibold" disabled={isLoading}>
                {isLoading ? "Processing..." : (mode === "login" ? "Log In" : "Create Account")}
              </Button>
            </form>
            
          <div className="flex justify-center text-sm mt-4">
            {mode === "register" ? (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
                  Log in
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href={ROUTES.REGISTER} className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            )}
          </div>
          </Form>

          {/* Terms and Privacy Policy */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            By signing in, you agree to {APP_NAME}'s{" "}
            <Link href="#" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-4 text-xs text-muted-foreground/80 text-center">
             For login: Admins use `vineetbeniwal9310@gmail.com` (dev bypass). Other users, register first.
           </p>
        </div>
      </div>
    </div>
  );
}
