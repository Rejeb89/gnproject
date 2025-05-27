
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Building, Package, Car, CalendarDays, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import type { Transaction, Equipment, EquipmentSetting } from '@/lib/types';
import { getTransactions, calculateStock, getEquipmentSettings } from '@/lib/store';

const links = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: Home, exact: true },
  { name: 'التجهيزات', href: '/dashboard/equipment', icon: Package },
  { name: 'وسائل النقل الادارية', href: '/dashboard/vehicles', icon: Car },
  { name: 'الروزنامة', href: '/dashboard/calendar', icon: CalendarDays },
  { name: 'إدارة الجهات', href: '/dashboard/parties', icon: Building },
  { name: 'الاعتمادات', href: '/dashboard/appropriations', icon: Landmark },
  { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
];

export function NavLinks() {
  const pathname = usePathname();
  // Removed lowStockCount state and related useEffect as the badge is being removed

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
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary"
              )}
              tooltip={{ children: link.name, className: "text-xs p-1" }}
            >
              <Link href={link.href} className="flex items-center gap-3 relative">
                <link.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{link.name}</span>
                {/* Badge for low stock count has been removed */}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
