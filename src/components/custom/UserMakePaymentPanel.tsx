// src/components/custom/UserMakePaymentPanel.tsx
"use client";

import React, { useState, ChangeEvent, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IndianRupee, QrCode, UploadCloud, FileText, CalendarDays, Loader2, AlertTriangleIcon, Image as ImageIcon } from 'lucide-react';
import type { LoanApplication } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import FormattedDate from './FormattedDate';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import NextImage from 'next/image'; 

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

// Helper to convert File to Base64 Data URI
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const paymentFormSchema = z.object({
  paymentAmount: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ required_error: "Payment amount is required."}).positive("Payment amount must be positive.")
  ),
  paymentDate: z.date({ required_error: "Payment date is required." }),
  paymentMethod: z.enum(['online', 'cash'], { required_error: "Please select a payment method." }),
  transactionReference: z.string().optional(),
  paymentScreenshot: z.string().optional(), 
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface UserMakePaymentPanelProps {
  application: LoanApplication;
  onPaymentSubmitted?: () => void; 
}

const ACTUAL_QR_CODE_URL = "/images/QR-code.jpg"; 

export function UserMakePaymentPanel({ application, onPaymentSubmitted }: UserMakePaymentPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedScreenshotFile, setSelectedScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [interestCalculationNote, setInterestCalculationNote] = useState<string>("");


  const currentInterestDue = useMemo(() => {
    let note = "";
    // Priority 1: User's direct calculation method
    if (typeof application.principalDisbursed === 'number' && application.principalDisbursed > 0 && typeof application.interestRate === 'number' && application.interestRate > 0) {
      // Assuming application.interestRate is the rate for the current period as per user's examples
      const calculatedInterest = application.principalDisbursed * (application.interestRate / 100);
      note = `Calculated simple interest for this period: ₹${calculatedInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      setInterestCalculationNote(note);
      return parseFloat(calculatedInterest.toFixed(2));
    }
    
    // Priority 2: Fallback to repayment schedule's interest component
    if (application.repaymentSchedule && application.repaymentSchedule.length > 0) {
      const nextDueInstallment = application.repaymentSchedule.find(entry => !entry.isPaid);
      if (nextDueInstallment && typeof nextDueInstallment.interestComponent === 'number') {
        note = `Interest component from schedule: ₹${nextDueInstallment.interestComponent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        setInterestCalculationNote(note);
        return parseFloat(nextDueInstallment.interestComponent.toFixed(2));
      }
    }
    
    note = "Full EMI amount shown below. Could not determine specific interest component.";
    setInterestCalculationNote(note);
    return undefined; // If neither calculation is possible
  }, [application.principalDisbursed, application.interestRate, application.repaymentSchedule]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentAmount: currentInterestDue !== undefined ? currentInterestDue : (application.nextPaymentAmount || undefined),
      paymentDate: new Date(),
      paymentMethod: undefined,
      transactionReference: '',
      paymentScreenshot: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    let defaultAmount;
    if (currentInterestDue !== undefined) {
      defaultAmount = currentInterestDue;
    } else if (application.nextPaymentAmount) {
      defaultAmount = application.nextPaymentAmount;
    } else {
      defaultAmount = undefined;
    }
    form.reset({
        ...form.getValues(), // preserve other form values
        paymentAmount: defaultAmount,
    });
  }, [currentInterestDue, application.nextPaymentAmount, form]);


  const paymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    form.setValue('paymentScreenshot', undefined);
    form.setValue('transactionReference', '');
    setSelectedScreenshotFile(null);
    setScreenshotPreview(null);
  }, [paymentMethod, form]);


  const handleScreenshotFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File Too Large", description: `Max file size is ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
        event.target.value = ''; 
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "Invalid File Type", description: `Allowed types: JPG, PNG, GIF.`, variant: "destructive" });
        event.target.value = ''; 
        return;
      }
      
      setSelectedScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file)); 

      try {
        const base64 = await fileToBase64(file);
        form.setValue('paymentScreenshot', base64, { shouldValidate: true });
      } catch (error) {
        toast({ title: "Error processing file", description: "Could not read the file.", variant: "destructive" });
        setSelectedScreenshotFile(null);
        setScreenshotPreview(null);
        form.setValue('paymentScreenshot', undefined);
      }
    } else {
        setSelectedScreenshotFile(null);
        setScreenshotPreview(null);
        form.setValue('paymentScreenshot', undefined);
    }
  };

  async function onSubmit(values: PaymentFormValues) {
    if (!user || !user.id) {
      toast({ title: "Error", description: "You must be logged in to submit a payment.", variant: "destructive" });
      return;
    }
    if (values.paymentMethod === 'online' && !values.paymentScreenshot) {
      form.setError('paymentScreenshot', { type: 'manual', message: 'Payment screenshot is required for online payments.' });
      toast({ title: "Missing Screenshot", description: "Please upload a payment screenshot for online payments.", variant: "destructive" });
      return;
    }
     if (values.paymentMethod === 'online' && !values.transactionReference?.trim()) {
      form.setError('transactionReference', { type: 'manual', message: 'Transaction reference ID is required for online payments.' });
      toast({ title: "Missing Transaction ID", description: "Please enter the transaction reference ID.", variant: "destructive" });
      return;
    }


    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        loanApplicationId: application.id,
        borrowerUserId: user.id,
        paymentDate: values.paymentDate.toISOString(), 
      };

      if (payload.paymentMethod === 'cash') {
        delete payload.paymentScreenshot;
      }

      const response = await fetch(`/api/loan-applications/${application.id}/user-submit-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Payment Submitted",
          description: "Your payment proof has been submitted for verification.",
        });
        
        const nextDefaultAmount = currentInterestDue !== undefined 
            ? currentInterestDue 
            : (application.nextPaymentAmount || undefined);

        form.reset({ 
            paymentAmount: nextDefaultAmount, 
            paymentDate: new Date(),
            paymentMethod: undefined,
            transactionReference: '',
            paymentScreenshot: undefined,
            notes: '',
        });
        setSelectedScreenshotFile(null);
        setScreenshotPreview(null);
        if (onPaymentSubmitted) {
          onPaymentSubmitted(); 
        }
      } else {
        throw new Error(result.message || "Failed to submit payment proof.");
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg rounded-xl mt-6 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <CardHeader className="bg-gray-800 border-b border-gray-700 p-6">
        <CardTitle className="text-xl font-bold flex items-center gap-3 text-primary-foreground">
          <IndianRupee className="h-6 w-6 text-green-400" /> EMI/Interest Payment
        </CardTitle>
        <CardDescription className="text-gray-400">
          Next EMI due on: <FormattedDate dateString={application.nextPaymentDueDate} fallback="N/A" /> 
          {interestCalculationNote && (
            <span className="block mt-1 text-yellow-300 text-xs">{interestCalculationNote}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Amount You Are Paying (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter amount being paid" 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-green-500 focus:border-green-500" 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-gray-300">Date of Payment</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-gray-700 border-gray-600 hover:bg-gray-600 text-white",
                            !field.value && "text-gray-400"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarDays className="ml-auto h-4 w-4 opacity-50 text-gray-400" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="text-white [&_button]:text-white [&_.rdp-button_selected]:!bg-green-500 [&_.rdp-button_selected]:!text-black"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Payment Mode</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500">
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="online" className="hover:!bg-gray-700 focus:!bg-gray-700">Online (UPI/NetBanking)</SelectItem>
                      <SelectItem value="cash" className="hover:!bg-gray-700 focus:!bg-gray-700">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {paymentMethod === 'online' && (
              <>
                <div className="my-4 p-4 border border-dashed border-gray-600 rounded-lg text-center bg-gray-700/50">
                    <QrCode className="h-12 w-12 mx-auto text-green-400 mb-2" />
                    <div className="relative mx-auto mb-2 rounded-md w-40 h-40 sm:w-48 sm:h-48 overflow-hidden">
                        <NextImage 
                            src={ACTUAL_QR_CODE_URL} 
                            alt="QR Code to Scan for Payment" 
                            layout="fill"
                            objectFit="contain" 
                            priority 
                        />
                    </div>
                    <p className="text-sm text-gray-400">Scan the QR code with your UPI app. UPI ID: 9310666181@kotak</p>
                    <p className="text-xs text-gray-500 mt-2">(After payment, please enter the transaction ID and upload the screenshot.)</p>
                </div>

                <FormField
                  control={form.control}
                  name="transactionReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Transaction Reference ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter UPI/NEFT/IMPS Transaction ID" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-green-500 focus:border-green-500" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel htmlFor="paymentScreenshot" className="text-gray-300 flex items-center gap-2"><UploadCloud className="h-5 w-5"/>Upload Payment Screenshot</FormLabel>
                  <FormControl>
                    <Input 
                        id="paymentScreenshot"
                        type="file" 
                        accept={ALLOWED_IMAGE_TYPES.join(',')}
                        onChange={handleScreenshotFileChange}
                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30"
                    />
                  </FormControl>
                  {screenshotPreview && (
                    <div className="mt-2">
                      <img src={screenshotPreview} alt="Payment Screenshot Preview" className="max-h-40 rounded-md border border-gray-600" />
                    </div>
                  )}
                  <FormMessage className="text-red-400">{form.formState.errors.paymentScreenshot?.message}</FormMessage>
                </FormItem>
              </>
            )}

             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any remarks regarding this payment..." {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-green-500 focus:border-green-500"/>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            {paymentMethod === 'cash' && (
                 <Alert variant="default" className="bg-yellow-900/30 border-yellow-700 text-yellow-300">
                    <AlertTriangleIcon className="h-4 w-4 !text-yellow-400" />
                    <AlertTitle>Cash Payment Confirmation</AlertTitle>
                    <AlertDescription>
                       By submitting, you confirm arrangements for cash payment. This will be verified by an admin.
                    </AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting Proof...</> : "Submit Payment Proof"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
