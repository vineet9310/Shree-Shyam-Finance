// src/components/custom/DetailedLoanApplicationForm.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { useState, ChangeEvent, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { IndianRupee, Briefcase, UserCircle, FileText, ShieldCheck, Info, Trash2, UploadCloud, Paperclip, Users, Building, Car, Bike, LandPlot, Landmark, Loader2 } from "lucide-react";
import type { CollateralType } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";

// Helper to convert File to Base64 Data URI
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Schema for a single file, now expecting a string (Base64 Data URI)
const fileSchema = z.string()
  .refine(dataUri => !dataUri || dataUri.startsWith('data:'), "Invalid data URI format.")
  .optional();

const collateralSchema = z.object({
  type: z.custom<CollateralType>((val) => typeof val === 'string' && val.length > 0, {
    message: "Please select a collateral type.",
  }),
  description: z.string().min(5, "Description must be at least 5 characters."),
  estimatedValue: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive("Estimated value must be positive.").optional()
  ),
  atmCardFrontImage: fileSchema, // Now expects string | undefined
  atmCardBackImage: fileSchema, // Now expects string | undefined
  atmPin: z.string().optional().describe("Highly sensitive, consider security implications."),
  chequeImage: fileSchema, // Now expects string | undefined
  chequeNumber: z.string().optional(),
  bankStatementFile: fileSchema, // Now expects string | undefined
  vehicleRcImage: fileSchema, // Now expects string | undefined
  vehicleImage: fileSchema, // Now expects string | undefined
  vehicleChallanDetails: z.string().optional(),
  propertyPapersFile: fileSchema, // Now expects string | undefined
  propertyImage: fileSchema, // Now expects string | undefined
  assetDetails: z.string().optional(),
  assetImage: fileSchema, // Now expects string | undefined
  additionalDocuments: z.array(fileSchema).optional(), // Array of strings | undefined
});

const guarantorSchema = z.object({
  fullName: z.string().min(2, "Guarantor full name is required (min 2 chars)."),
  address: z.string().min(5, "Guarantor address is required (min 5 chars)."),
  contactNo: z.string().min(10, "Guarantor contact no. is required (min 10 digits).").max(15, "Guarantor contact no. too long (max 15 digits)."),
  idProofType: z.enum(["aadhaar", "pan", "voter_id", "driving_license", "passport", "other"], {
    required_error: "Guarantor ID proof type is required.",
    invalid_type_error: "Please select a valid ID proof type for the guarantor."
  }),
  idProofDocument: fileSchema, // Now expects string | undefined
  addressProofType: z.enum(["aadhaar", "utility_bill", "rent_agreement", "passport", "other"], {
    required_error: "Guarantor address proof type is required.",
    invalid_type_error: "Please select a valid address proof type for the guarantor."
  }),
  addressProofDocument: fileSchema, // Now expects string | undefined
}).optional();


const loanApplicationFormSchema = z.object({
  borrowerFullName: z.string().min(1, "Full name is required."),
  borrowerContactNo: z.string().min(10, "Contact number must be at least 10 digits.").max(15),
  borrowerEmail: z.string().email("Invalid email address."),
  borrowerAddress: z.string().min(10, "Address must be at least 10 characters."),
  borrowerIdProofType: z.enum(["aadhaar", "pan", "voter_id", "driving_license", "passport", "other"], { required_error: "Your ID proof type is required."}),
  borrowerIdProofDocument: fileSchema, // Now expects string | undefined
  borrowerAddressProofType: z.enum(["aadhaar", "utility_bill", "rent_agreement", "passport", "other"], { required_error: "Your address proof type is required." }),
  borrowerAddressProofDocument: fileSchema, // Now expects string | undefined
  loanAmount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({
      required_error: "Loan amount is required.",
      invalid_type_error: "Loan amount must be a valid number.",
    }).min(1000, "Loan amount must be at least ₹1,000.")
  ),
  loanPurpose: z.string().min(10, "Please describe loan purpose (min 10 chars)."),
  hasGuarantor: z.boolean().optional(),
  guarantor: guarantorSchema,
  collaterals: z.array(collateralSchema).min(0).optional(),
  generalSupportingDocuments: z.array(fileSchema).optional(), // Array of strings | undefined
});

export type LoanApplicationFormValues = z.infer<typeof loanApplicationFormSchema>;

const collateralTypes: { value: CollateralType; label: string; icon: React.ElementType }[] = [
  { value: "atm_card", label: "ATM Card", icon: ShieldCheck },
  { value: "blank_cheque", label: "Blank Cheque", icon: FileText },
  { value: "bank_statement", label: "Bank Statement (3 Months)", icon: Building },
  { value: "vehicle_bike", label: "Vehicle - Bike", icon: Bike },
  { value: "vehicle_car", label: "Vehicle - Car", icon: Car },
  { value: "vehicle_scooty", label: "Vehicle - Scooty", icon: Bike },
  { value: "property_house", label: "Property - House", icon: Landmark },
  { value: "property_land", label: "Property - Land", icon: LandPlot },
  { value: "gold_jewelry", label: "Gold/Jewelry", icon: IndianRupee },
  { value: "other_asset", label: "Other Asset", icon: Info },
];


export function DetailedLoanApplicationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [showGuarantor, setShowGuarantor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("[DetailedLoanApplicationForm] User from AuthContext:", user);


  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationFormSchema),
    defaultValues: {
      borrowerFullName:  "",
      borrowerContactNo: "",
      borrowerEmail: "",
      borrowerAddress: "",
      borrowerIdProofType: undefined,
      borrowerAddressProofType: undefined,
      loanAmount: '' as any,
      loanPurpose: "",
      hasGuarantor: false,
      guarantor: {
        fullName: "",
        address: "",
        contactNo: "",
        idProofType: undefined,
        idProofDocument: undefined,
        addressProofType: undefined,
        addressProofDocument: undefined,
      },
      collaterals: [],
      generalSupportingDocuments: [],
    },
  });

  useEffect(() => {
    if (user) {
      console.log("[DetailedLoanApplicationForm] useEffect - Resetting form with user data:", user);
      form.reset({
        borrowerFullName: user.name || "",
        borrowerEmail: user.email || "",
        borrowerContactNo: user.contactNo || "",
        borrowerAddress: user.address || "",
        borrowerIdProofType: undefined,
        borrowerAddressProofType: undefined,
        loanAmount: '' as any,
        loanPurpose: "",
        hasGuarantor: false,
        guarantor: { fullName: "", address: "", contactNo: "", idProofType: undefined, idProofDocument: undefined, addressProofType: undefined, addressProofDocument: undefined },
        collaterals: [],
        generalSupportingDocuments: [],
      });
      setShowGuarantor(false);
    } else {
        console.log("[DetailedLoanApplicationForm] useEffect - User is null, resetting to initial defaults.");
        form.reset({
            borrowerFullName: "",
            borrowerEmail: "",
            borrowerContactNo: "",
            borrowerAddress: "",
            borrowerIdProofType: undefined,
            borrowerAddressProofType: undefined,
            loanAmount: '' as any,
            loanPurpose: "",
            hasGuarantor: false,
            guarantor: { fullName: "", address: "", contactNo: "", idProofType: undefined, idProofDocument: undefined, addressProofType: undefined, addressProofDocument: undefined },
            collaterals: [],
            generalSupportingDocuments: [],
        });
        setShowGuarantor(false);
    }
  }, [user, form.reset]);

  const { fields: collateralFields, append: appendCollateral, remove: removeCollateral } = useFieldArray({
    control: form.control,
    name: "collaterals",
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, fieldName: any, index?: number) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      const allowedFileTypes = ["image/jpeg", "image/png", "application/pdf"];

      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: `File "${file.name}" is too large. Max size is 5MB.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        return;
      }

      if (!allowedFileTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `File "${file.name}" has an unsupported type. Only JPG, PNG, PDF are allowed.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        return;
      }

      try {
        const base64Uri = await fileToBase64(file);
        if (typeof index === 'number') {
          form.setValue(`collaterals.${index}.${fieldName as keyof typeof collateralFields[number]}`, base64Uri, { shouldValidate: true });
        } else {
          form.setValue(fieldName, base64Uri, { shouldValidate: true });
        }
      } catch (error) {
        console.error("Error converting file to Base64:", error);
        toast({
          title: "File Processing Error",
          description: `Could not process file "${file.name}". Please try again.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
      }
    }
  };

  const renderFileInput = (fieldName: any, label: string, index?: number, specificFieldName?: string) => {
    const fieldPath = typeof index === 'number' ? `collaterals.${index}.${specificFieldName || fieldName}` : fieldName;

    const fileValue = form.watch(fieldPath as any); // This will now be a base64 string or undefined
    const currentFileName = fileValue && typeof fileValue === 'string' ? fileValue.split(',')[0].split(';')[0].split(':')[1].split('/')[1] + ' file' : null; // Extract simple name from data URI for display

    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            type="file"
            onChange={(e) => handleFileChange(e, specificFieldName || fieldName, index)}
            accept=".jpg,.jpeg,.png,.pdf"
            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            disabled={isSubmitting}
          />
        </FormControl>
        {currentFileName && <FormDescription>Selected: {currentFileName}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  };

  const onInvalid = (errors: any) => {
    console.error("[DetailedLoanApplicationForm] Form validation failed (raw errors object):", JSON.stringify(errors, null, 2));

    let errorMessages = "Please check the form for errors: ";
    const fieldsWithErrors = Object.keys(errors);

    if (fieldsWithErrors.length > 0) {
      const messages = fieldsWithErrors.map(field => {
        const fieldError = errors[field];
        if (fieldError) {
          if (field === 'guarantor' && fieldError.type === undefined && typeof fieldError === 'object') {
            const guarantorErrorMessages = Object.keys(fieldError)
              .map(gfKey => fieldError[gfKey]?.message ? `Guarantor ${gfKey.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${fieldError[gfKey].message}` : null)
              .filter(Boolean)
              .join('; ');
            return guarantorErrorMessages || `${field}: Invalid data`;
          }
          return `${field.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${fieldError.message || 'Invalid data'}`;
        }
        return null;
      }).filter(Boolean);

      if (messages.length > 0) {
        errorMessages += messages.join('; ');
      } else if (errors.root?.message) {
         errorMessages += errors.root.message;
      } else {
        errorMessages = "Please fill all required fields correctly and try again.";
      }
    } else if (errors.root?.message) {
       errorMessages = errors.root.message;
    } else {
      errorMessages = "An unknown validation error occurred. Please check all fields.";
    }

    toast({
      title: "Validation Error",
      description: errorMessages,
      variant: "destructive",
    });
  };


  async function onSubmit(values: LoanApplicationFormValues) {
    console.log("[DetailedLoanApplicationForm] onSubmit triggered.");
    // console.log("[DetailedLoanApplicationForm] Raw values from form (will contain Base64 strings):", JSON.stringify(values, null, 2));


    if (!user || !user.email) {
        toast({
            title: "Authentication Error",
            description: "User details not found. Please log in again to submit the application.",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);

    const submissionPayload: LoanApplicationFormValues = {
        ...values,
        borrowerEmail: user.email,
        borrowerFullName: user.name || values.borrowerFullName,
    };

    if (submissionPayload.hasGuarantor === false || !submissionPayload.hasGuarantor) {
      // If guarantor is not selected, ensure the guarantor object is not sent
      delete (submissionPayload as any).guarantor;
    }


    console.log("[DetailedLoanApplicationForm] Submitting to API:", {
      ...submissionPayload,
      // Truncate Base64 strings for console logging to avoid spam
      borrowerIdProofDocument: submissionPayload.borrowerIdProofDocument ? submissionPayload.borrowerIdProofDocument.substring(0, 50) + '...' : undefined,
      borrowerAddressProofDocument: submissionPayload.borrowerAddressProofDocument ? submissionPayload.borrowerAddressProofDocument.substring(0, 50) + '...' : undefined,
      guarantor: submissionPayload.guarantor ? {
        ...submissionPayload.guarantor,
        idProofDocument: submissionPayload.guarantor.idProofDocument ? submissionPayload.guarantor.idProofDocument.substring(0, 50) + '...' : undefined,
        addressProofDocument: submissionPayload.guarantor.addressProofDocument ? submissionPayload.guarantor.addressProofDocument.substring(0, 50) + '...' : undefined,
      } : undefined,
      collaterals: submissionPayload.collaterals?.map(col => ({
        ...col,
        atmCardFrontImage: col.atmCardFrontImage ? col.atmCardFrontImage.substring(0, 50) + '...' : undefined,
        atmCardBackImage: col.atmCardBackImage ? col.atmCardBackImage.substring(0, 50) + '...' : undefined,
        chequeImage: col.chequeImage ? col.chequeImage.substring(0, 50) + '...' : undefined,
        bankStatementFile: col.bankStatementFile ? col.bankStatementFile.substring(0, 50) + '...' : undefined,
        vehicleRcImage: col.vehicleRcImage ? col.vehicleRcImage.substring(0, 50) + '...' : undefined,
        vehicleImage: col.vehicleImage ? col.vehicleImage.substring(0, 50) + '...' : undefined,
        propertyPapersFile: col.propertyPapersFile ? col.propertyPapersFile.substring(0, 50) + '...' : undefined,
        propertyImage: col.propertyImage ? col.propertyImage.substring(0, 50) + '...' : undefined,
        assetImage: col.assetImage ? col.assetImage.substring(0, 50) + '...' : undefined,
      })),
      generalSupportingDocuments: submissionPayload.generalSupportingDocuments?.map(doc => doc ? doc.substring(0, 50) + '...' : undefined),
    });


    try {
      const response = await fetch('/api/loan-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload), // Send the modified values directly
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Application Query Submitted!",
          description: "Your loan application query has been received and documents uploaded to Cloudinary.",
          variant: "default",
        });
        form.reset({
            borrowerFullName: user?.name || "",
            borrowerEmail: user?.email || "",
            borrowerContactNo: user?.contactNo || "",
            borrowerAddress: user?.address || "",
            borrowerIdProofType: undefined,
            borrowerAddressProofType: undefined,
            loanAmount: '' as any,
            loanPurpose: "",
            hasGuarantor: false,
            guarantor: { fullName: "", address: "", contactNo: "", idProofType: undefined, idProofDocument: undefined, addressProofType: undefined, addressProofDocument: undefined },
            collaterals: [],
            generalSupportingDocuments: [],
        });
        setShowGuarantor(false);
        router.push(ROUTES.DASHBOARD);
      } else {
        toast({
          title: "Submission Failed",
          description: result.message || "Could not submit your application. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[DetailedLoanApplicationForm] Form submission error:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server or an unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl my-8">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2"><FileText className="h-7 w-7 text-primary" />New Loan Application</CardTitle>
        <CardDescription>Please fill in all details accurately. This information will be used to assess your loan eligibility.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">

            <Accordion type="multiple" defaultValue={["borrower_details", "loan_details"]} className="w-full">
              {/* Borrower Details Section */}
              <AccordionItem value="borrower_details">
                <AccordionTrigger className="text-lg font-semibold"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Borrower Details</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField control={form.control} name="borrowerFullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Ramesh Kumar" {...field} value={field.value || ""} disabled={isSubmitting} readOnly /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerContactNo" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input type="tel" placeholder="e.g., 9876543210" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="ramesh@example.com" {...field} value={field.value || ""} disabled={isSubmitting} readOnly /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerAddress" render={({ field }) => (
                    <FormItem><FormLabel>Full Address</FormLabel><FormControl><Textarea placeholder="House No, Street, City, State, Pincode" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerIdProofType" render={({ field }) => (
                    <FormItem><FormLabel>ID Proof Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select ID Proof" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="pan">PAN Card</SelectItem><SelectItem value="voter_id">Voter ID</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem><SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  {renderFileInput("borrowerIdProofDocument", "Upload ID Proof Document")}

                  <FormField control={form.control} name="borrowerAddressProofType" render={({ field }) => (
                    <FormItem><FormLabel>Address Proof Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select Address Proof" /></SelectTrigger></FormControl><SelectContent>
                       <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="utility_bill">Utility Bill (Electricity, Water)</SelectItem><SelectItem value="rent_agreement">Rent Agreement</SelectItem>
                       <SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  {renderFileInput("borrowerAddressProofDocument", "Upload Address Proof Document")}
                </AccordionContent>
              </AccordionItem>

              {/* Loan Details Section */}
              <AccordionItem value="loan_details">
                <AccordionTrigger className="text-lg font-semibold"><IndianRupee className="mr-2 h-5 w-5 text-primary"/>Loan Details</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField control={form.control} name="loanAmount" render={({ field }) => (
                    <FormItem><FormLabel>Loan Amount Requested (₹)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50000" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="loanPurpose" render={({ field }) => (
                    <FormItem><FormLabel>Purpose of Loan</FormLabel><FormControl><Textarea placeholder="Detailed reason for needing the loan..." {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>

              {/* Guarantor Details Section (Conditional) */}
              <AccordionItem value="guarantor_details">
                <AccordionTrigger className="text-lg font-semibold"><Users className="mr-2 h-5 w-5 text-primary"/>Guarantor Details (Optional)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                    <FormField control={form.control} name="hasGuarantor" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Add a Guarantor?</FormLabel>
                                <FormDescription>Select if you are providing a guarantor for this loan.</FormDescription>
                            </div>
                            <FormControl>
                                <Button type="button" variant={field.value ? "default" : "outline"} onClick={() => { field.onChange(!field.value); setShowGuarantor(!field.value); }} disabled={isSubmitting}>
                                    {field.value ? "Remove Guarantor" : "Add Guarantor"}
                                </Button>
                            </FormControl>
                        </FormItem>
                    )} />
                    {showGuarantor && form.watch("hasGuarantor") && (
                        <>
                            <FormField control={form.control} name="guarantor.fullName" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Full Name</FormLabel><FormControl><Input placeholder="Guarantor's Name" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="guarantor.contactNo" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Contact Number</FormLabel><FormControl><Input type="tel" placeholder="Guarantor's Contact" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="guarantor.address" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Address</FormLabel><FormControl><Textarea placeholder="Guarantor's Full Address" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="guarantor.idProofType" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor ID Proof Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select ID Proof" /></SelectTrigger></FormControl><SelectContent>
                                <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="pan">PAN Card</SelectItem><SelectItem value="voter_id">Voter ID</SelectItem>
                                <SelectItem value="driving_license">Driving License</SelectItem><SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                                </SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            {renderFileInput("guarantor.idProofDocument", "Upload Guarantor ID Proof", undefined, "idProofDocument")}

                            <FormField control={form.control} name="guarantor.addressProofType" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Address Proof Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select Address Proof" /></SelectTrigger></FormControl><SelectContent>
                                <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="utility_bill">Utility Bill</SelectItem><SelectItem value="rent_agreement">Rent Agreement</SelectItem>
                                <SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                                </SelectContent></Select><FormMessage /></FormItem>
                            )} />
                             {renderFileInput("guarantor.addressProofDocument", "Upload Guarantor Address Proof", undefined, "addressProofDocument")}
                        </>
                    )}
                </AccordionContent>
              </AccordionItem>

              {/* Collateral Details Section */}
              <AccordionItem value="collateral_details">
                <AccordionTrigger className="text-lg font-semibold"><Paperclip className="mr-2 h-5 w-5 text-primary"/>Collateral Details (Optional)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {collateralFields.map((item, index) => (
                    <Card key={item.id} className="p-4 space-y-3 relative bg-card-foreground/5">
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeCollateral(index)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <h4 className="font-medium">Collateral Item #{index + 1}</h4>
                      <FormField control={form.control} name={`collaterals.${index}.type`} render={({ field }) => (
                        <FormItem><FormLabel>Type of Collateral</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select collateral type" /></SelectTrigger></FormControl>
                            <SelectContent>{collateralTypes.map(ct => <SelectItem key={ct.value} value={ct.value}><ct.icon className="inline-block mr-2 h-4 w-4"/>{ct.label}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`collaterals.${index}.description`} render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., Gold Necklace 22k, Honda Activa 2018 Model" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`collaterals.${index}.estimatedValue`} render={({ field }) => (
                        <FormItem><FormLabel>Estimated Value (₹)</FormLabel><FormControl><Input type="number" placeholder="Approximate market value" {...field} value={field.value || ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                      )} />

                      {form.watch(`collaterals.${index}.type`) === 'atm_card' && (
                        <>
                          {renderFileInput(`collaterals.${index}.atmCardFrontImage`, "ATM Card Front Photo", index, "atmCardFrontImage")}
                          {renderFileInput(`collaterals.${index}.atmCardBackImage`, "ATM Card Back Photo", index, "atmCardBackImage")}
                          <FormField control={form.control} name={`collaterals.${index}.atmPin`} render={({ field }) => (
                            <FormItem><FormLabel>ATM PIN (Highly Sensitive)</FormLabel><FormControl><Input type="password" placeholder="xxxx" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormDescription className="text-destructive">Warning: Storing ATM PIN is a high security risk.</FormDescription><FormMessage /></FormItem>
                          )} />
                        </>
                      )}
                      {form.watch(`collaterals.${index}.type`) === 'blank_cheque' && (
                        <>
                           {renderFileInput(`collaterals.${index}.chequeImage`, "Blank Cheque Photo", index, "chequeImage")}
                           <FormField control={form.control} name={`collaterals.${index}.chequeNumber`} render={({ field }) => (
                            <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="Enter cheque number" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </>
                      )}
                       {form.watch(`collaterals.${index}.type`) === 'bank_statement' && renderFileInput(`collaterals.${index}.bankStatementFile`, "Bank Statement (PDF)", index, "bankStatementFile")}
                       {(form.watch(`collaterals.${index}.type`) === 'vehicle_bike' || form.watch(`collaterals.${index}.type`) === 'vehicle_car' || form.watch(`collaterals.${index}.type`) === 'vehicle_scooty') && (
                         <>
                            {renderFileInput(`collaterals.${index}.vehicleRcImage`, "Vehicle RC Photo", index, "vehicleRcImage")}
                            {renderFileInput(`collaterals.${index}.vehicleImage`, "Vehicle Photo", index, "vehicleImage")}
                             <FormField control={form.control} name={`collaterals.${index}.vehicleChallanDetails`} render={({ field }) => (
                              <FormItem><FormLabel>Challan Details (if any)</FormLabel><FormControl><Textarea placeholder="Describe any outstanding challans" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                            )} />
                         </>
                       )}
                       {(form.watch(`collaterals.${index}.type`) === 'property_house' || form.watch(`collaterals.${index}.type`) === 'property_land') && (
                         <>
                            {renderFileInput(`collaterals.${index}.propertyPapersFile`, "Property Papers (PDF/Images)", index, "propertyPapersFile")}
                            {renderFileInput(`collaterals.${index}.propertyImage`, "Property Photo (Optional)", index, "propertyImage")}
                         </>
                       )}
                        {(form.watch(`collaterals.${index}.type`) === 'gold_jewelry' || form.watch(`collaterals.${index}.type`) === 'other_asset') && (
                         <>
                             <FormField control={form.control} name={`collaterals.${index}.assetDetails`} render={({ field }) => (
                              <FormItem><FormLabel>Asset Details</FormLabel><FormControl><Textarea placeholder="Describe the asset (e.g., weight, purity for gold)" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                            )} />
                            {renderFileInput(`collaterals.${index}.assetImage`, "Asset Photo (Optional)", index, "assetImage")}
                         </>
                       )}
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendCollateral({
                      type: undefined as any,
                      description: "",
                      estimatedValue: '' as any,
                      atmPin: "",
                      chequeNumber: "",
                      vehicleChallanDetails: "",
                      assetDetails: "",
                      atmCardFrontImage: undefined,
                      atmCardBackImage: undefined,
                      chequeImage: undefined,
                      bankStatementFile: undefined,
                      vehicleRcImage: undefined,
                      vehicleImage: undefined,
                      propertyPapersFile: undefined,
                      propertyImage: undefined,
                      assetImage: undefined,
                      additionalDocuments: undefined
                    })}
                    disabled={isSubmitting}
                  >
                    <UploadCloud className="mr-2 h-4 w-4"/> Add Collateral Item
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="general_docs">
                    <AccordionTrigger className="text-lg font-semibold"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Other Supporting Documents (Optional)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="generalSupportingDocuments" // Use the array field name
                            render={() => (
                                <FormItem>
                                    <FormLabel>Upload Document (e.g., Payslip, Business Proof)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            onChange={(e) => handleFileChange(e, 'generalSupportingDocuments.0')} // Target first element of the array
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    {form.watch('generalSupportingDocuments.0') && typeof form.watch('generalSupportingDocuments.0') === 'string' && (
                                      <FormDescription>Selected: {form.watch('generalSupportingDocuments.0')?.substring(0, 50)}...</FormDescription> // Display truncated Base64 string
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormDescription>You can add more documents if needed later or as requested.</FormDescription>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6" disabled={isSubmitting || form.formState.isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting Application...</> : "Submit Loan Application Query"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}