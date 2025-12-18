"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  Settings,
  LogOut,
  Menu,
  Shield,
  Home,
  UsersRound,
  ChevronRight,
  Inbox, // Added Inbox for Payment Verifications
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AppLogo } from '@/components/custom/AppLogo';
import { UserNav } from '@/components/custom/UserNav';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Base navigation items for regular users
const navItemsBase = [
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.APPLY_LOAN, label: 'Apply for New Loan', icon: FilePlus2 },
];

// Additional navigation items for admin users
const navItemsAdmin = [
  { href: ROUTES.ADMIN_DASHBOARD, label: 'Admin Overview', icon: Shield },
  { href: '/admin/analytics', label: 'Analytics', icon: LayoutDashboard },
  { href: ROUTES.ADMIN_USERS, label: 'Manage Users', icon: UsersRound },
  { href: ROUTES.ADMIN_PAYMENT_VERIFICATIONS, label: 'Payment Verifications', icon: Inbox }, // New Admin Link
];

// Interface for NavLink properties
interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}

// NavLink component for sidebar navigation items
const NavLink: React.FC<NavLinkProps> = ({ href, label, icon: Icon, isActive, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150 ease-in-out group",
      isActive
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-semibold"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
    )}
  >
    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground")} />
    <span className="truncate">{label}</span>
    {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
  </Link>
);


// Main application layout component
export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false); // State for mobile menu

  // Effect to handle authentication and redirection
  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.LOGIN); // Redirect to login if not authenticated
    }
  }, [user, loading, router]);

  // Loading state display
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground animate-pulse">Loading {APP_NAME || "Application"}...</p>
      </div>
    );
  }

  // Determine navigation items based on user role
  const currentNavItems = user.role === 'admin'
    ? [...navItemsBase.filter(item => item.href !== ROUTES.APPLY_LOAN), ...navItemsAdmin]
    : navItemsBase;

  // Reusable Sidebar Content Component
  const SidebarContentComp = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <SheetHeader className="flex h-16 items-center border-b border-sidebar-border px-4 sm:px-6 shrink-0">
        <AppLogo iconClassName="h-7 w-7" textClassName="text-lg sm:text-xl" />
        {isMobile && <SheetTitle className="sr-only">Main Menu</SheetTitle>}
      </SheetHeader>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-3 sm:px-4 text-sm font-medium gap-1">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              // Use exact match for all routes to prevent multiple active states
              isActive={pathname === item.href}
              onClick={() => { if (isMobile) setOpen(false); }}
            />
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-3 sm:p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground gap-2.5 px-3 py-2.5"
          onClick={() => { logout(); if (isMobile) setOpen(false); }}
        >
          <LogOut className="mr-1 h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr] h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex flex-col h-full shadow-xl gradient-sidebar">
        <SidebarContentComp />
      </aside>

      {/* Right Panel (Header + Main Content) */}
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header: Fixed height, does not scroll */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6 shrink-0 shadow-sm">
          {/* Mobile Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden rounded-full hover:bg-accent"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px] bg-sidebar border-r border-sidebar-border shadow-xl">
              <SidebarContentComp isMobile={true} />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
          </div>
          <UserNav />
        </header>

        <ScrollArea className="flex-1 bg-background">
          <main className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
