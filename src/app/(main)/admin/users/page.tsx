
"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types"; 
import { Eye, UserCog, UsersRound, Loader2, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/constants';


export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch users');
        }
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        } else {
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: err.message || "Could not load users.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-destructive">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-xl font-semibold">Failed to load users</p>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <UsersRound className="h-8 w-8 text-primary" /> User Management
      </h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">All Users</CardTitle>
          <CardDescription>
            View and manage all registered users in the system. 
            <br />
            <span className="text-xs text-destructive font-semibold">Note: For security reasons, user passwords are not displayed. Implement a password reset functionality if needed.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact No.</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.contactNo || 'N/A'}</TableCell>
                    <TableCell>{user.address || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={ROUTES.ADMIN_USER_DETAIL(user.id)}> 
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
