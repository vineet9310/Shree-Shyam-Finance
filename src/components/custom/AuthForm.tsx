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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { APP_NAME, ROUTES } from "@/lib/constants"; // Using APP_NAME for welcome message
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  contactNo: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Google Icon SVG
const GoogleIcon = () => (
  <svg version="1.1" xmlns="http://www.w.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-3">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login: contextLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = mode === "login" ? loginSchema : registerSchema;
  type FormValues = typeof mode extends "login" ? LoginFormValues : RegisterFormValues;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: mode === 'login'
      ? { email: "", password: "" }
      : { name: "", email: "", password: "", confirmPassword: "", contactNo: "", address: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setIsLoading(true);

    // Developer Bypass for admin login - REMOVE FOR PRODUCTION
    if (mode === 'login' && values.email === 'vineetbeniwal9310@gmail.com') {
      console.warn("[AuthForm:Login] Developer bypass for admin login activated for:", values.email);
      const adminUser: User = {
        id: 'mockadmin_vineet',
        name: 'Vineet Beniwal (Admin)',
        email: values.email,
        role: 'admin',
        contactNo: '0000000000',
        address: 'Admin Address',
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
          contextLogin(loggedInUser);
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
          address: (values as RegisterFormValues).address,
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

        if (response.ok && result.success && result.user) {
          toast({
            title: "Registration Successful",
            description: "You can now log in with your new account.",
          });
          console.log("[AuthForm:Register] User from API (after registration):", JSON.stringify(result.user, null, 2));
          const registeredUser: User = result.user;
          console.log("[AuthForm:Register] Calling contextLogin with (after registration):", JSON.stringify(registeredUser, null, 2));
          contextLogin(registeredUser);
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
        setError(err instanceof Error ? err.message : "An unexpected network error occurred.");
        toast({
          title: "Registration Error",
          description: err instanceof Error ? err.message : "An unexpected network error occurred.",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
  }

  const welcomeTitle = mode === "login" ? "Hi there!" : "Create your Account";
  const welcomeSubtitle = mode === "login" 
    ? `Welcome to ${APP_NAME}. Community Dashboard` 
    : `Join ${APP_NAME} to manage your finances.`;
  const imageSrc = "/assets/Shyam.jpg";
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel (Form) */}
      <div className="w-full md:w-1/2 lg:w-2/5 bg-card text-card-foreground p-8 sm:p-12 flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
            <Link href={ROUTES.HOME} className="text-2xl font-bold text-foreground">
              {APP_NAME.toUpperCase().split(' ')[0] || APP_NAME.toUpperCase()}.
            </Link>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">{welcomeTitle}</h1>
          <p className="text-muted-foreground mb-10">{welcomeSubtitle}</p>

          {mode === "login" && (
            <>
              <Button variant="outline" className="w-full mb-6 border-border hover:bg-muted/50 py-6 text-sm" disabled={isLoading}>
                <GoogleIcon />
                Log in with Google
              </Button>
              <div className="flex items-center my-8">
                <hr className="flex-grow border-t border-border" />
                <span className="mx-4 text-xs text-muted-foreground">or</span>
                <hr className="flex-grow border-t border-border" />
              </div>
            </>
          )}

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
                        <Input placeholder="Your full name" {...field} value={field.value || ''} disabled={isLoading} className="bg-background border-border focus:border-primary rounded-lg py-6 placeholder:text-muted-foreground/70" />
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
                    <FormLabel className="text-xs text-muted-foreground">Your email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} disabled={isLoading} className="bg-background border-border focus:border-primary rounded-lg py-6 placeholder:text-muted-foreground/70"/>
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
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-xs text-muted-foreground">Password</FormLabel>
                      {mode === "login" && (
                        <Link href="#" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} value={field.value || ''} disabled={isLoading} className="bg-background border-border focus:border-primary rounded-lg py-6 placeholder:text-muted-foreground/70" />
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
                          <Input type="password" placeholder="Confirm your password" {...field} value={field.value || ''} disabled={isLoading} className="bg-background border-border focus:border-primary rounded-lg py-6 placeholder:text-muted-foreground/70" />
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
                        <FormLabel className="text-xs text-muted-foreground">Contact Number (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Your contact number" {...field} value={field.value || ''} disabled={isLoading} className="bg-background border-border focus:border-primary rounded-lg py-6 placeholder:text-muted-foreground/70" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your address" {...field} value={field.value || ''} disabled={isLoading} className="bg-background border-border focus:border-primary rounded-lg py-6 placeholder:text-muted-foreground/70" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-lg py-6 text-sm font-semibold" disabled={isLoading}>
                {isLoading ? "Processing..." : (mode === "login" ? "Log In" : "Create Account")}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href={ROUTES.REGISTER} className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground/80 text-center">
             For login: Admins use `vineetbeniwal9310@gmail.com` (dev bypass). Other users, register first.
           </p>
        </div>
      </div>

      {/* Right Panel (Image) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 items-center justify-center p-8 relative overflow-hidden">
        {/* Added h-full to ensure the parent has a height for the fill image */}
        <Image
          src={imageSrc}
          alt="Illustration related to finance"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          data-ai-hint="financial abstract"
        />
         {/* You can add text overlays here if needed, like "Largest Space Community" from the example */}
      </div>
    </div>
  );
}
