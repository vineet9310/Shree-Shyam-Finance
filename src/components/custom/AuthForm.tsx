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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: AuthFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const formSchema = mode === "login" ? loginSchema : registerSchema;
  type FormValues = typeof mode extends "login" ? LoginFormValues : RegisterFormValues;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any), // TS workaround for conditional type
    defaultValues: mode === 'login' 
      ? { email: "", password: "" } 
      : { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      // In a real app, you'd make an API call here.
      // For this mock, we'll use the login function from AuthContext.
      const userData: Partial<User> = {
        email: values.email,
        // password isn't stored or checked in mock, but sent conceptually
      };
      if (mode === 'register') {
        userData.name = (values as RegisterFormValues).name;
        userData.role = 'user'; // Default role for registration
      } else {
        // For login, try to find role from mock users, else default to user
        // This part is simplified as our mock login in context handles this.
        userData.role = values.email === 'admin@example.com' ? 'admin' : 'user';
      }
      
      login(userData as User); // Cast as User, mock login handles partial data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "register" && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {mode === "login" ? "Sign In" : "Create Account"}
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
             Demo: user@example.com or admin@example.com (any password)
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}
