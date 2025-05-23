
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import type { User } from '@/lib/types';
import { ArrowLeft, Edit, Trash2, UserCircle, Mail, Shield, Phone, HomeIcon, Loader2, AlertTriangleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/constants';
import FormattedDate from '@/components/custom/FormattedDate';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch user (status: ${response.status})`);
          }
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
          } else {
            throw new Error(data.message || 'Could not fetch user details');
          }
        } catch (err: any) {
          console.error("Error fetching user:", err);
          setError(err.message);
          toast({
            title: "Error",
            description: err.message || "Could not load user details.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    }
  }, [userId, toast]);

  const handleDeleteUser = async () => {
    // Placeholder for delete functionality
    toast({
      title: "Delete User (Not Implemented)",
      description: `User deletion for ${user?.name} is not yet implemented.`,
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-destructive">
         <Button variant="outline" onClick={() => router.push(ROUTES.ADMIN_USERS)} className="mb-8 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
        </Button>
        <AlertTriangleIcon className="h-12 w-12 mb-4" />
        <p className="text-xl font-semibold">Failed to load user details</p>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Retry</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push(ROUTES.ADMIN_USERS)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
        </Button>
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>User Not Found</AlertTitle>
          <AlertDescription>The requested user could not be found or an error occurred.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(ROUTES.ADMIN_USERS)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            {user.name}'s Profile
          </CardTitle>
          <CardDescription>User ID: {user.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">Role</p>
                <p className="text-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">Contact Number</p>
                <p className="text-foreground">{user.contactNo || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">Address</p>
                <p className="text-foreground">{user.address || 'N/A'}</p>
              </div>
            </div>
             <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">ID Proof Type</p>
                <p className="text-foreground">{user.idProofType || 'N/A'}</p>
              </div>
            </div>
             <div className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">Address Proof Type</p>
                <p className="text-foreground">{user.addressProofType || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Registered on: <FormattedDate dateString={user.createdAt} options={{ year: 'numeric', month: 'long', day: 'numeric' }} />
            </p>
          </div>
           <Alert className="mt-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Password Security</AlertTitle>
            <AlertDescription>
              For security reasons, user passwords are not displayed. If a user forgets their password, please advise them to use a "Forgot Password" feature (if implemented) or assist them in resetting it through a secure channel.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-6">
          <Button variant="outline" disabled>
            <Edit className="mr-2 h-4 w-4" /> Edit User (Soon)
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled>
                <Trash2 className="mr-2 h-4 w-4" /> Delete User (Soon)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the user {user.name}? This action cannot be undone. Actual deletion functionality is not yet implemented.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
