// src/app/(main)/admin/applications/[id]/page.tsx

"use client";
import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { LoanApplication } from '@/lib/types';
import { ApplicationDetails } from '@/components/custom/ApplicationDetails';
import { RiskAssessmentClient } from '@/components/custom/RiskAssessmentClient';
import { ArrowLeft, CheckCircle, XCircle, Edit3, Loader2, AlertTriangleIcon, Mic, PlayCircle, Trash2 } from "lucide-react"; // Added Trash2 icon
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


// Helper function for client-side basic ID validation
const isValidMongoIdClientSide = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
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

  const applicationId = params.id as string;

  useEffect(() => {
    console.log("useEffect: Initial applicationId from params:", applicationId); // New log
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
          console.log("useEffect: Fetched application data ID:", appData.id); // New log
          setApplication({
            ...appData,
            fullName: appData.borrowerFullName || (appData.borrowerUserId as any)?.name || 'N/A',
            email: appData.borrowerEmail || (appData.borrowerUserId as any)?.email || 'N/A',
            loanAmount: appData.requestedAmount,
            loanPurpose: appData.purpose,
            submittedDate: appData.applicationDate,
            income: appData.income || 0,
            employmentStatus: appData.employmentStatus || 'N/A',
            creditScore: appData.creditScore || 0,
            // processedDocuments is handled by ApplicationDetails directly from URLs now
          });
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


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const maxSize = type === 'image' ? MAX_FILE_SIZE_MB : MAX_AUDIO_SIZE_MB;
      const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;

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

      if (type === 'image') {
        setRejectionReasonImageFile(file);
      } else {
        setRejectionReasonAudioFile(file);
      }
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
        console.error("handleUpdateApplicationStatus: Invalid application.id detected:", application.id); // New log
        toast({ title: "Error", description: "Invalid Application ID format. Cannot update.", variant: "destructive" });
        return;
    }

    setIsUpdatingStatus(true);
    setError(null); // Clear previous errors

    const payload: any = { status: newStatus };

    if (newStatus === 'Rejected') {
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
          <CardDescription>Approve or reject this loan application.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                disabled={application.status === 'Approved' || isUpdatingStatus}
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
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleUpdateApplicationStatus('Approved')} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUpdatingStatus}>
                  {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                        <Label htmlFor="rejectionImage">Upload Image</Label>
                        <Input
                            id="rejectionImage"
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            onChange={(e) => handleFileChange(e, 'image')}
                            disabled={isUpdatingStatus}
                            className="mt-1"
                        />
                        {rejectionReasonImageFile && (
                            <p className="text-xs text-muted-foreground mt-1">Selected: {rejectionReasonImageFile.name}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="rejectionAudio">Upload Record Audio</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                id="rejectionAudio"
                                type="file"
                                accept={ALLOWED_AUDIO_TYPES.join(',')}
                                onChange={(e) => setRejectionReasonAudioFile(e.target.files ? e.target.files[0] : null)}
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
        </CardContent>
      </Card>
    </div>
  );
}