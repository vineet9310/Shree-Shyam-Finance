// src/app/(main)/admin/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react'; 
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LoanApplication, LoanApplicationStatus, SystemNotification, NotificationTypeEnum as NotificationTypeEnumType } from "@/lib/types"; 
import { Eye, ShieldCheck, Clock, AlertTriangle, CheckCircle2, FileText, UserCircle, IndianRupee, Loader2, BellRing, CalendarDays, Landmark, Mail, MessageSquare, Info, Volume2, Image as ImageIcon, XCircle, Inbox } from "lucide-react"; 
import { ROUTES } from '@/lib/constants';
import FormattedDate from "@/components/custom/FormattedDate";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton"; 
import { useAuth } from '@/context/AuthContext'; 

const StatusBadge = ({ status }: { status: LoanApplicationStatus }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" = "outline"; 
  let icon = <Clock className="mr-1 h-3 w-3" />;
  let badgeClass = "capitalize text-xs flex items-center whitespace-nowrap px-2 py-0.5"; 

  switch (status) {
    case "Approved":
      variant = "success"; 
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "Active":
      variant = "info"; 
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "PaidOff":
      variant = "success";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "QueryInitiated":
      variant = "warning"; 
      icon = <BellRing className="mr-1 h-3 w-3" />;
      badgeClass += " animate-pulse"; 
      break;
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
  // Ensure status is a string before calling replace
  const displayStatus = typeof status === 'string' ? status.replace(/([A-Z])/g, ' $1').trim() : 'Unknown';
  return <Badge variant={variant} className={badgeClass}>{icon}{displayStatus}</Badge>;
};


export default function AdminDashboardPage() {
  const { user: adminUser } = useAuth(); 
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [errorApplications, setErrorApplications] = useState<string | null>(null);
  
  const [adminNotifications, setAdminNotifications] = useState<SystemNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null);
  
  const { toast } = useToast();
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null); 

  useEffect(() => {
    if (typeof window !== "undefined") {
        notificationAudioRef.current = new Audio();
    }

    const fetchApplications = async () => {
      setIsLoadingApplications(true);
      setErrorApplications(null);
      try {
        const response = await fetch('/api/loan-applications');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from API' }));
          throw new Error(errorData.message || 'Failed to fetch loan applications');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.applications)) {
          const validApplications = data.applications.filter((app: LoanApplication) => app && typeof app.id === 'string' && app.id.trim() !== '');
          setApplications(validApplications);
        } else {
          const errMsg = data.message || (Array.isArray(data.applications) ? 'Failed to fetch loan applications' : 'Invalid application data format from API');
          throw new Error(errMsg);
        }
      } catch (err: any) {
        setErrorApplications(err.message);
        toast({
          title: "Error Loading Applications",
          description: err.message || "Could not load applications.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingApplications(false);
      }
    };

    const fetchAdminNotifications = async () => {
      if (!adminUser || !adminUser.id) {
        setIsLoadingNotifications(false);
        setAdminNotifications([]);
        return;
      }
      setIsLoadingNotifications(true);
      setErrorNotifications(null);
      try {
        const response = await fetch(`/api/notifications?userId=${adminUser.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from API for notifications' }));
          throw new Error(errorData.message || 'Failed to fetch admin notifications');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.notifications)) {
          const sortedNotifications = [...data.notifications].sort((a: SystemNotification, b: SystemNotification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          // Filter out payment verification notifications as they are on a dedicated page
          const generalNotifications = sortedNotifications.filter(
            (n: SystemNotification) => n.type !== "USER_PAYMENT_SUBMITTED_FOR_VERIFICATION"
          );
          setAdminNotifications(generalNotifications.slice(0, 20)); 
        } else {
          setAdminNotifications([]);
        }
      } catch (err: any) {
        setErrorNotifications(err.message);
        toast({
          title: "Error Loading Notifications",
          description: err.message || "Could not load admin notifications.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchApplications();
    if (adminUser) { 
        fetchAdminNotifications();
    } else {
        setIsLoadingNotifications(false); 
    }

  }, [toast, adminUser]); 

  const newApplicationCount = applications.filter(app => app && app.status === 'QueryInitiated').length;
  // Count of general unread notifications
  const generalNotificationCount = adminNotifications.filter(n => n.type !== "USER_PAYMENT_SUBMITTED_FOR_VERIFICATION" && !n.isRead).length;


  const playNotificationAudio = (audioUrl: string) => { 
    if (notificationAudioRef.current) {
      notificationAudioRef.current.src = audioUrl;
      notificationAudioRef.current.play().catch(e => console.error("Error playing notification audio:", e));
      toast({ title: "Playing Notification", description: "Audio message is now playing." });
    }
  };

  const getNotificationIcon = (type: NotificationTypeEnumType | string) => {
    switch (type) {
      // No need for USER_PAYMENT_SUBMITTED_FOR_VERIFICATION here as it's filtered out
      case "loan_application_submitted":
        return <FileText className="h-5 w-5 text-sky-500" />;
      // Add other admin-specific notification types here
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderMobileSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
        <Card key={`skeleton-mobile-${index}`} className="mb-4 shadow-md">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
            <div className="flex items-center justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
            <div className="flex items-center justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
            <Skeleton className="h-9 w-full mt-3" />
          </CardContent>
        </Card>
    ));
  };

  if (isLoadingApplications && applications.length === 0 && isLoadingNotifications && adminNotifications.length ===0) { 
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 mt-2">Loading dashboard data...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8 p-4 md:p-6 w-full min-w-0"> 
      <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 md:h-8 md:w-8 text-primary" /> Admin Dashboard
      </h1>

      {/* Admin General Notifications Card - Verification queue removed */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing className="h-6 w-6 text-primary" />Admin General Alerts</CardTitle>
          <CardDescription>
            Recent system alerts and other important notifications.
            {generalNotificationCount > 0 && (
                 <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
                    {generalNotificationCount} New Alerts
                </span>
            )}
            </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p>Loading general alerts...</p>
            </div>
          ) : errorNotifications ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load alerts</p>
              <p className="text-sm">{errorNotifications}</p>
            </div>
          ) : adminNotifications.length > 0 ? ( // Check if any general notifications exist
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {adminNotifications.map((notif) => ( 
                <li key={notif.id} className={`p-3 rounded-md border ${notif.isRead ? 'bg-card-foreground/5 opacity-70' : 'bg-accent/10 border-accent shadow-sm'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-grow">
                      <p className={`text-sm font-medium ${!notif.isRead ? 'text-accent-foreground' : 'text-foreground/80'}`}>{notif.message}</p>
                       {(notif.type === 'loan_rejected_details' || notif.type === 'query_raised') && (notif.rejectionReasonText || notif.rejectionReasonImageUrl || notif.rejectionReasonAudioUrl) && (
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
          ) : (<p className="text-muted-foreground text-center py-8">No new general alerts.</p>)}
        </CardContent>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Loan Applications Overview</CardTitle>
          <CardDescription>
            Review and manage all submitted loan applications.
            {newApplicationCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
                <BellRing className="mr-1 h-3 w-3" /> {newApplicationCount} New Query
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            {isLoadingApplications && applications.length === 0 ? ( 
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2">Loading table data...</p>
                 </div>
            ) : applications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]"><UserCircle className="inline-block mr-1.5 h-4 w-4" />Applicant Name</TableHead>
                    <TableHead><IndianRupee className="inline-block mr-1.5 h-4 w-4" />Amount</TableHead>
                    <TableHead><CalendarDays className="inline-block mr-1.5 h-4 w-4" />Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    if (!app || typeof app.id !== 'string' || app.id.trim() === '') {
                      return null; 
                    }
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {app.borrowerFullName || ((app.borrowerUserId as any)?.name) || 'N/A'}
                        </TableCell>
                        <TableCell>₹{app.requestedAmount?.toLocaleString() || '0'}</TableCell>
                        <TableCell><FormattedDate dateString={app.applicationDate} /></TableCell>
                        <TableCell><StatusBadge status={app.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={ROUTES.ADMIN_APPLICATION_DETAIL(app.id)}>
                              <Eye className="mr-1.5 h-4 w-4" /> View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">No loan applications submitted yet.</p>
            )}
          </div>

          <div className="block md:hidden space-y-4">
            {isLoadingApplications && applications.length === 0 ? (
                renderMobileSkeletons(3)
            ): applications.length > 0 ? (
              applications.map((app) => {
                if (!app || typeof app.id !== 'string' || app.id.trim() === '') {
                  return null;
                }
                const applicantName = app.borrowerFullName || ((app.borrowerUserId as any)?.name) || "Unknown Applicant";
                const loanAmount = app.requestedAmount;
                return (
                <Card key={app.id} className="shadow-md border">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                        <CardTitle className="text-base font-semibold truncate" title={applicantName}>
                            <UserCircle className="inline-block mr-2 h-4 w-4 text-muted-foreground" />
                            {applicantName}
                        </CardTitle>
                        <StatusBadge status={app.status} />
                    </div>
                    {app.borrowerEmail && (
                        <p className="text-xs text-muted-foreground flex items-center truncate">
                            <Mail className="inline-block mr-1.5 h-3 w-3" />
                            {app.borrowerEmail}
                        </p>
                    )}
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-2 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><IndianRupee className="mr-1.5 h-4 w-4"/>Amount:</span>
                        <span className="font-medium">
                            {typeof loanAmount === 'number' ? `₹${loanAmount.toLocaleString('en-IN')}` : 'N/A'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-1.5 h-4 w-4"/>Submitted:</span>
                        <FormattedDate dateString={app.applicationDate} />
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full mt-3">
                      <Link href={ROUTES.ADMIN_APPLICATION_DETAIL(app.id)}>
                        <Eye className="mr-2 h-4 w-4" /> View Application
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )})
            ) : (
              <p className="text-muted-foreground text-center py-8">No loan applications submitted yet.</p>
            )}
          </div>
           {errorApplications && applications.length > 0 && (
             <p className="text-center text-sm text-destructive mt-4">{errorApplications}</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
