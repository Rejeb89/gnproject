import type { ReactNode } from 'react';
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
            {/* Optional: Breadcrumbs or Page Title */}
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
