
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
  UsersRound, // Added for Manage Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AppLogo } from '@/components/custom/AppLogo';
import { UserNav } from '@/components/custom/UserNav';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const navItemsBase = [
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.APPLY_LOAN, label: 'Apply for New Loan', icon: FilePlus2 }, // Updated label
];

const navItemsAdmin = [
  { href: ROUTES.ADMIN_DASHBOARD, label: 'Admin Overview', icon: Shield },
  { href: ROUTES.ADMIN_USERS, label: 'Manage Users', icon: UsersRound }, // New admin item
];

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, icon: Icon, isActive, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground"
    )}
  >
    <Icon className="h-5 w-5" />
    {label}
  </Link>
);


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const currentNavItems = user.role === 'admin' 
    ? [...navItemsBase.filter(item => item.href !== ROUTES.APPLY_LOAN), ...navItemsAdmin] // Admins might not apply for loans themselves
    : navItemsBase;
  
  const SidebarContentComp = () => (
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6 shrink-0">
        <AppLogo />
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname.startsWith(item.href)} // Use startsWith for nested routes
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground" onClick={() => { logout(); setOpen(false); }}>
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );


  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContentComp />
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6 shrink-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px] bg-sidebar border-sidebar-border">
              <SidebarContentComp />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            {/* Breadcrumbs or page title can go here */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
