
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowRightLeft, FileText, Settings, Building, Package } from 'lucide-react'; // Removed PlusCircle as it's no longer directly in sidebar for 'receive'
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const links = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: Home, exact: true },
  // { name: 'تسجيل استلام', href: '/dashboard/receive', icon: PlusCircle }, // Removed this link
  { name: 'تسجيل تسليم', href: '/dashboard/dispatch', icon: ArrowRightLeft },
  { name: 'التقارير', href: '/dashboard/reports', icon: FileText },
  { name: 'إدارة الجهات', href: '/dashboard/parties', icon: Building },
  { name: 'التجهيزات', href: '/dashboard/equipment', icon: Package },
  { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <SidebarMenuItem key={link.name}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className={cn(
                "justify-start",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              tooltip={{ children: link.name, className: "text-xs p-1" }}
            >
              <Link href={link.href} className="flex items-center gap-3">
                <link.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{link.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
