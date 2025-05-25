
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Settings, Building, Package } from 'lucide-react';
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
  { name: 'التقارير', href: '/dashboard/reports', icon: FileText },
  { name: 'إدارة الجهات', href: '/dashboard/parties', icon: Building },
  { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
];

export function NavLinks() {
  const pathname = usePathname();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    // Calculate low stock count
    // This logic is similar to what's in dashboard/page.tsx
    if (typeof window !== 'undefined') {
      const loadedTransactions = getTransactions();
      const currentStock = calculateStock(loadedTransactions);
      const equipmentSettings = getEquipmentSettings();

      const aggregatedStockByName: Record<string, number> = {};
      currentStock.forEach(item => {
        aggregatedStockByName[item.name] = (aggregatedStockByName[item.name] || 0) + item.quantity;
      });

      const lowStockItemsForAlert = Object.entries(aggregatedStockByName)
        .map(([name, totalQuantity]) => ({ name, quantity: totalQuantity }))
        .filter(item => {
          const setting = equipmentSettings[item.name];
          if (setting && typeof setting.lowStockThreshold === 'number') {
            return item.quantity > 0 && item.quantity < setting.lowStockThreshold;
          }
          return false;
        });
      setLowStockCount(lowStockItemsForAlert.length);
    }
  }, [pathname]); // Recalculate if path changes, or find a better trigger if needed

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
              <Link href={link.href} className="flex items-center gap-3 relative">
                <link.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{link.name}</span>
                {link.name === 'التجهيزات' && lowStockCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center z-10",
                      "group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:right-0 group-data-[collapsible=icon]:h-3 group-data-[collapsible=icon]:min-w-[0.75rem] group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:text-[0.625rem] group-data-[collapsible=icon]:leading-tight"
                    )}
                    aria-label={`${lowStockCount} تجهيزات بمخزون منخفض`}
                  >
                    {lowStockCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
