
"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types"; // Assuming User type includes role
import { Eye, UserCog, UsersRound } from "lucide-react";
import Link from 'next/link';
// import { useAuth } from '@/context/AuthContext'; // For fetching real users later

// Mock user data for now, in a real app this would come from your backend/AuthContext
const mockUsers: User[] = [
  { id: '1', email: 'user1@example.com', name: 'Borrower One', role: 'user' },
  { id: '2', email: 'admin@example.com', name: 'Administrator', role: 'admin' },
  { id: '3', email: 'user2@example.com', name: 'Borrower Two', role: 'user' },
  { id: '4', email: 'anotheruser@example.com', name: 'Borrower Three', role: 'user', borrowerProfileId: 'bp123' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  // const { allUsers } = useAuth(); // If AuthContext provided a way to get all users

  useEffect(() => {
    // In a real app, fetch users from your backend
    setUsers(mockUsers);
    // if (allUsers) setUsers(allUsers);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <UsersRound className="h-8 w-8 text-primary" /> User Management
      </h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">All Users</CardTitle>
          <CardDescription>View and manage all registered users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Borrower Profile ID</TableHead>
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
                     <TableCell>{user.borrowerProfileId || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        {/* This link would go to a user detail/edit page in the future */}
                        <Link href={`/admin/users/${user.id}`}> 
                          <Eye className="mr-2 h-4 w-4" /> View/Edit
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
