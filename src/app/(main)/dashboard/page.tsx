// File: src/app/(main)/dashboard/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// Import NotificationTypeEnum
import type { LoanApplication, LoanApplicationStatus, PaymentHistoryEntry, SystemNotification, NotificationTypeEnum } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { TrendingUp, History, CalendarClock, AlertTriangle, CheckCircle2, Clock, IndianRupee, FileText, Loader2, Eye, Users, ListChecks, ShieldCheck, BellRing, MessageSquare, Info, Volume2, Image as ImageIcon, XCircle, Hourglass } from "lucide-react";
import FormattedDate from "@/components/custom/FormattedDate";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = <Clock className="mr-1 h-3 w-3" />;

  switch (status) {
    case "Approved":
    case "Disbursed": 
    case "Active": 
    case "PaidOff":
      variant = "default";
      icon = <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />; 
      break;
    case "QueryInitiated":
    case "PendingAdminVerification":
    case "Submitted": 
      variant = "secondary";
      icon = <Hourglass className="mr-1 h-3 w-3 text-yellow-500" />; 
      break;
    case "Rejected":
    case "Overdue":
    case "Defaulted":
      variant = "destructive";
      icon = <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />; 
      break;
    case "AdditionalInfoRequired":
      variant = "outline"; 
      icon = <FileText className="mr-1 h-3 w-3 text-blue-500" />; 
      break;
    default:
      icon = <FileText className="mr-1 h-3 w-3" />;
  }
  return <Badge variant={variant} className="capitalize text-xs flex items-center whitespace-nowrap px-2 py-0.5">{icon}{status.replace(/([A-Z])/g, ' $1').trim()}</Badge>;
};


export default function DashboardPage() {
  const { user } = useAuth();
  const [userLoanApplications, setUserLoanApplications] = useState<LoanApplication[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  // State for notifications that are currently displayed to the user
  const [notifications, setNotifications] = useState<SystemNotification[]>([]); 
  // State to store all notifications fetched from the API during the session (or a reasonable batch)
  const [allFetchedUserNotifications, setAllFetchedUserNotifications] = useState<SystemNotification[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [errorLoans, setErrorLoans] = useState<string | null>(null);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null);
  const { toast } = useToast();
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  const NOTIFICATION_VISIBLE_DURATION_MS = 48 * 60 * 60 * 1000; // Changed to 48 hours

  const playNotificationAudio = (audioUrl: string) => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.src = audioUrl;
      notificationAudioRef.current.play().catch(e => console.error("Error playing notification audio:", e));
      toast({ title: "Playing Notification", description: "Audio message is now playing." });
    }
  };

  // Function to process notifications: 
  // 1. If a loan is approved, hide its previous rejection notifications.
  // 2. If a loan is rejected, hide its previous approval notifications.
  // 3. Filter out notifications older than the specified duration.
  // 4. Sort, ensure uniqueness, and limit to 20.
  const filterAndSortNotifications = (
    fetchedNotifications: SystemNotification[],
    currentTime: number // Pass current time for consistent filtering
  ): SystemNotification[] => {
    const notificationsByLoanId: { [key: string]: SystemNotification[] } = {};
    const otherNotifications: SystemNotification[] = [];

    // Helper functions to identify notification types
    const isApprovalNotif = (n: SystemNotification) =>
        n.type === "loan_approved" || // Specific type if you add it
        (n.type === "loan_status_updated" && n.message.toLowerCase().includes("approved"));
    
    const isRejectionNotif = (n: SystemNotification) =>
        n.type === "loan_rejected_details" || // Specific type for rejections with details
        (n.type === "loan_status_updated" && n.message.toLowerCase().includes("rejected"));


    // Group notifications by loanApplicationId
    for (const notif of fetchedNotifications) {
        if (notif.loanApplicationId) {
            if (!notificationsByLoanId[notif.loanApplicationId]) {
                notificationsByLoanId[notif.loanApplicationId] = [];
            }
            notificationsByLoanId[notif.loanApplicationId].push(notif);
        } else {
            otherNotifications.push(notif);
        }
    }

    let processedLoanNotifications: SystemNotification[] = [];
    for (const loanId in notificationsByLoanId) {
        let loanSpecificNotifs = [...notificationsByLoanId[loanId]]; // Work with a copy

        // Sort by createdAt to easily find the latest status messages for a loan (newest first)
        loanSpecificNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const latestApproval = loanSpecificNotifs.find(isApprovalNotif);
        const latestRejection = loanSpecificNotifs.find(isRejectionNotif);

        if (latestApproval && latestRejection) {
            // Both approval and rejection notifications exist for this loan
            if (new Date(latestApproval.createdAt).getTime() > new Date(latestRejection.createdAt).getTime()) {
                // Approval is newer, filter out all rejections for this loan
                loanSpecificNotifs = loanSpecificNotifs.filter(n => !isRejectionNotif(n));
            } else {
                // Rejection is newer (or same time), filter out all approvals for this loan
                loanSpecificNotifs = loanSpecificNotifs.filter(n => !isApprovalNotif(n));
            }
        } else if (latestApproval) {
            // Only approval found
            loanSpecificNotifs = loanSpecificNotifs.filter(n => !isRejectionNotif(n));
        } else if (latestRejection) {
            // Only rejection found
            loanSpecificNotifs = loanSpecificNotifs.filter(n => !isApprovalNotif(n));
        }
        processedLoanNotifications.push(...loanSpecificNotifs);
    }

    let allCombinedNotifications = [...otherNotifications, ...processedLoanNotifications];
    
    // Filter by time: only keep notifications newer than the specified duration
    const timeFilteredNotifications = allCombinedNotifications.filter(notif =>
      (currentTime - new Date(notif.createdAt).getTime()) < NOTIFICATION_VISIBLE_DURATION_MS
    );

    timeFilteredNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const uniqueNotifications = Array.from(new Map(timeFilteredNotifications.map(item => [item.id, item])).values());
    return uniqueNotifications.slice(0, 20);
  };


  // useEffect for fetching initial data
  useEffect(() => {
    if (typeof window !== "undefined") {
        notificationAudioRef.current = new Audio();
    }

    const fetchUserLoans = async () => {
      if (!user?.id) {
        setIsLoadingLoans(false);
        setUserLoanApplications([]);
        return;
      }
      setIsLoadingLoans(true);
      setErrorLoans(null);
      try {
        const response = await fetch(`/api/loan-applications?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch loan applications for user and could not parse error response' }));
          throw new Error(errorData.message || 'Failed to fetch loan applications for user');
        }
        const data = await response.json();
        if (data && data.success && Array.isArray(data.applications)) {
            setUserLoanApplications(data.applications);
        } else if (Array.isArray(data)) { 
             setUserLoanApplications(data);
        }
         else {
          setUserLoanApplications([]);
        }
      } catch (err: any) {
        setErrorLoans(err.message);
        toast({
          title: "Error loading loan applications",
          description: err.message || "Could not load your loan applications.",
          variant: "destructive",
        });
        setUserLoanApplications([]);
      } finally {
        setIsLoadingLoans(false);
      }
    };

    const fetchUserNotifications = async () => {
      if (!user?.id) {
        setIsLoadingNotifications(false);
        setNotifications([]);
        setAllFetchedUserNotifications([]);
        return;
      }
      setIsLoadingNotifications(true);
      setErrorNotifications(null);
      try {
        const response = await fetch(`/api/notifications?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notifications for user and could not parse error response' }));
          throw new Error(errorData.message || 'Failed to fetch notifications for user');
        }
        const data = await response.json();
        if (data && data.success && Array.isArray(data.notifications)) {
            setAllFetchedUserNotifications(data.notifications); 
            setNotifications(filterAndSortNotifications(data.notifications, Date.now())); 
        } else if (Array.isArray(data)) { 
            setAllFetchedUserNotifications(data);
            setNotifications(filterAndSortNotifications(data, Date.now()));
        }
        else {
          setNotifications([]);
          setAllFetchedUserNotifications([]);
        }
      } catch (err: any) {
        setErrorNotifications(err.message);
        toast({
          title: "Error loading notifications",
          description: err.message || "Could not load your notifications.",
          variant: "destructive",
        });
        setNotifications([]);
        setAllFetchedUserNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };


    if (user && user.role !== 'admin' && user.id) {
      fetchUserLoans();
      fetchUserNotifications();
    } else {
      setUserLoanApplications([]);
      setNotifications([]);
      setAllFetchedUserNotifications([]);
      setIsLoadingLoans(false);
      setIsLoadingNotifications(false);
    }
    setPaymentHistory([]); 
  }, [user, toast]);

  useEffect(() => {
    if (!user || user.role === 'admin' || !user.id || allFetchedUserNotifications.length === 0) {
        if(notifications.length > 0) setNotifications([]);
        return;
    }

    const intervalId = setInterval(() => {
      const newlyFiltered = filterAndSortNotifications(allFetchedUserNotifications, Date.now());
      setNotifications(prevDisplayed => {
          if (JSON.stringify(newlyFiltered) !== JSON.stringify(prevDisplayed)) {
              return newlyFiltered;
          }
          return prevDisplayed;
      });
    }, 1 * 60 * 1000); 

    return () => clearInterval(intervalId); 

  }, [user, allFetchedUserNotifications]); 


  const pendingApplications = userLoanApplications.filter(
    app => ['QueryInitiated', 'PendingAdminVerification', 'AdditionalInfoRequired', 'Submitted'].includes(app.status)
  );

  const activeOrApprovedLoans = userLoanApplications.filter(
    app => ['Active', 'Approved', 'Overdue', 'PaidOff', 'Disbursed'].includes(app.status)
  );

  const dateDisplayOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };


  if (user?.role === 'admin') {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name || user?.email}! (Admin)</h1>
          <p className="text-muted-foreground">Quick access to administrative tools.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users (Placeholder)</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">150</div>
              <p className="text-xs text-muted-foreground">+5 since last week</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications (Placeholder)</CardTitle>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Requires review</p>
            </CardContent>
          </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active Loans (Placeholder)</CardTitle>
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹5,67,890</div>
              <p className="text-xs text-muted-foreground">Total amount disbursed</p>
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary"/>Admin Actions</CardTitle>
            <CardDescription>Navigate to key administrative sections.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button asChild size="lg" className="w-full">
              <Link href={ROUTES.ADMIN_DASHBOARD}>
                <ListChecks className="mr-2 h-5 w-5" /> View All Loan Applications
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href={ROUTES.ADMIN_USERS}>
                <Users className="mr-2 h-5 w-5" /> Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name || user?.email}!</h1>
          <p className="text-muted-foreground">Here's an overview of your loan activities.</p>
        </div>
        {user?.role !== 'admin' && (
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={ROUTES.APPLY_LOAN}>
              <TrendingUp className="mr-2 h-4 w-4" /> Apply for New Loan
            </Link>
          </Button>
        )}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing className="h-6 w-6 text-primary" />My Notifications</CardTitle>
          <CardDescription>Recent updates and alerts regarding your account and applications. Notifications older than 48 hours are automatically hidden.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingNotifications && notifications.length === 0 ? ( 
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p>Loading notifications...</p>
            </div>
          ) : errorNotifications ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load notifications</p>
              <p className="text-sm">{errorNotifications}</p>
            </div>
          ) : notifications.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <li key={notif.id} className={`p-3 rounded-md border ${notif.isRead ? 'bg-card-foreground/5 opacity-70' : 'bg-accent/10 border-accent shadow-sm'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {notif.type === 'loan_status_updated' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                      {notif.type === 'application_submitted' && <FileText className="h-5 w-5 text-sky-500" />}
                      {notif.type === 'loan_rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                      {notif.type === 'loan_approved' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {notif.type === 'loan_disbursed_confirmation' && <IndianRupee className="h-5 w-5 text-green-600" />}
                      {notif.type === 'query_raised' && <MessageSquare className="h-5 w-5 text-yellow-500" />}
                      {notif.type === 'document_request' && <FileText className="h-5 w-5 text-indigo-500" />}
                      {notif.type.includes('reminder') && <Clock className="h-5 w-5 text-orange-500" />}
                      {notif.type.includes('alert') && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      {!['loan_status_updated', 'application_submitted', 'loan_rejected', 'loan_approved', 'loan_disbursed_confirmation', 'query_raised', 'document_request', 'reminder', 'alert'].some(t => notif.type.includes(t)) && 
                       <Info className="h-5 w-5 text-gray-500" />}
                    </div>
                    <div className="flex-grow">
                      <p className={`text-sm font-medium ${!notif.isRead ? 'text-accent-foreground' : 'text-foreground/80'}`}>{notif.message}</p>
                      {(notif.type === 'loan_rejected_details') && (notif.rejectionReasonText || notif.rejectionReasonImageUrl || notif.rejectionReasonAudioUrl) && ( 
                        <div className="mt-2 p-2 border-l-2 border-destructive/50 bg-destructive/5 rounded-md text-xs space-y-1">
                          {notif.rejectionReasonText && (<p className="text-foreground"><strong>Details:</strong> {notif.rejectionReasonText}</p>)}
                          {notif.rejectionReasonImageUrl && (<p className="flex items-center text-foreground"><ImageIcon className="h-3 w-3 mr-1 flex-shrink-0"/><a href={notif.rejectionReasonImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">View Supporting Image</a></p>)}
                          {notif.rejectionReasonAudioUrl && (<p className="flex items-center text-foreground"><Volume2 className="h-3 w-3 mr-1 flex-shrink-0"/><button onClick={() => playNotificationAudio(notif.rejectionReasonAudioUrl!)} className="text-primary hover:underline text-left">Play Audio Explanation</button></p>)}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        <FormattedDate dateString={notif.createdAt} options={{ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} />
                      </p>
                      {notif.linkTo && (<Link href={notif.linkTo} className="text-xs text-primary hover:underline mt-1 inline-block">View Details</Link>)}
                    </div>
                  </div>
                </li>
              ))}
                <audio ref={notificationAudioRef} className="hidden"></audio>
            </ul>
          ) : (<p className="text-muted-foreground text-center py-8">You have no recent notifications.</p>)}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Hourglass className="h-6 w-6 text-primary" />My Submitted Applications</CardTitle>
          <CardDescription>Applications that are currently under review or require action.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingLoans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p>Loading your submitted applications...</p>
            </div>
          ) : errorLoans ? (
              <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load applications</p>
              <p className="text-sm">{errorLoans}</p>
            </div>
          ) : pendingApplications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingApplications.map((loan) => (
                <Card key={loan.id} className="bg-card-foreground/5 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg truncate" title={loan.purpose || `Application ${loan.applicationId || loan.id}`}>
                            {loan.purpose ? (loan.purpose.substring(0,30) + (loan.purpose.length > 30 ? "..." : "")) : `Application ${loan.applicationId || loan.id}`}
                        </CardTitle>
                        <StatusBadge status={loan.status} />
                    </div>
                    {loan.applicationId && <CardDescription className="text-xs">ID: {loan.applicationId}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Requested Amount: <span className="font-semibold">₹{loan.requestedAmount.toLocaleString()}</span></p>
                    <p className="flex items-center text-xs text-muted-foreground"><Clock className="mr-1 h-3 w-3 flex-shrink-0" />
                        Submitted: <FormattedDate dateString={loan.applicationDate || loan.createdAt} options={dateDisplayOptions} />
                    </p>
                    {loan.adminRemarks && (
                        <p className="text-xs italic text-amber-700 border-l-2 border-amber-500 pl-2 py-1 bg-amber-50 rounded-sm">
                            <strong>Admin Note:</strong> {loan.adminRemarks.substring(0, 100)}{loan.adminRemarks.length > 100 ? "..." : ""}
                        </p>
                    )}
                     <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                        <Link href={ROUTES.USER_APPLICATION_DETAIL(loan.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                     </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">You have no applications pending review.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-green-600" />Active & Approved Loans</CardTitle>
          <CardDescription>Your current loans and their statuses.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingLoans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p>Loading your active loans...</p>
            </div>
          ) : errorLoans ? (
              <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load active loans</p>
              <p className="text-sm">{errorLoans}</p>
            </div>
          ) : activeOrApprovedLoans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeOrApprovedLoans.map((loan) => {
                const isFirstPaymentPeriod = 
                  (loan.status === 'Disbursed' || (loan.status === 'Active' && !loan.lastPaymentDate)) &&
                  loan.disbursementDate && 
                  typeof loan.principalDisbursed === 'number' && 
                  typeof loan.interestRate === 'number';

                let interestPayableDate: string | undefined;
                let interestPayableAmount: number | undefined;

                if (isFirstPaymentPeriod) {
                  const disbursementDateObj = new Date(loan.disbursementDate!);
                  const nextMonthDate = new Date(disbursementDateObj.setMonth(disbursementDateObj.getMonth() + 1));
                  interestPayableDate = nextMonthDate.toISOString();
                  interestPayableAmount = parseFloat((loan.principalDisbursed! * (loan.interestRate! / 100)).toFixed(2));
                }

                return (
                  <Card key={loan.id} className={`bg-card-foreground/5 hover:shadow-md transition-shadow ${loan.status === 'Approved' && loan.approvedDate && (new Date().getTime() - new Date(loan.approvedDate).getTime() < 3 * 24 * 60 * 60 * 1000) ? 'border-2 border-green-500' : ''}`}>
                    <CardHeader>
                       <div className="flex justify-between items-start">
                          <CardTitle className="text-lg truncate" title={loan.purpose || `Application ${loan.applicationId || loan.id}`}>
                               {loan.purpose ? (loan.purpose.substring(0,30) + (loan.purpose.length > 30 ? "..." : "")) : `Application ${loan.applicationId || loan.id}`}
                          </CardTitle>
                          <StatusBadge status={loan.status} />
                      </div>
                      {loan.applicationId && <CardDescription className="text-xs">ID: {loan.applicationId}</CardDescription>}
                       {loan.status === 'Approved' && loan.approvedDate && (new Date().getTime() - new Date(loan.approvedDate).getTime() < 3 * 24 * 60 * 60 * 1000) && !isFirstPaymentPeriod && (
                          <Badge variant="default" className="bg-green-600/80 text-white text-xs mt-1 self-start">Newly Approved</Badge>
                       )}
                       {isFirstPaymentPeriod && (
                         <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs mt-1 self-start">First Payment (Monthly Interest)</Badge>
                       )}
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        {loan.status === 'Approved' && !loan.principalDisbursed ? 'Requested Amount: ' : 'Approved Amount: '} 
                        <span className="font-semibold">₹{loan.approvedAmount?.toLocaleString() || loan.requestedAmount.toLocaleString()}</span>
                      </p>
                      {loan.principalDisbursed && loan.status !== 'Approved' && (
                        <p>Disbursed Amount: <span className="font-semibold">₹{loan.principalDisbursed.toLocaleString()}</span></p>
                      )}
                      
                      {(loan.status === 'Disbursed' || loan.status === 'Active' || loan.status === 'Overdue') && (
                        <>
                          {isFirstPaymentPeriod && interestPayableDate && typeof interestPayableAmount === 'number' ? (
                            <>
                              <p className="flex items-center">
                                <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                Interest Payable Date: <FormattedDate dateString={interestPayableDate} options={dateDisplayOptions} />
                              </p>
                              <p>
                                Interest Payable Amount: <span className="font-semibold">₹{interestPayableAmount.toLocaleString()}</span>
                              </p>
                            </>
                          ) : (
                            <>
                              {loan.nextPaymentDueDate && (
                                <p className="flex items-center"><CalendarClock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" /> Next Payment: <FormattedDate dateString={loan.nextPaymentDueDate} options={dateDisplayOptions} /></p>
                              )}
                              {typeof loan.nextPaymentAmount === 'number' && (
                                  <p>Next Payment Amount: <span className="font-semibold">₹{loan.nextPaymentAmount.toLocaleString()}</span></p>
                              )}
                            </>
                          )}
                        </>
                      )}
                      
                        <p className="flex items-center text-xs text-muted-foreground"><Clock className="mr-1 h-3 w-3 flex-shrink-0" />
                          {loan.status === 'Approved' && !loan.disbursementDate ? 'Approved:' : 
                           loan.status === 'Disbursed' || (loan.status === 'Active' && loan.disbursementDate && !loan.lastPaymentDate) ? 'Disbursed:' : 
                           'Updated:'} 
                          <FormattedDate dateString={
                            loan.status === 'Approved' && !loan.disbursementDate ? loan.approvedDate :
                            loan.status === 'Disbursed' || (loan.status === 'Active' && loan.disbursementDate && !loan.lastPaymentDate) ? loan.disbursementDate :
                            loan.updatedAt || loan.createdAt
                          } options={dateDisplayOptions} />
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                          <Link href={ROUTES.USER_APPLICATION_DETAIL(loan.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">You have no active or approved loans.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-6 w-6 text-primary" />Payment History</CardTitle>
          <CardDescription>Your recent payment activities.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell><FormattedDate dateString={payment.date} options={dateDisplayOptions} /></TableCell>
                  <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={payment.status === 'Paid' ? 'default' : payment.status === 'Missed' ? 'destructive' : 'secondary'} className="capitalize text-xs">
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">No payment history available yet.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
