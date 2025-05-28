// src/app/(main)/admin/applications/[id]/page.tsx

"use client";
import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication } from '@/lib/types';
import { ApplicationDetails } from '@/components/custom/ApplicationDetails';
import { RiskAssessmentClient } from '@/components/custom/RiskAssessmentClient';
import { ArrowLeft, CheckCircle, XCircle, Edit3, Loader2, AlertTriangleIcon, Mic, Image as ImageIcon, Volume2, PlayCircle, Trash2, IndianRupee, CalendarDays } from "lucide-react"; // Added Trash2, IndianRupee, CalendarDays
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import FormattedDate from "@/components/custom/FormattedDate"; // Import FormattedDate


// Helper function for client-side basic ID validation
// Modified to allow mock IDs starting with 'mock' for development
const isValidMongoIdClientSide = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  // Allow mock IDs for development, e.g., "mockadmin_vineet"
  if (id.startsWith('mock')) return true;
  // Standard MongoDB ObjectId validation
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Helper to convert File to Base64 Data URI (for client-side forms)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const MAX_FILE_SIZE_MB = 5; // 5MB
const MAX_AUDIO_SIZE_MB = 10; // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg"]; // e.g., mp3, wav, ogg

export default function AdminApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user for adminId
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // State for rejection reasons
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejectionReasonImageFile, setRejectionReasonImageFile] = useState<File | null>(null);
  const [rejectionReasonAudioFile, setRejectionReasonAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null); // For playing recorded audio

  // State for Loan Approval details
  const [approvedAmount, setApprovedAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [loanTermMonths, setLoanTermMonths] = useState<number | ''>('');
  const [repaymentFrequency, setRepaymentFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom' | ''>('');

  // State for Loan Disbursement details
  const [disbursementAmount, setDisbursementAmount] = useState<number | ''>('');
  const [disbursementPaymentMethod, setDisbursementPaymentMethod] = useState<string>('');
  const [disbursementTransactionRef, setDisbursementTransactionRef] = useState<string>('');
  const [disbursementNotes, setDisbursementNotes] = useState<string>('');
  const [disbursementScreenshot, setDisbursementScreenshot] = useState<File | null>(null);
  const [isDisbursing, setIsDisbursing] = useState(false);

  // State for Payment Recording details
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentTransactionRef, setPaymentTransactionRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);


  const applicationId = params.id as string;

  useEffect(() => {
    if (!applicationId) {
      setIsLoading(true);
      setError(null);
      setApplication(null);
      return;
    }

    if (applicationId === "[id]") {
        setError("Invalid page URL. Please select a specific application to view from the dashboard.");
        setIsLoading(false);
        setApplication(null);
        return;
    }

    if (!isValidMongoIdClientSide(applicationId)) {
      setError("Invalid Application ID format in URL.");
      setIsLoading(false);
      setApplication(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    fetch(`/api/loan-applications/${applicationId}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || `Failed to fetch application. Status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.application) {
          const appData = data.application;
          setApplication({
            ...appData,
            fullName: appData.borrowerFullName || (appData.borrowerUserId as any)?.name || 'N/A',
            email: appData.borrowerEmail || (appData.borrowerUserId as any)?.email || 'N/A',
            loanAmount: appData.requestedAmount,
            loanPurpose: appData.purpose,
            submittedDate: appData.applicationDate,
            monthlyIncome: appData.monthlyIncome || 0, // Use monthlyIncome
            employmentStatus: appData.employmentStatus || 'N/A',
            jobType: appData.jobType || 'N/A',
            businessDescription: appData.businessDescription || 'N/A',
            creditScore: appData.creditScore || 0,
            // Populate approval fields if already approved
            approvedAmount: appData.approvedAmount || '',
            interestRate: appData.interestRate || '',
            loanTermMonths: appData.loanTermMonths || '',
            repaymentFrequency: appData.repaymentFrequency || '',
          });
          // Set disbursement amount default if loan is approved
          if (appData.status === 'Approved' && appData.approvedAmount) {
            setDisbursementAmount(appData.approvedAmount);
          }
        } else {
          setError(data.message || 'Could not fetch application details');
          setApplication(null);
        }
      })
      .catch(err => {
        console.error("Error fetching application details:", err);
        setError(err.message || "An unexpected error occurred while fetching the application.");
        setApplication(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [applicationId]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'screenshot', setState: Function) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const maxSize = type === 'audio' ? MAX_AUDIO_SIZE_MB : MAX_FILE_SIZE_MB;
      const allowedTypes = type === 'audio' ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES; // Screenshots are usually images

      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `File "${file.name}" is too large. Max size is ${maxSize}MB.`,
          variant: "destructive",
        });
        event.target.value = '';
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `File "${file.name}" has an unsupported type. Allowed: ${allowedTypes.join(', ')}.`,
          variant: "destructive",
        });
        event.target.value = '';
        return;
      }
      setState(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Check audio blob size
        if (audioBlob.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
            toast({
                title: "Recording Too Long",
                description: `Recorded audio is too large. Max size is ${MAX_AUDIO_SIZE_MB}MB.`,
                variant: "destructive",
            });
            setRejectionReasonAudioFile(null); // Clear file if too big
            return;
        }
        setRejectionReasonAudioFile(audioBlob as File);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({title: "Recording Started", description: "Recording audio for rejection reason."});
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Access Denied",
        description: "Could not access your microphone. Please grant permission.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    toast({title: "Recording Stopped", description: "Audio recording finished."});
  };

  const playRecordedAudio = () => {
    if (rejectionReasonAudioFile) {
        const audioUrl = URL.createObjectURL(rejectionReasonAudioFile);
        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            audioRef.current.onended = () => {
                URL.revokeObjectURL(audioUrl); // Clean up
            };
        }
    }
  };

  const clearRecordedAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear the audio source
    }
    if (rejectionReasonAudioFile) {
      URL.revokeObjectURL(URL.createObjectURL(rejectionReasonAudioFile)); // Clean up previous URL if any
    }
    setRejectionReasonAudioFile(null);
    setIsRecording(false); // Ensure recording state is reset
    toast({title: "Audio Cleared", description: "Recorded audio has been removed."});
  };


  const handleUpdateApplicationStatus = async (newStatus: LoanApplication['status']) => {
    if (!application || !application.id) {
      toast({ title: "Error", description: "Application data not available.", variant: "destructive" });
      return;
    }

    // Explicitly validate application.id before sending to API
    if (!isValidMongoIdClientSide(application.id)) {
        toast({ title: "Error", description: "Invalid Application ID format. Cannot update.", variant: "destructive" });
        return;
    }

    setIsUpdatingStatus(true);
    setError(null); // Clear previous errors

    const payload: any = { status: newStatus };

    if (newStatus === 'Approved') {
        if (approvedAmount === '' || interestRate === '' || loanTermMonths === '' || repaymentFrequency === '') {
            toast({ title: "Approval Details Required", description: "Please fill in Approved Amount, Interest Rate, Loan Term, and Repayment Frequency.", variant: "destructive" });
            setIsUpdatingStatus(false);
            return;
        }
        payload.approvedAmount = Number(approvedAmount);
        payload.interestRate = Number(interestRate);
        payload.loanTermMonths = Number(loanTermMonths);
        payload.repaymentFrequency = repaymentFrequency;
    } else if (newStatus === 'Rejected') {
        if (!rejectionReasonText.trim() && !rejectionReasonImageFile && !rejectionReasonAudioFile) {
            toast({ title: "Rejection Reason Required", description: "Please provide a text, image, or audio reason for rejection.", variant: "destructive" });
            setIsUpdatingStatus(false);
            return;
        }
        payload.rejectionReasonText = rejectionReasonText.trim();
        payload.adminId = user?.id; // Pass admin's ID

        try {
            if (rejectionReasonImageFile) {
                payload.rejectionReasonImage = await fileToBase64(rejectionReasonImageFile);
            }
            if (rejectionReasonAudioFile) {
                payload.rejectionReasonAudio = await fileToBase64(rejectionReasonAudioFile);
            }
        } catch (fileError: any) {
            toast({ title: "File Conversion Error", description: `Failed to process media file: ${fileError.message}`, variant: "destructive" });
            setIsUpdatingStatus(false);
            return;
        }
    }

    console.log("Attempting to update application status for ID:", application.id); // Debugging log

    try {
      const response = await fetch(`/api/loan-applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setApplication(prev => prev ? {
          ...prev,
          ...result.application, // Update with the full application object from API
           fullName: result.application.borrowerFullName || (result.application.borrowerUserId as any)?.name || 'N/A',
           email: result.application.borrowerEmail || (result.application.borrowerUserId as any)?.email || 'N/A',
           loanAmount: result.application.requestedAmount,
           loanPurpose: result.application.purpose,
           submittedDate: result.application.applicationDate,
        } : null);
        toast({
          title: "Status Updated",
          description: `Loan application for ${application.borrowerFullName || 'N/A'} is now ${newStatus.toLowerCase()}.`,
        });
        // Clear rejection reason states after successful rejection
        if (newStatus === 'Rejected') {
            setRejectionReasonText('');
            setRejectionReasonImageFile(null);
            setRejectionReasonAudioFile(null);
        }
        // Reset approval fields after successful approval
        if (newStatus === 'Approved') {
            setApprovedAmount('');
            setInterestRate('');
            setLoanTermMonths('');
            setRepaymentFrequency('');
        }
      } else {
        throw new Error(result.message || "Failed to update application status.");
      }
    } catch (err: any) {
      console.error("Error updating application status:", err);
      setError(err.message || "An unexpected error occurred while updating status.");
      toast({
        title: "Update Failed",
        description: err.message || "Could not update application status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDisburseLoan = async () => {
    if (!application || !application.id) {
      toast({ title: "Error", description: "Application data not available.", variant: "destructive" });
      return;
    }
    // Check if user is available and has an valid MongoDB ID
    if (!user || !user.id || !isValidMongoIdClientSide(user.id)) {
      toast({ title: "Error", description: "Valid Admin user data (ID) not available. Please log in as an admin with a valid database ID.", variant: "destructive" });
      console.error("Admin user ID is missing or invalid for disbursement:", user?.id);
      return;
    }

    if (disbursementAmount === '' || disbursementAmount <= 0 || !disbursementPaymentMethod) {
        toast({ title: "Disbursement Details Required", description: "Please provide a valid amount and payment method.", variant: "destructive" });
        return;
    }
    if (disbursementPaymentMethod !== 'cash' && !disbursementScreenshot) {
        toast({ title: "Screenshot Required", description: "Please upload a screenshot for online payments.", variant: "destructive" });
        return;
    }

    setIsDisbursing(true);
    setError(null);

    const payload: any = {
        adminId: user.id,
        disbursementAmount: Number(disbursementAmount),
        paymentMethod: disbursementPaymentMethod,
        transactionReference: disbursementTransactionRef.trim(),
        notes: disbursementNotes.trim(),
    };

    try {
        if (disbursementScreenshot) {
            payload.disbursementScreenshot = await fileToBase64(disbursementScreenshot);
        }
    } catch (fileError: any) {
        toast({ title: "File Conversion Error", description: `Failed to process screenshot: ${fileError.message}`, variant: "destructive" });
        setIsDisbursing(false);
        return;
    }

    try {
        const response = await fetch(`/api/loan-applications/${application.id}/disburse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (response.ok && result.success) {
            setApplication(prev => prev ? { ...prev, ...result.application } : null);
            toast({ title: "Loan Disbursed", description: `Loan of ₹${disbursementAmount.toLocaleString()} disbursed successfully.`, });
            // Reset disbursement form fields
            setDisbursementAmount('');
            setDisbursementPaymentMethod('');
            setDisbursementTransactionRef('');
            setDisbursementNotes('');
            setDisbursementScreenshot(null);
        } else {
            throw new Error(result.message || "Failed to disburse loan.");
        }
    } catch (err: any) {
        console.error("Error disbursing loan:", err);
        setError(err.message || "An unexpected error occurred during disbursement.");
        toast({ title: "Disbursement Failed", description: err.message || "Could not disburse loan.", variant: "destructive", });
    } finally {
        setIsDisbursing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!application || !application.id) {
      toast({ title: "Error", description: "Application data not available.", variant: "destructive" });
      return;
    }
    // Check if user is available and has an valid MongoDB ID
    if (!user || !user.id || !isValidMongoIdClientSide(user.id)) {
      toast({ title: "Error", description: "Valid Admin user data (ID) not available. Please log in as an admin with a valid database ID.", variant: "destructive" });
      console.error("Admin user ID is missing or invalid for payment recording:", user?.id);
      return;
    }

    if (paymentAmount === '' || paymentAmount <= 0 || !paymentMethod || !paymentDate) {
        toast({ title: "Payment Details Required", description: "Please provide a valid amount, date, and payment method.", variant: "destructive" });
        return;
    }
    if (paymentMethod !== 'cash' && !paymentScreenshot) {
        toast({ title: "Screenshot Required", description: "Please upload a screenshot for online payments.", variant: "destructive" });
        return;
    }

    setIsRecordingPayment(true);
    setError(null);

    const payload: any = {
        adminId: user.id,
        paymentAmount: Number(paymentAmount),
        paymentMethod: paymentMethod,
        transactionReference: paymentTransactionRef.trim(),
        notes: paymentNotes.trim(),
        paymentDate: paymentDate.toISOString(), // Send as ISO string
    };

    try {
        if (paymentScreenshot) {
            payload.paymentScreenshot = await fileToBase64(paymentScreenshot);
        }
    } catch (fileError: any) {
        toast({ title: "File Conversion Error", description: `Failed to process screenshot: ${fileError.message}`, variant: "destructive" });
        setIsRecordingPayment(false);
        return;
    }

    try {
        const response = await fetch(`/api/loan-applications/${application.id}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (response.ok && result.success) {
            setApplication(prev => prev ? { ...prev, ...result.application } : null); // Update application state
            toast({ title: "Payment Recorded", description: `Payment of ₹${paymentAmount.toLocaleString()} recorded successfully.`, });
            // Reset payment form fields
            setPaymentAmount('');
            setPaymentMethod('');
            setPaymentTransactionRef('');
            setPaymentNotes('');
            setPaymentScreenshot(null);
            setPaymentDate(new Date());
        } else {
            throw new Error(result.message || "Failed to record payment.");
        }
    } catch (err: any) {
        console.error("Error recording payment:", err);
        setError(err.message || "An unexpected error occurred during payment recording.");
        toast({ title: "Payment Recording Failed", description: err.message || "Could not record payment.", variant: "destructive", });
    } finally {
        setIsRecordingPayment(false);
    }
  };


  if (!applicationId && !error && isLoading) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /><p>Loading application ID...</p></div>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /><p>Loading application details...</p></div>;
  }

  if (error) {
     return (
      <div className="space-y-4 p-4">
         <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
          </Button>
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error Loading Application</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!application) {
    return (
       <div className="space-y-4 p-4">
         <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
          </Button>
        <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Application Not Found</AlertTitle>
            <AlertDescription>The requested loan application could not be found or an error occurred after attempting to load.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
      </Button>

      <ApplicationDetails application={application} />

      <RiskAssessmentClient application={application} />

      {/* Admin Actions for Status Update */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Edit3 className="h-6 w-6 text-primary"/>Application Actions</CardTitle>
          <CardDescription>Approve, reject, disburse, or record payments for this loan application.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          {/* Approve Loan Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                disabled={application.status === 'Approved' || application.status === 'Active' || isUpdatingStatus}
              >
                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve this loan application for {application.borrowerFullName || 'N/A'}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="mt-4 space-y-3">
                <Label htmlFor="approvedAmount">Approved Amount (₹)</Label>
                <Input id="approvedAmount" type="number" placeholder="e.g., 50000" value={approvedAmount} onChange={(e) => setApprovedAmount(Number(e.target.value))} disabled={isUpdatingStatus} />

                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input id="interestRate" type="number" placeholder="e.g., 12.5" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} disabled={isUpdatingStatus} />

                <Label htmlFor="loanTermMonths">Loan Term (Months)</Label>
                <Input id="loanTermMonths" type="number" placeholder="e.g., 12" value={loanTermMonths} onChange={(e) => setLoanTermMonths(Number(e.target.value))} disabled={isUpdatingStatus} />

                <Label htmlFor="repaymentFrequency">Repayment Frequency</Label>
                <Select value={repaymentFrequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'custom') => setRepaymentFrequency(value)} disabled={isUpdatingStatus}>
                    <SelectTrigger id="repaymentFrequency">
                        <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleUpdateApplicationStatus('Approved')} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUpdatingStatus}>
                  {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reject Loan Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={application.status === 'Rejected' || isUpdatingStatus}
              >
                 {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reject this loan application for {application.borrowerFullName || 'N/A'}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              {/* Moved rejection reason inputs outside AlertDialogDescription */}
              <div className="mt-4 space-y-3 p-4 pt-0"> {/* Added padding to align with description */}
                <Label htmlFor="rejectionReason">Rejection Reason (Text)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why the application is being rejected..."
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  disabled={isUpdatingStatus}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <Label htmlFor="rejectionImage">Upload Image (Optional)</Label>
                        <Input
                            id="rejectionImage"
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            onChange={(e) => handleFileChange(e, 'image', setRejectionReasonImageFile)}
                            disabled={isUpdatingStatus}
                            className="mt-1"
                        />
                        {rejectionReasonImageFile && (
                            <p className="text-xs text-muted-foreground mt-1">Selected: {rejectionReasonImageFile.name}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="rejectionAudio">Upload/Record Audio (Optional)</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                id="rejectionAudio"
                                type="file"
                                accept={ALLOWED_AUDIO_TYPES.join(',')}
                                onChange={(e) => handleFileChange(e, 'audio', setRejectionReasonAudioFile)}
                                disabled={isUpdatingStatus || isRecording}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isUpdatingStatus}
                                className={isRecording ? "text-red-500 animate-pulse" : ""}
                            >
                                <Mic className="h-4 w-4" />
                            </Button>
                        </div>
                        {rejectionReasonAudioFile && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                Selected: {rejectionReasonAudioFile.name}
                                <Button type="button" variant="ghost" size="sm" onClick={playRecordedAudio} className="ml-2 h-6">
                                    <PlayCircle className="h-4 w-4 mr-1"/> Play
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={clearRecordedAudio} className="ml-1 h-6 text-red-500">
                                    <Trash2 className="h-4 w-4 mr-1"/> Clear
                                </Button>
                                <audio ref={audioRef} className="hidden"></audio> {/* Hidden audio player */}
                            </p>
                        )}
                    </div>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleUpdateApplicationStatus('Rejected')} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isUpdatingStatus}>
                  {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Reject
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Disburse Loan Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={application.status !== 'Approved' || isDisbursing}
              >
                {isDisbursing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <IndianRupee className="mr-2 h-4 w-4" /> Disburse Loan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disburse Loan</AlertDialogTitle>
                {/* Wrapped content in a single div for AlertDialogDescription */}
                <AlertDialogDescription asChild>
                  <div>
                    Disburse the approved loan amount to {application.borrowerFullName || 'N/A'}.
                    <div className="text-sm text-muted-foreground mt-2">
                      Approved Amount: ₹{application.approvedAmount?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="mt-4 space-y-3">
                <Label htmlFor="disbursementAmount">Disbursement Amount (₹)</Label>
                <Input id="disbursementAmount" type="number" placeholder="e.g., 48000" value={disbursementAmount} onChange={(e) => setDisbursementAmount(Number(e.target.value))} disabled={isDisbursing} />

                <Label htmlFor="disbursementPaymentMethod">Payment Method</Label>
                <Select value={disbursementPaymentMethod} onValueChange={setDisbursementPaymentMethod} disabled={isDisbursing}>
                    <SelectTrigger id="disbursementPaymentMethod">
                        <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online_transfer_upi">Online Transfer (UPI)</SelectItem>
                        <SelectItem value="online_transfer_neft">Online Transfer (NEFT)</SelectItem>
                        <SelectItem value="cheque_deposit">Cheque Deposit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>

                {disbursementPaymentMethod !== 'cash' && disbursementPaymentMethod !== '' && (
                    <>
                        <Label htmlFor="disbursementScreenshot">Upload Screenshot (for Online/Cheque)</Label>
                        <Input
                            id="disbursementScreenshot"
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            onChange={(e) => handleFileChange(e, 'screenshot', setDisbursementScreenshot)}
                            disabled={isDisbursing}
                        />
                        {disbursementScreenshot && (
                            <p className="text-xs text-muted-foreground mt-1">Selected: {disbursementScreenshot.name}</p>
                        )}
                    </>
                )}

                <Label htmlFor="disbursementTransactionRef">Transaction Reference (Optional)</Label>
                <Input id="disbursementTransactionRef" placeholder="e.g., UPI ID, Cheque No." value={disbursementTransactionRef} onChange={(e) => setDisbursementTransactionRef(e.target.value)} disabled={isDisbursing} />

                <Label htmlFor="disbursementNotes">Notes (Optional)</Label>
                <Textarea id="disbursementNotes" placeholder="Any additional notes about disbursement" value={disbursementNotes} onChange={(e) => setDisbursementNotes(e.target.value)} disabled={isDisbursing} />

              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDisbursing}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisburseLoan} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={isDisbursing}>
                  {isDisbursing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Disburse
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Record Payment Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={application.status !== 'Active' && application.status !== 'Overdue' || isRecordingPayment}
              >
                {isRecordingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <IndianRupee className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Record Payment</AlertDialogTitle>
                {/* Wrapped content in a single div for AlertDialogDescription */}
                <AlertDialogDescription asChild>
                  <div>
                    Record a payment received for this loan application.
                    <div className="text-sm text-muted-foreground mt-2">
                      Next Due Date: <FormattedDate dateString={application.nextPaymentDueDate} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Next Payment Amount: ₹{application.nextPaymentAmount?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="mt-4 space-y-3">
                <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
                <Input id="paymentAmount" type="number" placeholder="e.g., 5000" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} disabled={isRecordingPayment} />

                <Label htmlFor="paymentDate">Payment Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !paymentDate && "text-muted-foreground"
                            )}
                            disabled={isRecordingPayment}
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={paymentDate}
                            onSelect={setPaymentDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isRecordingPayment}>
                    <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online_transfer_upi">Online Transfer (UPI)</SelectItem>
                        <SelectItem value="online_transfer_neft">Online Transfer (NEFT)</SelectItem>
                        <SelectItem value="cheque_deposit">Cheque Deposit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>

                {paymentMethod !== 'cash' && paymentMethod !== '' && (
                    <>
                        <Label htmlFor="paymentScreenshot">Upload Screenshot (for Online/Cheque)</Label>
                        <Input
                            id="paymentScreenshot"
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            onChange={(e) => handleFileChange(e, 'screenshot', setPaymentScreenshot)}
                            disabled={isRecordingPayment}
                        />
                        {paymentScreenshot && (
                            <p className="text-xs text-muted-foreground mt-1">Selected: {paymentScreenshot.name}</p>
                        )}
                    </>
                )}

                <Label htmlFor="paymentTransactionRef">Transaction Reference (Optional)</Label>
                <Input id="paymentTransactionRef" placeholder="e.g., UPI ID, Cheque No." value={paymentTransactionRef} onChange={(e) => setPaymentTransactionRef(e.target.value)} disabled={isRecordingPayment} />

                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Textarea id="paymentNotes" placeholder="Any additional notes about payment" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} disabled={isRecordingPayment} />

              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRecordingPayment}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRecordPayment} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isRecordingPayment}>
                  {isRecordingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Payment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </CardContent>
      </Card>
    </div>
  );
}
