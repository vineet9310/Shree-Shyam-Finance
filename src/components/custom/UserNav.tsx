
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon, Settings, ShieldCheck, Bell } from "lucide-react"; // Added Bell
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export function UserNav() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null): string => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      if (user?.email) {
        return user.email[0].toUpperCase();
      }
      return 'U'; 
    }
    const parts = name
      .trim()
      .split(" ")
      .filter(part => part.length > 0); 
    
    if (parts.length === 0) {
      if (user?.email) {
        return user.email[0].toUpperCase();
      }
      return 'U';
    }

    return parts
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  const displayName = user.name || "User";
  const userInitials = getInitials(user.name);

  return (
    <div className="flex items-center gap-2">
      {/* Notification Bell - Placeholder for now */}
      {user.role !== 'admin' && (
        <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10">
          {/* We can later make this a link to a notifications page or a trigger for a dropdown */}
          {/* <Link href={ROUTES.NOTIFICATIONS_PAGE || '#'}> */}
            <Bell className="h-5 w-5" />
            {/* Placeholder for notification count badge */}
            {/* <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">3</span> */}
            <span className="sr-only">View Notifications</span>
          {/* </Link> */}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://placehold.co/100x100.png?text=${userInitials}`} alt={displayName} data-ai-hint="user avatar" />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={ROUTES.DASHBOARD}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            {user.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link href={ROUTES.ADMIN_DASHBOARD}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
