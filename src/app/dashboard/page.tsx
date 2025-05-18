"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ArrowRightLeft, ListChecks, AlertTriangle } from 'lucide-react';
import type { Transaction, Equipment } from '@/lib/types';
import { getTransactions, calculateStock } from '@/lib/store';
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

    // Example: Define low stock threshold (e.g., quantity < 5)
    const LOW_STOCK_THRESHOLD = 5;
    setLowStockItems(currentStock.filter(item => item.quantity < LOW_STOCK_THRESHOLD && item.quantity > 0));
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
            <CardDescription>التجهيزات التالية كميتها منخفضة في المستودع:</CardDescription>
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

// Placeholder Icon for the first card - replace if a better one is found in lucide.
const PlusCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);
