
"use client"; 

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AppLogo } from '@/components/dashboard/app-logo';
import { NavLinks } from '@/components/dashboard/nav-links';
import { UserNav } from '@/components/dashboard/user-nav';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), 'eeee، d MMMM yyyy - HH:mm:ss', { locale: arSA }));
    };

    updateDateTime(); 
    const intervalId = setInterval(updateDateTime, 1000); 

    return () => clearInterval(intervalId); 
  }, []);


  if (typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') !== 'true') {
    // Let useEffect handle redirection to avoid hydration issues.
  }


  return (
    <SidebarProvider defaultOpen={true} > 
      <Sidebar collapsible="icon" side="right" variant="sidebar"> 
        <SidebarRail />
        <SidebarHeader className="p-4 flex items-center justify-between">
          <AppLogo />
        </SidebarHeader>
        <Separator className="my-0 bg-sidebar-border/50" />
        <SidebarContent className="p-2">
          <NavLinks />
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
        </SidebarFooter>
      </Sidebar>

      <SidebarInset> 
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 shadow-sm">
          <SidebarTrigger className="md:hidden" /> 
          <div className="flex-1">
            {currentDateTime ? (
              <span className="text-sm text-muted-foreground">{currentDateTime}</span>
            ) : (
              <span className="text-sm text-muted-foreground">جارٍ تحميل الوقت...</span>
            )}
          </div>
          <UserNav />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
