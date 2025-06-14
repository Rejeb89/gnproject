
"use client";
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft, AlertTriangle, Package, BarChart as BarChartIcon, CalendarClock, ListChecks } from 'lucide-react';
import type { Transaction, Equipment, CalendarEvent } from '@/lib/types';
import { getTransactions, calculateStock, getEquipmentSettings, addNotification, getCalendarEvents } from '@/lib/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

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
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Equipment[]>([]);
  const [displayChartData, setDisplayChartData] = useState<Array<{name: string; quantity: number; fill: string}>>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);


  useEffect(() => {
    setIsLoading(true);
    const loadedTransactions = getTransactions();
    setTransactions(loadedTransactions);
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
    setLowStockItems(lowStockItemsForAlert);

    if (lowStockItemsForAlert.length > 0) {
      const message = `يوجد ${lowStockItemsForAlert.length} ${lowStockItemsForAlert.length === 1 ? 'تجهيز' : lowStockItemsForAlert.length === 2 ? 'تجهيزين' : 'تجهيزات'} بمخزون منخفض.`;
      addNotification({
        message: message,
        type: 'low_stock',
        link: '/dashboard/equipment' 
      });
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }

    const namesOfLowStockItems = new Set(lowStockItemsForAlert.map(item => item.name));

    const chartDataFilteredAndColored = currentStock
      .filter(item => namesOfLowStockItems.has(item.name) && item.quantity > 0)
      .map((item, index) => ({
        name: `${item.name}${item.category ? ` (${item.category})` : ''}`,
        quantity: item.quantity,
        fill: BAR_COLORS[index % BAR_COLORS.length], 
      }));
    setDisplayChartData(chartDataFilteredAndColored);

    const allCalendarEvents = getCalendarEvents();
    const now = new Date();
    const futureEvents = allCalendarEvents
        .filter(event => {
            try {
                return new Date(event.date) >= now;
            } catch (e) {
                console.error("Invalid date in calendar event:", event);
                return false;
            }
        })
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setUpcomingEvents(futureEvents);

    setIsLoading(false);
  }, []);

  const totalReceived = transactions.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.quantity, 0);
  const totalDispatched = transactions.filter(tx => tx.type === 'dispatch').reduce((sum, tx) => sum + tx.quantity, 0);
  
  const legendPayload = useMemo(() => 
    displayChartData.map(item => ({
      value: `${item.name} (${item.quantity.toLocaleString()})`,
      type: 'circle' as const, 
      id: item.name,
      color: item.fill,
    })), [displayChartData]
  );

  const upcomingEventsCount = upcomingEvents.length;
  const nextFiveUpcomingEvents = upcomingEvents.slice(0, 5);


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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Adjusted lg:grid-cols */}
          {[...Array(3)].map((_, i) => ( // Changed to 3 for initial summary cards
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
        
        {/* Skeleton for Enhanced Upcoming Events Card / Low Stock Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/2 mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-1/4 mb-2" />
                <ul className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                        <li key={i} className="flex flex-col p-2 border-b last:border-b-0">
                            <Skeleton className="h-5 w-2/3 mb-1" />
                            <Skeleton className="h-4 w-1/2" />
                        </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-1/2 mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {[...Array(2)].map((_, i) => (
                            <li key={i} className="flex justify-between">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>


        {/* Skeleton for Chart Card */}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Adjusted lg:grid-cols */}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <Link href="/dashboard/calendar" className="hover:text-primary transition-colors">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="h-6 w-6 text-primary" />
                        الأحداث القادمة ({upcomingEventsCount})
                    </CardTitle>
                </Link>
                <CardDescription>
                    {upcomingEventsCount === 0 ? "لا توجد أحداث قادمة مجدولة." :
                     upcomingEventsCount === 1 ? "حدث واحد مجدول." :
                     upcomingEventsCount === 2 ? "حدثان مجدولان." :
                     upcomingEventsCount > 2 && upcomingEventsCount <= 10 ? `${upcomingEventsCount} أحداث مجدولة.` :
                     `${upcomingEventsCount} حدث مجدول.`
                    }
                    {nextFiveUpcomingEvents.length > 0 && " أهم 5 أحداث تالية:"}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {nextFiveUpcomingEvents.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                        {nextFiveUpcomingEvents.map(event => (
                            <li key={event.id} className="flex flex-col p-2 border-b last:border-b-0 hover:bg-muted/50 rounded-md">
                                <span className="font-semibold">{event.title}</span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(event.date), "eeee, d MMMM yyyy 'الساعة' HH:mm", { locale: arSA })}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    upcomingEventsCount > 0 && <p className="text-sm text-muted-foreground">سيتم عرض قائمة بأهم الأحداث هنا.</p>
                )}
            </CardContent>
        </Card>

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
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-6 w-6 text-primary" /> 
            تحليل مخزون التجهيزات المنخفض (رسم بياني شعاعي)
          </CardTitle>
          <CardDescription>رسم بياني شعاعي يوضح كميات التجهيزات (بأصنافها) التي وصلت لحد التنبيه.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {displayChartData.length > 0 ? (
             <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[450px] w-full sm:w-4/5 md:w-3/5 lg:w-2/5"
            >
              <RadialBarChart
                data={displayChartData}
                startAngle={90}
                endAngle={-270}
                innerRadius="30%"
                outerRadius="80%"
                barSize={24}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, Math.max(...displayChartData.map(d => d.quantity), 0)]} // Adjusted domain
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  dataKey="quantity"
                  cornerRadius={5}
                  background={{ fill: "hsl(var(--muted) / 0.3)" }}
                  angleAxisId={0}
                >
                  {displayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </RadialBar>
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--accent) / 0.2)" }}
                  content={<ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name, props) => { 
                        const equipmentDisplayName = props.payload?.name; 
                        return (
                          <div className="flex flex-col">
                            <span className="font-semibold">{equipmentDisplayName}</span>
                            <span>الكمية: {Number(value).toLocaleString()}</span>
                          </div>
                        );
                      }}
                  />}
                />
                <Legend
                  payload={legendPayload}
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{paddingTop: "20px"}}
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </RadialBarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد تجهيزات بمخزون منخفض لعرضها حاليًا.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    

    