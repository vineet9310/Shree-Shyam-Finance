"use client"; // Added this directive

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

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

// Schema for requesting OTP
const requestOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

// Schema for verifying OTP and setting new password
const resetPasswordSchema = z.object({
  email: z.string().email(), // Email will be pre-filled
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6, { message: "OTP must be 6 digits." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

type RequestOtpFormValues = z.infer<typeof requestOtpSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<'requestEmail' | 'verifyOtp' | 'resetSuccess'>('requestEmail');
  const [isLoading, setIsLoading] = useState(false);
  const [emailForReset, setEmailForReset] = useState<string>(''); // To store email after step 1
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Form for requesting OTP
  const requestOtpForm = useForm<RequestOtpFormValues>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form for resetting password
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailForReset, // This will be set dynamically
      otp: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // Update resetPasswordForm's email when emailForReset changes
  React.useEffect(() => {
    resetPasswordForm.setValue('email', emailForReset);
  }, [emailForReset, resetPasswordForm]);

  const onRequestOtpSubmit = async (values: RequestOtpFormValues) => {
    setIsLoading(true);
    console.log("Requesting OTP for:", values.email);
    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        toast({
          title: "Server Error",
          description: "Unexpected server response. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (response.ok && result.success) {
        setEmailForReset(values.email);
        setStep('verifyOtp');
        toast({
          title: "OTP Sent",
          description: "A 6-digit OTP has been sent to your email address.",
        });
      } else {
        toast({
          title: "Error Sending OTP",
          description: result.message || "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPasswordSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    // Simulate API call for resetting password
    console.log("Resetting password for:", values.email, "with OTP:", values.otp);
    try {
      // Replace with actual API call to /api/users/reset-password
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, otp: values.otp, newPassword: values.newPassword }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setStep('resetSuccess');
        toast({
          title: "Password Reset Successful",
          description: "Your password has been successfully reset. You can now log in.",
        });
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push(ROUTES.LOGIN);
        }, 3000);
      } else {
        toast({
          title: "Password Reset Failed",
          description: result.message || "Failed to reset password. Please check your OTP or try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-6 shadow-lg sm:p-8">
        <h1 className="text-center text-2xl font-bold text-foreground">Forgot Password</h1>
        <p className="text-center text-sm text-muted-foreground">
          {step === 'requestEmail' && "Enter your email to receive a password reset OTP."}
          {step === 'verifyOtp' && `Enter the OTP sent to ${emailForReset} and your new password.`}
          {step === 'resetSuccess' && "Your password has been reset. Redirecting to login..."}
        </p>

        {step === 'requestEmail' && (
          <Form {...requestOtpForm}>
            <form onSubmit={requestOtpForm.handleSubmit(onRequestOtpSubmit)} className="space-y-6">
              <FormField
                control={requestOtpForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        disabled={isLoading}
                        className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 placeholder:text-muted-foreground/70 text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 text-base font-semibold" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          </Form>
        )}

        {step === 'verifyOtp' && (
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-6">
              <FormField
                control={resetPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        disabled={true} // Email should not be editable here
                        className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 placeholder:text-muted-foreground/70 text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetPasswordForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">OTP</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        {...field}
                        disabled={isLoading}
                        className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 placeholder:text-muted-foreground/70 text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                          disabled={isLoading}
                          className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 pr-10 placeholder:text-muted-foreground/70 text-foreground"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-10 px-0 py-0 text-muted-foreground hover:bg-transparent"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          disabled={isLoading}
                        >
                          {showNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetPasswordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmNewPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                          disabled={isLoading}
                          className="bg-input border-border focus:border-primary focus-visible:ring-primary rounded-md py-2.5 pr-10 placeholder:text-muted-foreground/70 text-foreground"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-10 px-0 py-0 text-muted-foreground hover:bg-transparent"
                          onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                          disabled={isLoading}
                        >
                          {showConfirmNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 text-base font-semibold" disabled={isLoading}>
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        )}

        {step === 'resetSuccess' && (
          <div className="text-center">
            <p className="text-lg font-medium text-green-600">Password reset successful!</p>
            <p className="text-sm text-muted-foreground mt-2">You will be redirected to the login page shortly.</p>
            <Link href={ROUTES.LOGIN} className="text-sm text-primary hover:underline mt-4 block">
              Go to Login Page
            </Link>
          </div>
        )}

        {step !== 'resetSuccess' && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Remember your password?{' '}
            <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
              Log In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
