
"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft, ListChecks, AlertTriangle, PlusCircle } from 'lucide-react';
import type { Transaction, Equipment } from '@/lib/types';
import { getTransactions, calculateStock, getEquipmentSettings } from '@/lib/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<Equipment[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Equipment[]>([]);

  useEffect(() => {
    const loadedTransactions = getTransactions();
    setTransactions(loadedTransactions);
    const currentStock = calculateStock(loadedTransactions);
    setStock(currentStock);

    const equipmentSettings = getEquipmentSettings();
    setLowStockItems(
      currentStock.filter(item => {
        const setting = equipmentSettings[item.name];
        if (setting && typeof setting.lowStockThreshold === 'number') {
          // Item is considered low stock if its quantity is > 0 and < its specific threshold
          return item.quantity > 0 && item.quantity < setting.lowStockThreshold;
        }
        // Fallback for items without a specific threshold (optional, can be removed if only specific thresholds should trigger alerts)
        // For now, let's only alert if a specific threshold is set and breached.
        return false; 
      })
    );
  }, []);

  const totalReceived = transactions.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.quantity, 0);
  const totalDispatched = transactions.filter(tx => tx.type === 'dispatch').reduce((sum, tx) => sum + tx.quantity, 0);
  const uniqueItemsCount = stock.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/receive">تسجيل استلام جديد</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/dispatch">تسجيل تسليم جديد</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التجهيزات المستلمة</CardTitle>
            <PlusCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">وحدة مستلمة حتى الآن</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التجهيزات المسلّمة</CardTitle>
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDispatched.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">وحدة مسلّمة حتى الآن</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أنواع التجهيزات في المخزون</CardTitle>
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueItemsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">نوع تجهيز فريد حاليًا</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              تنبيه نقص مخزون
            </CardTitle>
            <CardDescription>التجهيزات التالية كميتها منخفضة في المستودع (أقل من الحد المعين):</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {lowStockItems.map(item => (
                <li key={item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-semibold text-destructive">{item.quantity.toLocaleString()} وحدات متبقية</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على المخزون الحالي</CardTitle>
          <CardDescription>ملخص الكميات المتوفرة من كل تجهيز.</CardDescription>
        </CardHeader>
        <CardContent>
          {stock.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {stock.map(item => (
                  <li key={item.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-lg font-semibold text-primary">{item.quantity.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">لا يوجد تجهيزات في المخزون حاليًا.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
