
"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft, ListChecks, AlertTriangle, Package, Tag, AreaChart as AreaChartIcon } from 'lucide-react'; // Changed BarChartIcon to AreaChartIcon
import type { Transaction, Equipment } from '@/lib/types';
import { getTransactions, calculateStock, getEquipmentSettings } from '@/lib/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  quantity: {
    label: "الكمية",
    color: "hsl(var(--chart-1))", // Base color for the area/stroke
  },
} satisfies ChartConfig;

// BAR_COLORS is not strictly needed for a single gradient area chart, but kept for potential future use or consistency.
const BAR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<Equipment[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Equipment[]>([]);
  const [displayChartData, setDisplayChartData] = useState<Array<{name: string; quantity: number}>>([]); // Fill property removed as gradient is global

  useEffect(() => {
    setIsLoading(true);
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

    const namesOfLowStockItems = new Set(lowStockItemsForAlert.map(item => item.name));

    // Prepare data for AreaChart, keeping the detailed name for X-axis and tooltip
    const chartDataFiltered = currentStock
      .filter(item => namesOfLowStockItems.has(item.name) && item.quantity > 0) 
      .map((item, index) => ({
        name: `${item.name}${item.category ? ` (${item.category})` : ''}`, // Full name for X-axis
        quantity: item.quantity,
        // 'fill' property is not directly used by Area with single gradient
      }));
    setDisplayChartData(chartDataFiltered);
    setIsLoading(false);
  }, []);

  const totalReceived = transactions.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.quantity, 0);
  const totalDispatched = transactions.filter(tx => tx.type === 'dispatch').reduce((sum, tx) => sum + tx.quantity, 0);
  const uniqueItemsInStockCount = new Set(stock.map(s => `${s.name}-${s.category || 'N/A'}`)).size;

  const legendPayload = displayChartData.length > 0 ? [
    {
      value: `كمية التجهيزات المنخفضة`,
      type: 'line' as const, // Use 'line' or 'rect' for area representation
      id: 'quantity',
      color: chartConfig.quantity.color,
    }
  ] : [];


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Skeleton className="h-9 w-48" />
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-36" />
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-5 rounded-sm" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton for Low Stock Alert Card */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Skeleton className="h-6 w-6 rounded-sm" />
              <Skeleton className="h-6 w-40" />
            </CardTitle>
            <Skeleton className="h-4 w-full mt-1" />
             <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[...Array(2)].map((_, i) => (
                <li key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        {/* Skeleton for Low Stock Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-sm" />
              <Skeleton className="h-6 w-64" />
            </CardTitle>
            <Skeleton className="h-4 w-full mt-1" />
          </CardHeader>
          <CardContent className="pt-4">
            <Skeleton className="h-[450px] w-full" /> 
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
            <Link href="/dashboard/receive">تسجيل استلام جديد</Link>
          </Button>
          <Button asChild variant="destructive" className="w-full sm:w-auto">
            <Link href="/dashboard/dispatch">تسليم تجهيزات</Link> 
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التجهيزات المستلمة</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
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
          <CardTitle className="flex items-center gap-2">
            <AreaChartIcon className="h-6 w-6 text-primary" /> {/* Using AreaChartIcon */}
            تحليل مخزون التجهيزات المنخفض (رسم بياني مساحي متدرج)
          </CardTitle>
          <CardDescription>رسم بياني مساحي يوضح كميات التجهيزات (بأصنافها) التي وصلت لحد التنبيه.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {displayChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[450px] w-full">
              <AreaChart
                data={displayChartData}
                margin={{
                  top: 20, // Increased top margin for legend
                  right: 30,
                  left: 0,
                  bottom: 70, // Increased bottom margin for angled X-axis labels
                }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig.quantity.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartConfig.quantity.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} // Adjusted height for labels
                    interval={0} 
                    tick={{fontSize: '0.75rem'}} 
                />
                <YAxis 
                    tickFormatter={(value) => value.toLocaleString()}
                    tick={{fontSize: '0.75rem'}}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--accent) / 0.2)" }}
                  content={<ChartTooltipContent 
                    indicator="dot" 
                    formatter={(value, name, props) => {
                        const equipmentDisplayName = props.payload?.name || name; // Use the detailed name from payload
                        return (
                          <div className="flex flex-col">
                            <span className="font-semibold">{equipmentDisplayName}</span> 
                            <span>الكمية: {Number(value).toLocaleString()}</span>
                          </div>
                        );
                      }}
                  />}
                />
                <Area
                  type="monotone"
                  dataKey="quantity"
                  stroke={chartConfig.quantity.color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  name="الكمية" // This name will be used by default legend if payload is not provided
                />
                <Legend
                  payload={legendPayload}
                  iconSize={10}
                  layout="horizontal" // Changed to horizontal
                  verticalAlign="top"   // Placed at the top
                  align="center"        // Centered
                  wrapperStyle={{paddingBottom: "20px"}}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد تجهيزات بمخزون منخفض لعرضها حاليًا.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    

      