
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { getTransactions } from '@/lib/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Download, FileText, Eraser, CalendarIcon, Users, ChevronsUpDown, Check, CalendarClock, FileDown, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { generateReceiptPdf } from '@/lib/pdf';
import { exportTransactionsToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 10;

const getPeriodDateRange = (periodType: string): { from: Date, to: Date } => {
  const now = new Date();
  let fromDate, toDate;

  switch (periodType) {
    case 'current_week':
      fromDate = startOfWeek(now, { weekStartsOn: 0, locale: arSA }); // Sunday
      toDate = endOfWeek(now, { weekStartsOn: 0, locale: arSA });
      break;
    case 'last_week':
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0, locale: arSA });
      fromDate = lastWeekStart;
      toDate = endOfWeek(lastWeekStart, { weekStartsOn: 0, locale: arSA });
      break;
    case 'current_month':
      fromDate = startOfMonth(now);
      toDate = endOfMonth(now);
      break;
    case 'last_month':
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      fromDate = lastMonthStart;
      toDate = endOfMonth(lastMonthStart);
      break;
    case 'current_year':
      fromDate = startOfYear(now);
      toDate = endOfYear(now);
      break;
    case 'last_year':
      const lastYearStart = startOfYear(subYears(now, 1));
      fromDate = lastYearStart;
      toDate = endOfYear(lastYearStart);
      break;
    default:
      // Should not happen with predefined types
      fromDate = now;
      toDate = now;
      console.error('Invalid period type:', periodType);
  }
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  return { from: fromDate, to: toDate };
};


export function HistoryTable() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    party: '',
    equipmentName: '',
    category: '',
    dateRange: undefined as DateRange | undefined,
    type: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueParties, setUniqueParties] = useState<string[]>([]);

  const [partyPopoverOpen, setPartyPopoverOpen] = useState(false);
  const [partySearchTerm, setPartySearchTerm] = useState("");


  useEffect(() => {
    const loadedTransactions = getTransactions();
    setAllTransactions(loadedTransactions);

    const categories = new Set(loadedTransactions.map(tx => tx.category).filter(Boolean) as string[]);
    setUniqueCategories(Array.from(categories).sort());

    const parties = new Set(loadedTransactions.map(tx => tx.party).filter(Boolean) as string[]);
    setUniqueParties(Array.from(parties).sort());
  }, []);

  const filteredTransactions = useMemo(() => {
    let transactions = [...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters.party) {
      transactions = transactions.filter(tx => (tx.party || '').toLowerCase() === filters.party.toLowerCase());
    }
    if (filters.equipmentName) {
      transactions = transactions.filter(tx => tx.equipmentName.toLowerCase().includes(filters.equipmentName.toLowerCase()));
    }
    if (filters.category) {
      transactions = transactions.filter(tx => (tx.category || '').toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.dateRange?.from) {
      transactions = transactions.filter(tx => new Date(tx.date) >= (filters.dateRange?.from as Date));
    }
    if (filters.dateRange?.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      transactions = transactions.filter(tx => new Date(tx.date) <= toDate);
    }
    if (filters.type !== 'all') {
      transactions = transactions.filter(tx => tx.type === filters.type);
    }
    return transactions;
  }, [allTransactions, filters]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ party: '', equipmentName: '', category: '', dateRange: undefined, type: 'all' });
    setPartySearchTerm('');
    setCurrentPage(1);
  };

  const handleExportCurrentResults = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: "لا توجد بيانات للتصدير", variant: "destructive" });
      return;
    }
    exportTransactionsToExcel(filteredTransactions, "النتائج_الحالية");
    toast({ title: "تم تصدير البيانات بنجاح", description: "تم إنشاء ملف Excel بالنتائج الحالية."});
  };
  
  const handlePeriodicExport = (periodType: string, periodName: string) => {
    const dateRangeForPeriod = getPeriodDateRange(periodType);
    
    let transactionsToExport = allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      let matchesDate = true;
      if (dateRangeForPeriod.from) matchesDate = matchesDate && txDate >= dateRangeForPeriod.from;
      if (dateRangeForPeriod.to) matchesDate = matchesDate && txDate <= dateRangeForPeriod.to;
      if (!matchesDate) return false;

      let matchesOtherFilters = true;
      if (filters.party) {
        matchesOtherFilters = matchesOtherFilters && (tx.party || '').toLowerCase() === filters.party.toLowerCase();
      }
      if (filters.equipmentName) {
        matchesOtherFilters = matchesOtherFilters && tx.equipmentName.toLowerCase().includes(filters.equipmentName.toLowerCase());
      }
      if (filters.category) {
        matchesOtherFilters = matchesOtherFilters && (tx.category || '').toLowerCase() === filters.category.toLowerCase();
      }
      if (filters.type !== 'all') {
        matchesOtherFilters = matchesOtherFilters && tx.type === filters.type;
      }
      return matchesOtherFilters;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (transactionsToExport.length === 0) {
      toast({ title: `لا توجد بيانات لتقرير ${periodName}`, variant: "destructive" });
      return;
    }
    exportTransactionsToExcel(transactionsToExport, periodName);
    toast({ title: `تم تصدير تقرير ${periodName} بنجاح`, description: "تم إنشاء ملف Excel." });
  };

  const partiesForCombobox = [{ value: "", label: "كل الجهات" }, ...uniqueParties.map(p => ({ value: p, label: p }))];
  
  const filteredPartiesForCombobox = partySearchTerm
    ? partiesForCombobox.filter(p => p.label.toLowerCase().includes(partySearchTerm.toLowerCase()))
    : partiesForCombobox;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Filter className="h-6 w-6 text-muted-foreground" />
            البحث
          </CardTitle>
          <CardDescription>استخدم خيارات البحث لتضييق نطاق نتائج البحث في التقارير.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Popover open={partyPopoverOpen} onOpenChange={setPartyPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={partyPopoverOpen}
                className="w-full justify-between h-10"
              >
                {filters.party
                  ? partiesForCombobox.find(p => p.value === filters.party)?.label
                  : "اختر الجهة..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="ابحث عن جهة..."
                  value={partySearchTerm}
                  onValueChange={setPartySearchTerm}
                />
                <CommandList>
                  <CommandEmpty>لم يتم العثور على جهة.</CommandEmpty>
                  <CommandGroup>
                    {filteredPartiesForCombobox.map((p) => (
                      <CommandItem
                        key={p.value}
                        value={p.label}
                        onSelect={(currentValue) => {
                          const selectedParty = partiesForCombobox.find(party => party.label.toLowerCase() === currentValue.toLowerCase());
                          handleFilterChange('party', selectedParty ? selectedParty.value : '');
                          setPartyPopoverOpen(false);
                          setPartySearchTerm(selectedParty && selectedParty.value !== "" ? selectedParty.label : "");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.party === p.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {p.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Input
            placeholder="البحث باسم التجهيز..."
            value={filters.equipmentName}
            onChange={e => handleFilterChange('equipmentName', e.target.value)}
            className="h-10"
            aria-label="البحث باسم التجهيز"
          />
          <Select
            value={filters.category} 
            onValueChange={value => handleFilterChange('category', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="h-10" aria-label="تصفية حسب صنف التجهيز">
              <SelectValue placeholder="صنف التجهيز" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأصناف</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-between text-right font-normal h-10",
                  !filters.dateRange && "text-muted-foreground"
                )}
              >
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "LLL dd, y", { locale: arSA })} -{" "}
                      {format(filters.dateRange.to, "LLL dd, y", { locale: arSA })}
                    </>
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y", { locale: arSA })
                  )
                ) : (
                  <span>اختر نطاق التاريخ</span>
                )}
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) => handleFilterChange('dateRange', range)}
                numberOfMonths={2}
                locale={arSA}
                dir="rtl"
              />
            </PopoverContent>
          </Popover>
          <Select
            value={filters.type}
            onValueChange={value => handleFilterChange('type', value)}
          >
            <SelectTrigger className="h-10" aria-label="تصفية حسب نوع العملية">
              <SelectValue placeholder="نوع العملية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل العمليات</SelectItem>
              <SelectItem value="receive">استلام</SelectItem>
              <SelectItem value="dispatch">تسليم</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetFilters} className="h-10">
                <Eraser className="ml-2 h-4 w-4" />
                مسح البحث
            </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">نتائج التقارير ({filteredTransactions.length} عملية)</h2>
        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
            <Button onClick={handleExportCurrentResults} variant="outline" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download className="ml-2 h-4 w-4" />
                تصدير النتائج الحالية
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <CalendarClock className="ml-2 h-4 w-4" />
                        تقارير دورية
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handlePeriodicExport('current_week', 'الأسبوع_الحالي')}>
                        <FileDown className="ml-2 h-4 w-4" /> تقرير الأسبوع الحالي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePeriodicExport('last_week', 'الأسبوع_الماضي')}>
                        <FileDown className="ml-2 h-4 w-4" /> تقرير الأسبوع الماضي
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handlePeriodicExport('current_month', 'الشهر_الحالي')}>
                        <FileDown className="ml-2 h-4 w-4" /> تقرير الشهر الحالي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePeriodicExport('last_month', 'الشهر_الماضي')}>
                        <FileDown className="ml-2 h-4 w-4" /> تقرير الشهر الماضي
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handlePeriodicExport('current_year', 'السنة_الحالية')}>
                        <FileDown className="ml-2 h-4 w-4" /> تقرير السنة الحالية
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePeriodicExport('last_year', 'السنة_الماضية')}>
                        <FileDown className="ml-2 h-4 w-4" /> تقرير السنة الماضية
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
      <Card className="shadow-lg">
        <CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نوع العملية</TableHead>
              <TableHead>اسم التجهيز</TableHead>
              <TableHead>صنف التجهيز</TableHead>
              <TableHead className="text-center">الكمية</TableHead>
              <TableHead>الجهة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>رقم الوصل</TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead className="text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell>
                  <Badge variant={tx.type === 'receive' ? 'default' : 'secondary'}
                         className={cn(
                            'font-semibold px-2.5 py-1 text-xs', 
                            tx.type === 'receive' ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                         )}>
                    {tx.type === 'receive' ? 'استلام' : 'تسليم'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{tx.equipmentName}</TableCell>
                <TableCell>{tx.category || '-'}</TableCell>
                <TableCell className="text-center">{tx.quantity.toLocaleString()}</TableCell>
                <TableCell>{tx.party}</TableCell>
                <TableCell>{format(new Date(tx.date), 'PPpp', { locale: arSA })}</TableCell>
                <TableCell>{tx.receiptNumber}</TableCell>
                <TableCell className="max-w-xs truncate" title={tx.notes}>{tx.notes || '-'}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => generateReceiptPdf(tx)} title="طباعة الوصل">
                    <FileText className="h-5 w-5 text-primary" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </CardContent>
        <CardFooter className="py-4">
           {totalPages > 1 && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      ) : (
        <div className="text-center py-10">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">لا توجد عمليات تطابق معايير البحث الحالية.</p>
          <p className="text-sm text-muted-foreground">حاول تعديل معايير البحث أو قم بإضافة عمليات جديدة.</p>
        </div>
      )}
    </div>
  );
}



    