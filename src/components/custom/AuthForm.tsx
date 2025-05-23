
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

export function AuthForm({ mode }: AuthFormProps) {
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

    if (mode === "login") {
      // Developer Bypass for admin login - REMOVE FOR PRODUCTION
      if (values.email === 'vineetbeniwal9310@gmail.com') {
        console.warn("[AuthForm:Login] Developer bypass for admin login activated for:", values.email);
        const adminUser: User = {
          id: 'mockadmin_vineet', // Consistent mock ID
          name: 'Vineet Beniwal (Admin)',
          email: values.email,
          role: 'admin',
          // Ensure other optional fields are present if your User type needs them
          contactNo: '1234567890', // Example
          address: 'Admin Address', // Example
        };
        contextLogin(adminUser);
        setIsLoading(false);
        return; 
      }

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
          // Ensure result.user matches the User type structure
           const loggedInUser: User = {
            id: result.user.id, // This should be the MongoDB string ID
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            contactNo: result.user.contactNo,
            address: result.user.address,
            // ensure all fields required by User type are present or optional
          };
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
      } finally {
        setIsLoading(false);
      }
    } else { // Register mode
      try {
        const registerPayload = {
            name: (values as RegisterFormValues).name,
            email: values.email,
            password: values.password,
            contactNo: (values as RegisterFormValues).contactNo,
            address: (values as RegisterFormValues).address,
            role: 'user', // Default role for registration
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
          const registeredUser : User = { // Ensure this mapping is correct
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            contactNo: result.user.contactNo,
            address: result.user.address,
          };
          console.log("[AuthForm:Register] Calling contextLogin with (after registration):", JSON.stringify(registeredUser, null, 2));
          contextLogin(registeredUser); // Log in the user immediately after successful registration
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
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
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
                          <Input placeholder="John Doe" {...field} value={field.value || ''} disabled={isLoading} />
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
                      <Input type="email" placeholder="m@example.com" {...field} value={field.value || ''} disabled={isLoading} />
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
                      <Input type="password" placeholder="••••••••" {...field} value={field.value || ''} disabled={isLoading} />
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
                          <Input type="password" placeholder="••••••••" {...field} value={field.value || ''} disabled={isLoading} />
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
                          <Input type="tel" placeholder="Your contact number" {...field} value={field.value || ''} disabled={isLoading} />
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
                          <Input placeholder="Your address" {...field} value={field.value || ''} disabled={isLoading} />
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
             For login: Admins use `vineetbeniwal9310@gmail.com` (bypass). Other users, register first.
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}
