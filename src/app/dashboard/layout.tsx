
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
import { format, formatDistanceToNowStrict } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, CheckCheck, Search as SearchIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppNotification, CalendarEvent } from '@/lib/types';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications as clearNotificationsFromStore, addNotification, getCalendarEvents, NOTIFICATIONS_KEY } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GlobalSearchDialog } from '@/components/dashboard/global-search-dialog';

function calculateReminderDateTime(event: CalendarEvent): Date | null {
  if (!event.reminderUnit || event.reminderUnit === "none" || !event.reminderValue) {
    return null;
  }
  const eventDate = new Date(event.date);
  let reminderDateTime: Date;
  switch (event.reminderUnit) {
    case 'hours':
      reminderDateTime = new Date(eventDate.getTime() - event.reminderValue * 60 * 60 * 1000);
      break;
    case 'days':
      reminderDateTime = new Date(eventDate.getTime() - event.reminderValue * 24 * 60 * 60 * 1000);
      break;
    case 'weeks':
      reminderDateTime = new Date(eventDate.getTime() - event.reminderValue * 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      return null;
  }
  return reminderDateTime;
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

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
    if (typeof window !== 'undefined') {
      const storedNotifications = getNotifications();
      setNotifications(storedNotifications);
      setUnreadCount(storedNotifications.filter(n => !n.isRead).length);
    }
  };

  // Check for calendar event reminders
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkEventReminders = () => {
      const now = new Date();
      const events = getCalendarEvents();

      events.forEach(event => {
        const eventDate = new Date(event.date);
        if (eventDate < now && !format(eventDate, 'yyyy-MM-dd').includes(format(now, 'yyyy-MM-dd'))) { // Skip past events unless it's today
            return;
        }
        
        const reminderDateTime = calculateReminderDateTime(event);
        
        if (reminderDateTime && now >= reminderDateTime && now < eventDate) {
            const reminderSentKey = `reminder_sent_${event.id}_${event.reminderUnit}${event.reminderValue}`;
            if (!localStorage.getItem(reminderSentKey)) {
            const timeToEvent = formatDistanceToNowStrict(eventDate, { locale: arSA, addSuffix: true });
            addNotification({
                message: `تذكير: لديك حدث "${event.title}" ${timeToEvent}.`,
                type: 'event_reminder',
                link: '/dashboard/calendar',
                eventId: event.id,
            });
            localStorage.setItem(reminderSentKey, 'true');
            }
        }
      });
    };

    checkEventReminders(); // Check on load
    const intervalId = setInterval(checkEventReminders, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    loadNotifications();
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === NOTIFICATIONS_KEY) { 
            loadNotifications();
        }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleNotificationsUpdated = () => {
        loadNotifications();
    };
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {currentDateTime ? (
              <span className="text-sm text-muted-foreground hidden sm:inline">{currentDateTime}</span>
            ) : (
              <span className="text-sm text-muted-foreground hidden sm:inline">جارٍ تحميل الوقت...</span>
            )}
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => setIsGlobalSearchOpen(true)} title="بحث شامل">
            <SearchIcon className="h-5 w-5" />
            <span className="sr-only">بحث شامل</span>
          </Button>

          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
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
                        markNotificationAsRead(notification.id); // Mark as read before navigation
                        loadNotifications(); // Update UI immediately
                        if (notification.link) router.push(notification.link);
                    }}
                  >
                    <p className="w-full">{notification.message}</p>
                    <p className={cn("text-xs", notification.isRead ? "text-muted-foreground" : "text-primary/80")}>
                      {formatDistanceToNowStrict(new Date(notification.timestamp), { addSuffix: true, locale: arSA })}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMarkAllAsRead} className="text-sm cursor-pointer">
                    <CheckCheck className="ml-2 h-4 w-4" />
                    تمييز الكل كمقروء
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearAll} className="text-sm text-destructive focus:text-destructive cursor-pointer">
                    <Trash2 className="ml-2 h-4 w-4" />
                    مسح كل الإشعارات
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <GlobalSearchDialog open={isGlobalSearchOpen} onOpenChange={setIsGlobalSearchOpen} />
    </SidebarProvider>
  );
}
