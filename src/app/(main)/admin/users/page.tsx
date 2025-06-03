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
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            {users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact No.</TableHead>
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
                      <TableCell>
                        {user.contactNo ? user.contactNo : ""}
                      </TableCell>
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
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {users.length > 0 ? (
              users.map((user) => (
                <Card key={user.id} className="shadow border">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-base font-semibold truncate" title={user.name}>
                        <UsersRound className="inline-block mr-2 h-4 w-4 text-muted-foreground" />
                        {user.name}
                      </CardTitle>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-2 space-y-1.5 text-sm">
                    {user.contactNo && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium">{user.contactNo}</span>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="font-medium truncate">{user.address}</span>
                      </div>
                    )}
                    <Button asChild variant="outline" size="sm" className="w-full mt-3">
                      <Link href={ROUTES.ADMIN_USER_DETAIL(user.id)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No users found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
