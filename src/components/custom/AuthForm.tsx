
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME, ROUTES } from "@/lib/constants";
import type { User } from "@/lib/types";
import { AppLogo } from "./AppLogo";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


interface AuthFormProps {
  mode: "login" | "register";
}

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Simplified for mock
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  // Optional fields for registration, can be filled later in profile
  contactNo: z.string().optional(),
  address: z.string().optional(),

}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: AuthFormProps) {
  const { login: contextLogin } = useAuth(); // login from AuthContext for mock login
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = mode === "login" ? loginSchema : registerSchema;
  type FormValues = typeof mode extends "login" ? LoginFormValues : RegisterFormValues;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any), // TS workaround for conditional type
    defaultValues: mode === 'login' 
      ? { email: "", password: "" } 
      : { name: "", email: "", password: "", confirmPassword: "", contactNo: "", address: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setIsLoading(true);

    if (mode === "login") {
      // Mock login using AuthContext as before
      try {
        const userData: Partial<User> = {
          email: values.email,
          role: values.email === 'admin@example.com' ? 'admin' : 'user',
        };
        contextLogin(userData as User); 
        // AuthContext's login handles redirection
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred during login.");
      } finally {
        setIsLoading(false);
      }
    } else { // Register mode
      try {
        const registerPayload = {
            name: (values as RegisterFormValues).name,
            email: values.email,
            password: values.password, // Password will be hashed on backend
            contactNo: (values as RegisterFormValues).contactNo,
            address: (values as RegisterFormValues).address,
            role: 'user', // Default role for new registrations
        };

        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerPayload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast({
            title: "Registration Successful",
            description: "You can now log in with your new account.",
          });
          // Log in the user with AuthContext after successful backend registration
          // Use the user data returned from the API if available and complete
          const registeredUser : User = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            // Add other fields if returned and needed by AuthContext's user type
          };
          contextLogin(registeredUser); // This will redirect
        } else {
          setError(result.message || "Registration failed. Please try again.");
        }
      } catch (err) {
        console.error("Registration submission error:", err);
        setError(err instanceof Error ? err.message : "An unexpected network error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <AppLogo />
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Welcome Back" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? `Enter your credentials to access your ${APP_NAME} account.`
              : `Join ${APP_NAME} today to manage your finances.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mode === "register" && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} disabled={isLoading} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
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
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
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
                        <FormLabel>Contact Number (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Your contact number" {...field} disabled={isLoading} />
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
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your address" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? "Processing..." : (mode === "login" ? "Sign In" : "Create Account")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href={ROUTES.REGISTER} className="font-medium text-accent hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
           <p className="text-xs text-muted-foreground pt-2">
             Demo: user@example.com or admin@example.com (any password for login)
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}
