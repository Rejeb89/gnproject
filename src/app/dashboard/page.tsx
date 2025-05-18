
"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft, ListChecks, AlertTriangle, PlusCircle, Tag } from 'lucide-react';
import type { Transaction, Equipment } from '@/lib/types';
import { getTransactions, calculateStock, getEquipmentSettings } from '@/lib/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  quantity: {
    label: "الكمية",
  },
} satisfies ChartConfig;

const BAR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<Equipment[]>([]); // Holds all stock items {name, category, quantity}
  const [lowStockItems, setLowStockItems] = useState<Equipment[]>([]); // Holds items (by name, aggregated quantity) that are low in stock for the alert card
  const [displayChartData, setDisplayChartData] = useState<Array<{name: string; quantity: number; fill: string}>>([]); // Data specifically for the chart (low stock items by name-category)

  useEffect(() => {
    const loadedTransactions = getTransactions();
    setTransactions(loadedTransactions);
    const currentStock = calculateStock(loadedTransactions);
    setStock(currentStock);

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
    setLowStockItems(lowStockItemsForAlert);

    // Prepare data for the chart: items from 'currentStock' whose 'name' is in 'lowStockItemsForAlert'
    const namesOfLowStockItems = new Set(lowStockItemsForAlert.map(item => item.name));

    const chartDataFiltered = currentStock
      .filter(item => namesOfLowStockItems.has(item.name)) // Filter currentStock to get only items whose NAME is low
      .map((item, index) => ({
        name: `${item.name}${item.category ? ` (${item.category})` : ''}`, // Display name (category)
        quantity: item.quantity, // Display the actual quantity of this specific name-category pair
        fill: BAR_COLORS[index % BAR_COLORS.length],
      }));
    setDisplayChartData(chartDataFiltered);

  }, []);

  const totalReceived = transactions.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.quantity, 0);
  const totalDispatched = transactions.filter(tx => tx.type === 'dispatch').reduce((sum, tx) => sum + tx.quantity, 0);
  const uniqueItemsInStockCount = new Set(stock.map(s => `${s.name}-${s.category || 'N/A'}`)).size;


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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-2xl font-bold">{uniqueItemsInStockCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">صنف تجهيز فريد حاليًا (بالاسم والصنف)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تجهيزات بمخزون منخفض</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {lowStockItems.length === 0 ? "لا يوجد تجهيزات حاليًا تحت حد التنبيه" : 
               lowStockItems.length === 1 ? "نوع تجهيز واحد وصل لحد التنبيه" :
               lowStockItems.length === 2 ? "نوعان من التجهيزات وصلا لحد التنبيه" :
               lowStockItems.length > 2 && lowStockItems.length <= 10 ? `${lowStockItems.length} أنواع تجهيزات وصلت لحد التنبيه` :
               `${lowStockItems.length} نوع تجهيز وصل لحد التنبيه`
              }
            </p>
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
            <CardDescription>التجهيزات التالية مجموع كمياتها (بكل أصنافها) منخفض في المستودع (أقل من الحد المعين لاسم التجهيز):</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {lowStockItems.map(item => (
                <li key={item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-semibold text-destructive">{item.quantity.toLocaleString()} وحدات متبقية (إجمالي)</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>التجهيزات ذات المخزون المنخفض</CardTitle>
          <CardDescription>رسم بياني يوضح كميات التجهيزات (بأصنافها) التي وصلت لحد التنبيه.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {displayChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart accessibilityLayer data={displayChartData} margin={{ top: 20, right: 20, bottom: 70, left: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={50} 
                  tickFormatter={(value: string) => value.length > 25 ? `${value.substring(0, 22)}...` : value}
                />
                <YAxis
                  tickFormatter={(value) => value.toLocaleString()}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={70}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                  {displayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد تجهيزات بمخزون منخفض لعرضها حاليًا.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
