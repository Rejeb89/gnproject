
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { format, formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppNotification } from '@/lib/types';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications as clearNotificationsFromStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const loadNotifications = () => {
    const storedNotifications = getNotifications();
    setNotifications(storedNotifications);
    setUnreadCount(storedNotifications.filter(n => !n.isRead).length);
  };

  useEffect(() => {
    loadNotifications();
    // Optionally, set up an interval or event listener to refresh notifications
    // For simplicity, we'll rely on page loads or specific actions to refresh for now.
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'equipTrack_notifications_v1') {
            loadNotifications();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  if (typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') !== 'true') {
    // Let useEffect handle redirection to avoid hydration issues.
  }

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
    toast({ title: "تم تمييز كل الإشعارات كمقروءة" });
  };

  const handleClearAll = () => {
    clearNotificationsFromStore();
    loadNotifications();
    toast({ title: "تم مسح كل الإشعارات" });
  };


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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">فتح الإشعارات</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[70vh] overflow-y-auto">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>الإشعارات</span>
                {notifications.length > 0 && (
                   <span className="text-xs text-muted-foreground">
                     {unreadCount > 0 ? `${unreadCount} غير مقروء` : 'لا توجد إشعارات جديدة'}
                   </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled className="justify-center text-muted-foreground py-4">
                  لا توجد إشعارات حاليًا.
                </DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                        "flex flex-col items-start gap-1 whitespace-normal py-2 px-3 text-sm hover:bg-accent cursor-pointer",
                        !notification.isRead && "bg-accent/50 font-semibold"
                    )}
                    onClick={() => {
                        handleMarkAsRead(notification.id);
                        if (notification.link) router.push(notification.link);
                    }}
                  >
                    <p className="w-full">{notification.message}</p>
                    <p className={cn("text-xs", notification.isRead ? "text-muted-foreground" : "text-primary/80")}>
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: arSA })}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMarkAllAsRead} className="text-sm">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    تمييز الكل كمقروء
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearAll} className="text-sm text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    مسح كل الإشعارات
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
