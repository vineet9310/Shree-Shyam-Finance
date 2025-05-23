
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
// import type { LoanApplicationData } from "@/lib/types"; // Using LoanApplication_Old for this file to keep it distinct
import type { LoanApplication_Old as LoanApplicationData } from "@/lib/types";
import { useState, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, DollarSign, Briefcase, UserCircle, FileText, ShieldQuestion, Trash2 } from "lucide-react";


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  loanAmount: z.coerce.number().min(1000, { message: "Loan amount must be at least $1,000." }).max(1000000, { message: "Loan amount cannot exceed $1,000,000." }),
  loanPurpose: z.string().min(10, { message: "Please describe the purpose of your loan in at least 10 characters." }),
  income: z.coerce.number().min(0, { message: "Annual income cannot be negative." }),
  employmentStatus: z.enum(["Employed", "Self-Employed", "Unemployed", "Student"], {
    errorMap: () => ({ message: "Please select your employment status." }),
  }),
  creditScore: z.coerce.number().min(300).max(850).optional(),
  supportingDocuments: z.array(z.instanceof(File))
    .optional()
    .refine(files => !files || files.every(file => file.size <= MAX_FILE_SIZE), `Each file size should be less than 5MB.`)
    .refine(files => !files || files.every(file => ALLOWED_FILE_TYPES.includes(file.type)), "Only .jpg, .png, and .pdf files are allowed."),
});

type LoanFormValues = z.infer<typeof formSchema>;

// This would typically be stored in a central store or fetched.
let mockApplications: any[] = []; 

export function LoanApplicationClient_Old() { // Renamed to avoid conflict
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      loanAmount: undefined,
      loanPurpose: "",
      income: undefined,
      employmentStatus: undefined,
      creditScore: undefined,
      supportingDocuments: [],
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentFiles = form.getValues("supportingDocuments") || [];
      const newFiles = [...currentFiles, ...filesArray];
      // Update form value for validation
      form.setValue("supportingDocuments", newFiles, { shouldValidate: true });
      // Update local state for display
      setSelectedFiles(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const currentFiles = form.getValues("supportingDocuments") || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    form.setValue("supportingDocuments", updatedFiles, { shouldValidate: true });
    setSelectedFiles(updatedFiles);
  };

  async function onSubmit(values: LoanFormValues) {
    // In a real app, you'd convert files to data URIs here if needed for an API,
    // or send them as multipart/form-data.
    // For mock purposes, we'll just log and show a toast.
    
    const newApplication: LoanApplicationData = { // Using the old type for this specific mock
      id: String(Date.now()), // Mock ID
      ...values,
      // Ensure supportingDocuments are correctly transformed if needed by LoanApplicationData type
      supportingDocuments: values.supportingDocuments?.map(file => ({ name: file.name, type: file.type, size: file.size })) as any, // Adjust if type expects File[]
      status: 'Pending',
      submittedDate: new Date().toISOString(),
    };
    mockApplications.push(newApplication); // Add to mock in-memory store
    console.log("Mock applications (for admin view - OLD FORM):", mockApplications);


    toast({
      title: "Application Submitted (Old Form)!",
      description: "Your loan application has been successfully submitted. We will review it shortly.",
      variant: "default",
    });
    form.reset();
    setSelectedFiles([]);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2"><FileText className="h-7 w-7 text-primary" />Loan Application (Old)</CardTitle>
        <CardDescription>Fill out the form below to apply for a loan. All fields are important for processing your application.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><UserCircle className="h-4 w-4 text-muted-foreground" />Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-muted-foreground" />Loan Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanPurpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Loan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe why you need this loan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Income ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 60000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employmentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-muted-foreground" />Employment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your employment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Employed">Employed</SelectItem>
                        <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                        <SelectItem value="Unemployed">Unemployed</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="creditScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><ShieldQuestion className="h-4 w-4 text-muted-foreground" />Credit Score (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="300-850" {...field} />
                  </FormControl>
                  <FormDescription>Providing your credit score can help expedite your application.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supportingDocuments"
              render={({ fieldState }) => ( // field is not directly used here for input type="file"
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><UploadCloud className="h-4 w-4 text-muted-foreground" />Supporting Documents (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept={ALLOWED_FILE_TYPES.join(",")}
                      className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </FormControl>
                  <FormDescription>Upload ID proof, bank statements, etc. Max 5MB per file (JPG, PNG, PDF).</FormDescription>
                  {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                </FormItem>
              )}
            />
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Selected files:</h4>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex justify-between items-center">
                      <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Application (Old)"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Export mockApplications for admin page to use
export const getMockApplications = () => mockApplications;
