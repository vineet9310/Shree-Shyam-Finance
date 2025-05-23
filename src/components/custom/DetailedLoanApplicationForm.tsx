
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
import { useState, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, Briefcase, UserCircle, FileText, ShieldCheck, Info, Trash2, UploadCloud, Paperclip, Users, Building, Car, Bike, LandPlot, Landmark } from "lucide-react";
import type { CollateralType } from "@/lib/types"; // Import the CollateralType

// Schema for a single file, useful for arrays of files.
const fileSchema = z.instanceof(File)
  .refine(file => file.size <= 5 * 1024 * 1024, "Max file size is 5MB.")
  .refine(
    file => ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
    ".jpg, .png, or .pdf files are accepted."
  );

const collateralSchema = z.object({
  type: z.custom<CollateralType>((val) => typeof val === 'string' && val.length > 0, {
    message: "Please select a collateral type.",
  }),
  description: z.string().min(5, "Description must be at least 5 characters."),
  estimatedValue: z.coerce.number().positive("Estimated value must be positive.").optional(),
  // ATM Card
  atmCardFrontImage: fileSchema.optional(),
  atmCardBackImage: fileSchema.optional(),
  atmPin: z.string().optional().describe("Highly sensitive, consider security implications."), // Add warning
  // Blank Cheque
  chequeImage: fileSchema.optional(),
  chequeNumber: z.string().optional(),
  // Bank Statement
  bankStatementFile: fileSchema.optional(),
  // Vehicle
  vehicleRcImage: fileSchema.optional(),
  vehicleImage: fileSchema.optional(),
  vehicleChallanDetails: z.string().optional(),
  // Property
  propertyPapersFile: fileSchema.optional(),
  propertyImage: fileSchema.optional(),
  // Other Asset
  assetDetails: z.string().optional(),
  assetImage: fileSchema.optional(),
  
  additionalDocuments: z.array(fileSchema).optional(),
});

const guarantorSchema = z.object({
  fullName: z.string().min(2, "Guarantor name is required."),
  address: z.string().min(5, "Guarantor address is required."),
  contactNo: z.string().min(10, "Guarantor contact number is required."),
  idProofType: z.enum(["aadhaar", "pan", "voter_id", "driving_license", "passport", "other"]),
  idProofDocument: fileSchema, // required
  addressProofType: z.enum(["aadhaar", "utility_bill", "rent_agreement", "passport", "other"]),
  addressProofDocument: fileSchema, // required
}).optional();


const loanApplicationFormSchema = z.object({
  // Borrower Details
  borrowerFullName: z.string().min(2, "Full name must be at least 2 characters."),
  borrowerContactNo: z.string().min(10, "Contact number must be at least 10 digits.").max(15),
  borrowerEmail: z.string().email("Invalid email address."),
  borrowerAddress: z.string().min(10, "Address must be at least 10 characters."),
  borrowerIdProofType: z.enum(["aadhaar", "pan", "voter_id", "driving_license", "passport", "other"]),
  borrowerIdProofDocument: fileSchema,
  borrowerAddressProofType: z.enum(["aadhaar", "utility_bill", "rent_agreement", "passport", "other"]),
  borrowerAddressProofDocument: fileSchema,
  
  // Loan Details
  loanAmount: z.coerce.number().min(1000, "Loan amount must be at least $1,000."),
  loanPurpose: z.string().min(10, "Please describe loan purpose (min 10 chars)."),
  
  // Guarantor (Optional)
  hasGuarantor: z.boolean().optional(),
  guarantor: guarantorSchema,

  // Collateral Details
  collaterals: z.array(collateralSchema).min(0).optional(), // Can be empty, but if present, must conform.

  // General Supporting Docs (Optional)
  generalSupportingDocuments: z.array(fileSchema).optional(),
});

type LoanApplicationFormValues = z.infer<typeof loanApplicationFormSchema>;

const collateralTypes: { value: CollateralType; label: string; icon: React.ElementType }[] = [
  { value: "atm_card", label: "ATM Card", icon: ShieldCheck },
  { value: "blank_cheque", label: "Blank Cheque", icon: FileText },
  { value: "bank_statement", label: "Bank Statement (3 Months)", icon: Building },
  { value: "vehicle_bike", label: "Vehicle - Bike", icon: Bike },
  { value: "vehicle_car", label: "Vehicle - Car", icon: Car },
  { value: "vehicle_scooty", label: "Vehicle - Scooty", icon: Bike }, // Using Bike icon
  { value: "property_house", label: "Property - House", icon: Landmark },
  { value: "property_land", label: "Property - Land", icon: LandPlot },
  { value: "gold_jewelry", label: "Gold/Jewelry", icon: DollarSign }, // Generic icon
  { value: "other_asset", label: "Other Asset", icon: Info },
];


export function DetailedLoanApplicationForm() {
  const { toast } = useToast();
  const [showGuarantor, setShowGuarantor] = useState(false);

  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationFormSchema),
    defaultValues: {
      borrowerFullName: "",
      borrowerContactNo: "",
      borrowerEmail: "",
      borrowerAddress: "",
      loanAmount: undefined,
      loanPurpose: "",
      hasGuarantor: false,
      guarantor: undefined,
      collaterals: [],
      generalSupportingDocuments: [],
    },
  });

  const { fields: collateralFields, append: appendCollateral, remove: removeCollateral } = useFieldArray({
    control: form.control,
    name: "collaterals",
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, fieldName: any, index?: number) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (typeof index === 'number') { // For array fields like collaterals
        const currentCollaterals = form.getValues("collaterals") || [];
        // This is a simplified way to set a file for a specific field within a collateral item.
        // For real usage, `fieldName` would be more specific, e.g., `collaterals.${index}.atmCardFrontImage`
        // form.setValue(`collaterals.${index}.${fieldName}`, file as any, { shouldValidate: true });
         // Example: if fieldName is 'atmCardFrontImage', it sets collaterals[index].atmCardFrontImage
        form.setValue(`collaterals.${index}.${fieldName as keyof typeof collateralFields[number]}`, file as any, { shouldValidate: true });

      } else { // For single file fields
        form.setValue(fieldName, file, { shouldValidate: true });
      }
    }
  };
  
  // Helper to render file input and display selected file name
  const renderFileInput = (fieldName: any, label: string, index?: number) => {
    const fileValue = typeof index === 'number' 
        ? form.watch(`collaterals.${index}.${fieldName as keyof typeof collateralFields[number]}`) 
        : form.watch(fieldName);
    const currentFile = fileValue instanceof File ? fileValue : null;

    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input 
            type="file" 
            onChange={(e) => handleFileChange(e, fieldName, index)}
            accept=".jpg,.jpeg,.png,.pdf"
            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </FormControl>
        {currentFile && <FormDescription>Selected: {currentFile.name}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  };


  async function onSubmit(values: LoanApplicationFormValues) {
    console.log("Loan Application Submitted:", values);

    // Here you would typically:
    // 1. Upload files to a secure storage (e.g., Firebase Storage) and get their URLs.
    // 2. Replace File objects in `values` with these URLs.
    // 3. Send the `values` object (with URLs) to your backend API.

    toast({
      title: "Application Query Submitted!",
      description: "Your loan application query has been received. We will review it shortly.",
      variant: "default",
    });
    // form.reset(); // Optionally reset form
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl my-8">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2"><FileText className="h-7 w-7 text-primary" />New Loan Application</CardTitle>
        <CardDescription>Please fill in all details accurately. This information will be used to assess your loan eligibility.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Accordion type="multiple" defaultValue={["borrower_details", "loan_details"]} className="w-full">
              {/* Borrower Details Section */}
              <AccordionItem value="borrower_details">
                <AccordionTrigger className="text-lg font-semibold"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Borrower Details</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField control={form.control} name="borrowerFullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Ramesh Kumar" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerContactNo" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input type="tel" placeholder="e.g., 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="ramesh@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerAddress" render={({ field }) => (
                    <FormItem><FormLabel>Full Address</FormLabel><FormControl><Textarea placeholder="House No, Street, City, State, Pincode" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="borrowerIdProofType" render={({ field }) => (
                    <FormItem><FormLabel>ID Proof Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select ID Proof" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="pan">PAN Card</SelectItem><SelectItem value="voter_id">Voter ID</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem><SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  {renderFileInput("borrowerIdProofDocument", "Upload ID Proof Document")}
                  
                  <FormField control={form.control} name="borrowerAddressProofType" render={({ field }) => (
                    <FormItem><FormLabel>Address Proof Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Address Proof" /></SelectTrigger></FormControl><SelectContent>
                       <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="utility_bill">Utility Bill (Electricity, Water)</SelectItem><SelectItem value="rent_agreement">Rent Agreement</SelectItem>
                       <SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  {renderFileInput("borrowerAddressProofDocument", "Upload Address Proof Document")}
                </AccordionContent>
              </AccordionItem>

              {/* Loan Details Section */}
              <AccordionItem value="loan_details">
                <AccordionTrigger className="text-lg font-semibold"><DollarSign className="mr-2 h-5 w-5 text-primary"/>Loan Details</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField control={form.control} name="loanAmount" render={({ field }) => (
                    <FormItem><FormLabel>Loan Amount Requested (₹)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="loanPurpose" render={({ field }) => (
                    <FormItem><FormLabel>Purpose of Loan</FormLabel><FormControl><Textarea placeholder="Detailed reason for needing the loan..." {...field} /></FormControl><FormMessage /></FormItem>
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
                                <Button type="button" variant={field.value ? "default" : "outline"} onClick={() => { field.onChange(!field.value); setShowGuarantor(!field.value); }}>
                                    {field.value ? "Remove Guarantor" : "Add Guarantor"}
                                </Button>
                            </FormControl>
                        </FormItem>
                    )} />
                    {showGuarantor && form.watch("hasGuarantor") && (
                        <>
                            <FormField control={form.control} name="guarantor.fullName" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Full Name</FormLabel><FormControl><Input placeholder="Guarantor's Name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="guarantor.contactNo" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Contact Number</FormLabel><FormControl><Input type="tel" placeholder="Guarantor's Contact" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="guarantor.address" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Address</FormLabel><FormControl><Textarea placeholder="Guarantor's Full Address" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="guarantor.idProofType" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor ID Proof Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select ID Proof" /></SelectTrigger></FormControl><SelectContent>
                                <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="pan">PAN Card</SelectItem><SelectItem value="voter_id">Voter ID</SelectItem>
                                <SelectItem value="driving_license">Driving License</SelectItem><SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                                </SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            {renderFileInput("guarantor.idProofDocument", "Upload Guarantor ID Proof")}
                            
                            <FormField control={form.control} name="guarantor.addressProofType" render={({ field }) => (
                                <FormItem><FormLabel>Guarantor Address Proof Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Address Proof" /></SelectTrigger></FormControl><SelectContent>
                                <SelectItem value="aadhaar">Aadhaar Card</SelectItem><SelectItem value="utility_bill">Utility Bill</SelectItem><SelectItem value="rent_agreement">Rent Agreement</SelectItem>
                                <SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem>
                                </SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            {renderFileInput("guarantor.addressProofDocument", "Upload Guarantor Address Proof")}
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
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeCollateral(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <h4 className="font-medium">Collateral Item #{index + 1}</h4>
                      <FormField control={form.control} name={`collaterals.${index}.type`} render={({ field }) => (
                        <FormItem><FormLabel>Type of Collateral</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select collateral type" /></SelectTrigger></FormControl>
                            <SelectContent>{collateralTypes.map(ct => <SelectItem key={ct.value} value={ct.value}><ct.icon className="inline-block mr-2 h-4 w-4"/>{ct.label}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`collaterals.${index}.description`} render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., Gold Necklace 22k, Honda Activa 2018 Model" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`collaterals.${index}.estimatedValue`} render={({ field }) => (
                        <FormItem><FormLabel>Estimated Value (₹)</FormLabel><FormControl><Input type="number" placeholder="Approximate market value" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      
                      {/* Conditional fields based on collateral type */}
                      {form.watch(`collaterals.${index}.type`) === 'atm_card' && (
                        <>
                          {renderFileInput(`atmCardFrontImage`, "ATM Card Front Photo", index)}
                          {renderFileInput(`atmCardBackImage`, "ATM Card Back Photo", index)}
                          <FormField control={form.control} name={`collaterals.${index}.atmPin`} render={({ field }) => (
                            <FormItem><FormLabel>ATM PIN (Highly Sensitive)</FormLabel><FormControl><Input type="password" placeholder="xxxx" {...field} /></FormControl><FormDescription className="text-destructive">Warning: Storing ATM PIN is a high security risk.</FormDescription><FormMessage /></FormItem>
                          )} />
                        </>
                      )}
                      {form.watch(`collaterals.${index}.type`) === 'blank_cheque' && (
                        <>
                           {renderFileInput(`chequeImage`, "Blank Cheque Photo", index)}
                           <FormField control={form.control} name={`collaterals.${index}.chequeNumber`} render={({ field }) => (
                            <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="Enter cheque number" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </>
                      )}
                       {form.watch(`collaterals.${index}.type`) === 'bank_statement' && renderFileInput(`bankStatementFile`, "Bank Statement (PDF)", index)}
                       {(form.watch(`collaterals.${index}.type`) === 'vehicle_bike' || form.watch(`collaterals.${index}.type`) === 'vehicle_car' || form.watch(`collaterals.${index}.type`) === 'vehicle_scooty') && (
                         <>
                            {renderFileInput(`vehicleRcImage`, "Vehicle RC Photo", index)}
                            {renderFileInput(`vehicleImage`, "Vehicle Photo", index)}
                             <FormField control={form.control} name={`collaterals.${index}.vehicleChallanDetails`} render={({ field }) => (
                              <FormItem><FormLabel>Challan Details (if any)</FormLabel><FormControl><Textarea placeholder="Describe any outstanding challans" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                         </>
                       )}
                       {(form.watch(`collaterals.${index}.type`) === 'property_house' || form.watch(`collaterals.${index}.type`) === 'property_land') && (
                         <>
                            {renderFileInput(`propertyPapersFile`, "Property Papers (PDF/Images)", index)}
                            {renderFileInput(`propertyImage`, "Property Photo (Optional)", index)}
                         </>
                       )}
                        {(form.watch(`collaterals.${index}.type`) === 'gold_jewelry' || form.watch(`collaterals.${index}.type`) === 'other_asset') && (
                         <>
                             <FormField control={form.control} name={`collaterals.${index}.assetDetails`} render={({ field }) => (
                              <FormItem><FormLabel>Asset Details</FormLabel><FormControl><Textarea placeholder="Describe the asset (e.g., weight, purity for gold)" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            {renderFileInput(`assetImage`, "Asset Photo (Optional)", index)}
                         </>
                       )}


                      {/* {renderFileInput(`collaterals.${index}.additionalDocuments`, "Upload Collateral Document(s)")} This would be for multiple files under one item, needs specific handling */}
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={() => appendCollateral({ type: undefined as any, description: "", estimatedValue: undefined })}>
                    <UploadCloud className="mr-2 h-4 w-4"/> Add Collateral Item
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* General Supporting Documents Section */}
                <AccordionItem value="general_docs">
                    <AccordionTrigger className="text-lg font-semibold"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Other Supporting Documents (Optional)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        {/* For simplicity, a single file input that can be extended to multiple later */}
                        {renderFileInput("generalSupportingDocuments.0", "Upload Document (e.g., Payslip, Business Proof)")} 
                        <FormDescription>You can add more documents if needed later or as requested.</FormDescription>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting Application..." : "Submit Loan Application Query"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
