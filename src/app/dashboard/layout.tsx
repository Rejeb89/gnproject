
"use client"; // Required for useEffect and useRouter

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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);

  useEffect(() => {
    // محاكاة التحقق من المصادقة (غير آمنة للاستخدام الفعلي)
    // لاحقًا، سيتم استبدال هذا بمنطق تحقق المصادقة الفعلي (مثل Firebase Auth)
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      router.replace('/login');
      // Return null or a loading indicator here if you want to prevent rendering the rest of the layout during redirect
      // For now, we let it render and redirect, which might cause a flash.
    }
  }, [router]);

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), 'eeee، d MMMM yyyy - HH:mm:ss', { locale: arSA }));
    };

    updateDateTime(); // Set initial time
    const intervalId = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);


  // To prevent hydration errors, ensure the initial render on the client matches the server.
  // The server will always render the layout below.
  // The useEffect will then handle redirection on the client if necessary.
  // If localStorage indicates not authenticated, useEffect will redirect.
  // We check if window is defined before accessing localStorage to avoid errors during SSR if somehow isAuthenticated was checked outside useEffect.
  // However, the main check and redirect logic is within useEffect.
  if (typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') !== 'true') {
    // This part is tricky for hydration. If we return something different from what server renders, it's an error.
    // For now, we let the useEffect handle the redirect.
    // If redirect is fast, user sees login. If slow, they might see a flash of the layout.
    // To show a loading screen *without* hydration error here is more complex and might involve
    // a state that's only set client-side after the first render.
    // For now, we remove the direct return that caused the hydration error.
    // The page will render briefly, then redirect.
  }


  return (
    <SidebarProvider defaultOpen={true} > {/* Sidebar open by default */}
      <Sidebar collapsible="icon" side="right" variant="sidebar"> {/* Sidebar on the right for RTL */}
        <SidebarRail />
        <SidebarHeader className="p-4 flex items-center justify-between">
          <AppLogo />
          {/* SidebarTrigger is automatically handled by SidebarRail or can be placed if custom trigger point is needed within the header when collapsed */}
        </SidebarHeader>
        <Separator className="my-0 bg-sidebar-border/50" />
        <SidebarContent className="p-2">
          <NavLinks />
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
          {/* Footer content if any, e.g., version, links */}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset> {/* This will be the main content area */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 shadow-sm">
          <SidebarTrigger className="md:hidden" /> {/* Mobile trigger, appears on left for RTL */}
          <div className="flex-1">
            {currentDateTime ? (
              <span className="text-sm text-muted-foreground">{currentDateTime}</span>
            ) : (
              <span className="text-sm text-muted-foreground">جارٍ تحميل الوقت...</span>
            )}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
