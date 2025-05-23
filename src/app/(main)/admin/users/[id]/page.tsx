
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Edit, Trash2, UserCircle, Mail, Shield, Phone, HomeIcon, Loader2, AlertTriangleIcon, KeyRound, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/constants';
import FormattedDate from '@/components/custom/FormattedDate';

type EditableUserFields = Pick<User, 'name' | 'email' | 'role' | 'contactNo' | 'address' | 'idProofType' | 'addressProofType'>;

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<EditableUserFields>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


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
            setEditData({
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              contactNo: data.user.contactNo,
              address: data.user.address,
              idProofType: data.user.idProofType,
              addressProofType: data.user.addressProofType,
            });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: 'user' | 'admin') => {
    setEditData(prev => ({ ...prev, role: value }));
  };

  const handleSaveChanges = async () => {
    if (!user || !user.id) { // Check if user and user.id exist
        toast({ title: "Error", description: "Invalid user data for update.", variant: "destructive" });
        return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const result = await response.json();
      if (result.success) {
        setUser(result.user);
        setEditData(result.user); // Update editData with the fresh user data from backend
        setIsEditing(false);
        toast({ title: "Success", description: "User details updated successfully." });
      } else {
        setError(result.message || "Failed to update user.");
        toast({ title: "Update Failed", description: result.message || "Could not update user details.", variant: "destructive" });
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !user.id) { // Check if user and user.id exist
        toast({ title: "Error", description: "Invalid user data for deletion.", variant: "destructive" });
        return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "User deleted successfully." });
        router.push(ROUTES.ADMIN_USERS);
      } else {
        setError(result.message || "Failed to delete user.");
        toast({ title: "Deletion Failed", description: result.message || "Could not delete user.", variant: "destructive" });
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message || "An unexpected error occurred during deletion.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user details...</p>
      </div>
    );
  }

  if (error && !user) { // Show full page error if user data couldn't be loaded at all
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
  
  // Use editData for display when editing, otherwise use user
  const currentDisplayUser = isEditing ? editData : user;


  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(ROUTES.ADMIN_USERS)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
      </Button>

      {error && !isEditing && ( // Show non-critical errors (e.g., update failed) as an alert
        <Alert variant="destructive" className="mb-4">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            {isEditing ? "Edit User Profile" : `${user.name}'s Profile`}
          </CardTitle>
          <CardDescription>User ID: {user.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            
            <div>
              <Label htmlFor="name" className="font-medium text-muted-foreground flex items-center gap-2"><UserCircle className="h-5 w-5" />Full Name</Label>
              {isEditing ? (
                <Input id="name" name="name" value={editData.name || ''} onChange={handleInputChange} disabled={isUpdating} />
              ) : (
                <p className="text-foreground">{currentDisplayUser.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="font-medium text-muted-foreground flex items-center gap-2"><Mail className="h-5 w-5" />Email</Label>
              {isEditing ? (
                <Input id="email" name="email" type="email" value={editData.email || ''} onChange={handleInputChange} disabled={isUpdating} />
              ) : (
                <p className="text-foreground">{currentDisplayUser.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="role" className="font-medium text-muted-foreground flex items-center gap-2"><Shield className="h-5 w-5" />Role</Label>
              {isEditing ? (
                <Select value={editData.role || 'user'} onValueChange={handleRoleChange} disabled={isUpdating}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground capitalize">{currentDisplayUser.role}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactNo" className="font-medium text-muted-foreground flex items-center gap-2"><Phone className="h-5 w-5" />Contact Number</Label>
              {isEditing ? (
                <Input id="contactNo" name="contactNo" value={editData.contactNo || ''} onChange={handleInputChange} disabled={isUpdating} />
              ) : (
                <p className="text-foreground">{currentDisplayUser.contactNo || 'N/A'}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="address" className="font-medium text-muted-foreground flex items-center gap-2"><HomeIcon className="h-5 w-5" />Address</Label>
              {isEditing ? (
                <Input id="address" name="address" value={editData.address || ''} onChange={handleInputChange} disabled={isUpdating} />
              ) : (
                <p className="text-foreground">{currentDisplayUser.address || 'N/A'}</p>
              )}
            </div>

             <div>
              <Label htmlFor="idProofType" className="font-medium text-muted-foreground flex items-center gap-2"><UserCircle className="h-5 w-5" />ID Proof Type</Label>
               {isEditing ? (
                <Input id="idProofType" name="idProofType" value={editData.idProofType || ''} onChange={handleInputChange} placeholder="e.g., Aadhaar, PAN" disabled={isUpdating}/>
              ) : (
                <p className="text-foreground">{currentDisplayUser.idProofType || 'N/A'}</p>
              )}
            </div>
             <div>
              <Label htmlFor="addressProofType" className="font-medium text-muted-foreground flex items-center gap-2"><HomeIcon className="h-5 w-5" />Address Proof Type</Label>
               {isEditing ? (
                <Input id="addressProofType" name="addressProofType" value={editData.addressProofType || ''} onChange={handleInputChange} placeholder="e.g., Aadhaar, Utility Bill" disabled={isUpdating}/>
              ) : (
                <p className="text-foreground">{currentDisplayUser.addressProofType || 'N/A'}</p>
              )}
            </div>

            {user.passwordHash && !isEditing && ( // Only show hash when not editing
              <div className="flex items-center gap-2 md:col-span-2">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-muted-foreground">Password Hash (Sensitive)</p>
                  <p className="text-foreground break-all text-xs">{user.passwordHash}</p>
                </div>
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Registered on: <FormattedDate dateString={user.createdAt} options={{ year: 'numeric', month: 'long', day: 'numeric' }} />
              </p>
            </div>
          )}
           {!isEditing && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription>
                Displaying password hashes is a security risk. This is shown based on your request. In a production system, passwords or their hashes should never be displayed. Implement a secure password reset mechanism instead. 
                **Real passwords are NOT stored or retrievable.**
              </AlertDescription>
            </Alert>
           )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-6">
          {isEditing ? (
            <>
              <Button onClick={handleSaveChanges} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => { setIsEditing(false); setEditData(user); setError(null); }} disabled={isUpdating}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit User
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isEditing || isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the user {user.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
