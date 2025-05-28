// src/app/(main)/dashboard/page.tsx

"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LoanApplication, LoanApplicationStatus, PaymentHistoryEntry, SystemNotification } from "@/lib/types"; // Added SystemNotification
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { TrendingUp, History, CalendarClock, AlertTriangle, CheckCircle2, Clock, IndianRupee, FileText, Loader2, Eye, Users, ListChecks, ShieldCheck, BellRing, MessageSquare, Info, Volume2, Image as ImageIcon, XCircle } from "lucide-react"; // Added XCircle
import FormattedDate from "@/components/custom/FormattedDate";
import { useEffect, useState, useRef } from "react"; // Added useRef for audio playback
import { useToast } from "@/hooks/use-toast";


const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = <Clock className="mr-1 h-3 w-3" />;

  switch (status) {
    case "Approved":
    case "Active":
    case "PaidOff":
      variant = "default";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "QueryInitiated":
    case "PendingAdminVerification":
      variant = "secondary";
      icon = <Clock className="mr-1 h-3 w-3" />;
      break;
    case "Rejected":
    case "Overdue":
    case "Defaulted":
      variant = "destructive";
      icon = <AlertTriangle className="mr-1 h-3 w-3" />;
      break;
    case "AdditionalInfoRequired":
      variant = "outline";
      icon = <FileText className="mr-1 h-3 w-3" />;
      break;
    default:
      icon = <FileText className="mr-1 h-3 w-3" />;
  }
  return <Badge variant={variant} className="capitalize text-xs flex items-center whitespace-nowrap">{icon}{status}</Badge>;
};


export default function DashboardPage() {
  const { user } = useAuth();
  const [userLoanApplications, setUserLoanApplications] = useState<LoanApplication[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]); // State for notifications
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true); // Loading state for notifications
  const [errorLoans, setErrorLoans] = useState<string | null>(null);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null); // Error state for notifications
  const { toast } = useToast();
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null); // For playing notification audio


  const playNotificationAudio = (audioUrl: string) => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.src = audioUrl;
      notificationAudioRef.current.play().catch(e => console.error("Error playing notification audio:", e));
      toast({ title: "Playing Notification", description: "Audio message is now playing." });
    }
  };


  useEffect(() => {
    const fetchUserLoans = async () => {
      if (!user?.id) {
        setIsLoadingLoans(false);
        setUserLoanApplications([]);
        return;
      }
      setIsLoadingLoans(true);
      setErrorLoans(null);
      try {
        console.log(`[DashboardPage] Fetching loans for userId: ${user.id}`);
        const response = await fetch(`/api/loan-applications?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch loan applications for user');
        }
        const data = await response.json();
        if (data.success && data.applications) {
          setUserLoanApplications(data.applications);
        } else {
          throw new Error(data.message || 'Could not parse user loan applications');
        }
      } catch (err: any) {
        console.error("[DashboardPage] Error fetching user loans:", err);
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
        return;
      }
      setIsLoadingNotifications(true);
      setErrorNotifications(null);
      try {
        console.log(`[DashboardPage] Fetching notifications for userId: ${user.id}`);
        const response = await fetch(`/api/notifications?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch notifications for user');
        }
        const data = await response.json();
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        } else {
          throw new Error(data.message || 'Could not parse user notifications');
        }
      } catch (err: any) {
        console.error("[DashboardPage] Error fetching user notifications:", err);
        setErrorNotifications(err.message);
        toast({
          title: "Error loading notifications",
          description: err.message || "Could not load your notifications.",
          variant: "destructive",
        });
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };


    if (user && user.role !== 'admin' && user.id) {
      fetchUserLoans();
      fetchUserNotifications(); // Fetch notifications
    } else {
      setUserLoanApplications([]);
      setNotifications([]); // Clear notifications for admin or if no user
      setIsLoadingLoans(false);
      setIsLoadingNotifications(false);
    }

    setPaymentHistory([]);

  }, [user, toast]);

  const applicationQueries = userLoanApplications.filter(
    app => app.status === 'QueryInitiated' || app.status === 'PendingAdminVerification' || app.status === 'AdditionalInfoRequired'
  );
  const activeLoans = userLoanApplications.filter(
    app => app.status === 'Active' || app.status === 'Overdue' || app.status === 'Approved' // Include Approved here
  );

  if (user?.role === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}! (Admin)</h1>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}!</h1>
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

      {/* Notifications Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing className="h-6 w-6 text-primary" />My Notifications</CardTitle>
          <CardDescription>Recent updates and alerts regarding your account and applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingNotifications ? (
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
            <ul className="space-y-3">
              {notifications.map((notif) => (
                <li key={notif.id} className={`p-3 rounded-md border ${notif.isRead ? 'bg-card-foreground/5' : 'bg-accent/10 border-accent'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notif.type === 'loan_status_updated' && <MessageSquare className="h-5 w-5 text-primary" />}
                      {notif.type === 'loan_rejected_details' && <XCircle className="h-5 w-5 text-destructive" />} {/* Icon for rejected */}
                      {notif.type.includes('reminder') && <Clock className="h-5 w-5 text-yellow-500" />}
                      {notif.type.includes('alert') && <AlertTriangle className="h-5 w-5 text-destructive" />}
                      {!['loan_status_updated', 'reminder', 'alert', 'loan_rejected_details'].some(t => notif.type.includes(t)) && <Info className="h-5 w-5 text-muted-foreground" />}
                      {/* New: Icon for loan_disbursed_confirmation */}
                      {notif.type === 'loan_disbursed_confirmation' && <IndianRupee className="h-5 w-5 text-green-500" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${!notif.isRead ? 'text-accent-foreground' : 'text-foreground'}`}>{notif.message}</p>
                      {notif.type === 'loan_rejected_details' && (
                          <div className="mt-2 text-xs">
                              {notif.rejectionReasonText && (
                                  <p className="text-foreground">Reason: {notif.rejectionReasonText}</p>
                              )}
                              {notif.rejectionReasonImageUrl && (
                                  <p className="flex items-center text-foreground mt-1">
                                      <ImageIcon className="h-3 w-3 mr-1"/>
                                      <a href={notif.rejectionReasonImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                          View Image
                                      </a>
                                  </p>
                              )}
                              {notif.rejectionReasonAudioUrl && (
                                  <p className="flex items-center text-foreground mt-1">
                                      <Volume2 className="h-3 w-3 mr-1"/>
                                      <button onClick={() => playNotificationAudio(notif.rejectionReasonAudioUrl!)} className="text-primary hover:underline">
                                          Play Audio
                                      </button>
                                  </p>
                              )}
                              <audio ref={notificationAudioRef} className="hidden"></audio> {/* Hidden audio player */}
                          </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        <FormattedDate dateString={notif.createdAt} options={{ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} />
                      </p>
                      {notif.linkTo && (
                        <Link href={notif.linkTo} className="text-xs text-primary hover:underline">
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IndianRupee className="h-6 w-6 text-primary" />Active & Approved Loans</CardTitle>
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
          ) : activeLoans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeLoans.map((loan) => (
                <Card key={loan.id} className={`bg-card-foreground/5 ${loan.status === 'Approved' && loan.approvedDate && (new Date().getTime() - new Date(loan.approvedDate).getTime() < 3 * 24 * 60 * 60 * 1000) ? 'border-2 border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-lg truncate" title={loan.purpose}>{loan.purpose.substring(0,30)}{loan.purpose.length > 30 ? "..." : ""}</CardTitle>
                     <div className="flex items-center gap-2">
                        <StatusBadge status={loan.status} />
                        {loan.status === 'Approved' && loan.approvedDate && (new Date().getTime() - new Date(loan.approvedDate).getTime() < 3 * 24 * 60 * 60 * 1000) && (
                            <Badge variant="default" className="bg-primary/80 text-primary-foreground text-xs">New</Badge>
                        )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Approved Amount: <span className="font-semibold">₹{loan.approvedAmount?.toLocaleString() || loan.requestedAmount.toLocaleString()}</span></p>
                    {loan.nextPaymentDueDate && (
                      <p className="flex items-center"><CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" /> Next Payment: <FormattedDate dateString={loan.nextPaymentDueDate} /></p>
                    )}
                    {loan.nextPaymentAmount && (
                       <p>Next Payment Amount: <span className="font-semibold">₹{loan.nextPaymentAmount.toLocaleString()}</span></p>
                    )}
                     <p className="flex items-center text-xs text-muted-foreground"><Clock className="mr-1 h-3 w-3" />
                        {loan.status === 'Approved' ? 'Approved:' : 'Disbursed:'} <FormattedDate dateString={loan.approvedDate || loan.disbursementDate} />
                     </p>
                      <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                        <Link href={ROUTES.USER_APPLICATION_DETAIL(loan.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                     </Button>
                  </CardContent>
                </Card>
              ))}
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
                  <TableCell><FormattedDate dateString={payment.date} /></TableCell>
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
