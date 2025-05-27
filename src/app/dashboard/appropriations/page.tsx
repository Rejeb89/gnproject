
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Landmark, PlusCircle, Edit2, Trash2, HandCoins, FileText, Sigma, Banknote, Coins, Scale, Filter, Eraser, ChevronsUpDown, Check, CalendarIcon, ChevronDown } from "lucide-react";
import type { Appropriation, Spending } from "@/lib/types";
import {
  getAppropriations,
  addAppropriation,
  updateAppropriation,
  deleteAppropriation,
  getSpendings,
  addSpending,
} from "@/lib/store";
import { AppropriationForm, type AppropriationFormValues } from "@/components/forms/appropriation-form";
import { SpendingForm, type SpendingFormValues } from "@/components/forms/spending-form";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} د.ت`;
};

export default function AppropriationsPage() {
  const [appropriations, setAppropriations] = useState<Appropriation[]>([]);
  const [allSpendings, setAllSpendings] = useState<Spending[]>([]);
  const [isAppropriationFormOpen, setIsAppropriationFormOpen] = useState(false);
  const [editingAppropriation, setEditingAppropriation] = useState<Appropriation | null>(null);
  const [appropriationToDelete, setAppropriationToDelete] = useState<Appropriation | null>(null);

  const [isSpendingFormOpen, setIsSpendingFormOpen] = useState(false);
  const [selectedAppropriationForSpending, setSelectedAppropriationForSpending] = useState<Appropriation | null>(null);

  const { toast } = useToast();

  const [reportFilters, setReportFilters] = useState<{
    appropriationId: string | "all";
    dateRange: DateRange | undefined;
  }>({ appropriationId: "all", dateRange: undefined });
  const [generatedReportSpendings, setGeneratedReportSpendings] = useState<Spending[]>([]);
  const [showReportResults, setShowReportResults] = useState(false);
  const [appropriationSelectOpen, setAppropriationSelectOpen] = useState(false);
  const [appropriationSearchTerm, setAppropriationSearchTerm] = useState("");


  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAppropriations(getAppropriations().sort((a, b) => a.name.localeCompare(b.name)));
    setAllSpendings(getSpendings());
  };

  const appropriationsWithDetails = useMemo(() => {
    const safeAllSpendings = Array.isArray(allSpendings) ? allSpendings : [];
    return appropriations.map(approp => {
      const spentOnThisAppropriation = safeAllSpendings
        .filter(s => s.appropriationId === approp.id)
        .reduce((sum, s) => sum + s.spentAmount, 0);
      const remainingAmount = approp.allocatedAmount - spentOnThisAppropriation;
      return {
        ...approp,
        spentAmount: spentOnThisAppropriation,
        remainingAmount,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [appropriations, allSpendings]);

  const summaryTotals = useMemo(() => {
    const totalAllocated = appropriations.reduce((sum, apr) => sum + apr.allocatedAmount, 0);
    const totalSpentOnExistingAppropriations = appropriationsWithDetails.reduce((sum, apr) => sum + apr.spentAmount, 0);
    const totalRemaining = totalAllocated - totalSpentOnExistingAppropriations;
    return { totalAllocated, totalSpent: totalSpentOnExistingAppropriations, totalRemaining };
  }, [appropriations, appropriationsWithDetails]);

  const filteredReportSpendings = useMemo(() => {
    if (!showReportResults) return [];
    const safeAllSpendings = Array.isArray(allSpendings) ? allSpendings : [];
    let filtered = [...safeAllSpendings];

    if (reportFilters.appropriationId && reportFilters.appropriationId !== "all") {
      filtered = filtered.filter(s => s.appropriationId === reportFilters.appropriationId);
    }

    if (reportFilters.dateRange?.from) {
        const fromDate = new Date(reportFilters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(s => parseISO(s.spendingDate) >= fromDate);
    }
    if (reportFilters.dateRange?.to) {
        const toDate = new Date(reportFilters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(s => parseISO(s.spendingDate) <= toDate);
    }
    return filtered.sort((a,b) => parseISO(b.spendingDate).getTime() - parseISO(a.spendingDate).getTime());
  }, [reportFilters, allSpendings, showReportResults]);


  const handleAppropriationFormSubmit = (values: AppropriationFormValues) => {
    try {
      if (editingAppropriation) {
        updateAppropriation({ ...editingAppropriation, ...values });
        toast({ title: "تم التحديث بنجاح", description: `تم تحديث الاعتماد: ${values.name}` });
      } else {
        addAppropriation(values);
        toast({ title: "تمت الإضافة بنجاح", description: `تم إضافة الاعتماد: ${values.name}` });
      }
      loadData();
      setIsAppropriationFormOpen(false);
      setEditingAppropriation(null);
    } catch (error) {
      console.error("Error saving appropriation:", error);
      toast({ title: "حدث خطأ", description: "لم يتم حفظ الاعتماد.", variant: "destructive" });
    }
  };

  const handleDeleteAppropriationConfirm = () => {
    if (!appropriationToDelete) return;
    const result = deleteAppropriation(appropriationToDelete.id);
    if (result.success) {
      toast({ title: "تم الحذف بنجاح", description: `تم حذف الاعتماد: ${appropriationToDelete.name}` });
      loadData();
    } else {
      toast({ title: "لا يمكن الحذف", description: result.message, variant: "destructive" });
    }
    setAppropriationToDelete(null);
  };

  const handleSpendingFormSubmit = (values: SpendingFormValues) => {
    if (!selectedAppropriationForSpending) return;
    try {
      const spendingData: Omit<Spending, 'id'> = {
        appropriationId: selectedAppropriationForSpending.id,
        spentAmount: values.spentAmount,
        spendingDate: values.spendingDate.toISOString(),
        description: values.description,
        supplyRequestNumber: values.supplyRequestNumber,
        supplyRequestDate: values.supplyRequestDate?.toISOString(),
        supplyRequestFileName: values.supplyRequestFile?.[0]?.name,
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate?.toISOString(),
        invoiceFileName: values.invoiceFile?.[0]?.name,
      };
      addSpending(spendingData);
      toast({ title: "تمت إضافة الصرف بنجاح", description: `تم إضافة صرف للاعتماد: ${selectedAppropriationForSpending.name}` });
      loadData(); 
      setIsSpendingFormOpen(false);
      setSelectedAppropriationForSpending(null);
    } catch (error) {
      console.error("Error adding spending:", error);
      toast({ title: "حدث خطأ", description: "لم يتم إضافة الصرف.", variant: "destructive" });
    }
  };

  const handleGenerateReport = () => {
    setShowReportResults(true);
  };

  const handleClearReportFilters = () => {
    setReportFilters({ appropriationId: "all", dateRange: undefined });
    setAppropriationSearchTerm("");
    setShowReportResults(false);
    setGeneratedReportSpendings([]);
  };
  
  const reportAppropriationOptions = useMemo(() => {
    return [{ id: "all", name: "كل البنود" }, ...appropriations].map(apr => ({
        value: apr.id,
        label: apr.name
    }));
  }, [appropriations]);

  const filteredReportAppropriationOptions = useMemo(() => {
      if (!appropriationSearchTerm) return reportAppropriationOptions;
      return reportAppropriationOptions.filter(option => 
          option.label.toLowerCase().includes(appropriationSearchTerm.toLowerCase())
      );
  }, [appropriationSearchTerm, reportAppropriationOptions]);


  const totalSpentInReport = useMemo(() => {
      if (!showReportResults) return 0;
      return filteredReportSpendings.reduce((sum, s) => sum + s.spentAmount, 0);
  }, [filteredReportSpendings, showReportResults]);


  return (
    <AlertDialog open={!!appropriationToDelete} onOpenChange={(isOpen) => { if (!isOpen) setAppropriationToDelete(null); }}>
      <>
        <div className="container mx-auto py-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Landmark className="h-8 w-8" />
              إدارة الاعتمادات المالية
            </h1>
            <Button onClick={() => { setEditingAppropriation(null); setIsAppropriationFormOpen(true); }} className="w-full sm:w-auto">
              <PlusCircle className="ml-2 h-5 w-5" />
              إضافة اعتماد جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1"><Sigma className="h-4 w-4"/>إجمالي المرصود</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryTotals.totalAllocated)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1"><Coins className="h-4 w-4"/>إجمالي المستهلك</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryTotals.totalSpent)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1"><Banknote className="h-4 w-4"/>إجمالي المتبقي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryTotals.totalRemaining)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5"/>قائمة بنود الاعتمادات</CardTitle>
              <CardDescription>عرض وتعديل بنود الاعتمادات المسجلة وعمليات الصرف الخاصة بها.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {appropriationsWithDetails.length > 0 ? (
                  <>
                  <div className="hidden md:block border-b">
                      <Table>
                          <TableHeader>
                          <TableRow>
                              <TableHead className="w-[50px] text-center"><ChevronDown className="h-4 w-4 inline-block text-muted-foreground" /></TableHead>
                              <TableHead className="w-[25%]">اسم البند/المشروع</TableHead>
                              <TableHead className="text-center">المبلغ المرصود</TableHead>
                              <TableHead className="text-center">المبلغ المستهلك</TableHead>
                              <TableHead className="text-center">المبلغ المتبقي</TableHead>
                              <TableHead className="w-[25%]">الوصف</TableHead>
                              <TableHead className="text-center w-[150px]">إجراءات</TableHead>
                          </TableRow>
                          </TableHeader>
                      </Table>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                  {appropriationsWithDetails.map((appropriation) => {
                    const safeAllSpendings = Array.isArray(allSpendings) ? allSpendings : [];
                    const spendingsForThisAppropriation = safeAllSpendings.filter(s => s.appropriationId === appropriation.id)
                                                            .sort((a,b) => parseISO(b.spendingDate).getTime() - parseISO(a.spendingDate).getTime());
                    return (
                      <AccordionItem value={appropriation.id} key={appropriation.id} className="border-b last:border-b-0">
                        <AccordionTrigger className="p-0 hover:no-underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm">
                           <div className="flex items-center w-full hover:bg-muted/50 cursor-pointer p-4 md:p-0 md:grid md:grid-cols-[50px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] md:gap-x-4">
                                {/* Mobile View - inside the div that AccordionTrigger wraps */}
                                <div className="flex-grow md:hidden">
                                    <div className="font-semibold text-base mb-1">{appropriation.name}</div>
                                    <div className="text-sm"><span className="font-medium">المرصود:</span> {formatCurrency(appropriation.allocatedAmount)}</div>
                                    <div className="text-sm"><span className="font-medium">المستهلك:</span> <span className={appropriation.spentAmount > appropriation.allocatedAmount ? "text-destructive" : ""}>{formatCurrency(appropriation.spentAmount)}</span></div>
                                    <div className="text-sm"><span className="font-medium">المتبقي:</span> <span className={appropriation.remainingAmount < 0 ? "text-destructive" : ""}>{formatCurrency(appropriation.remainingAmount)}</span></div>
                                    {appropriation.description && <div className="text-xs text-muted-foreground mt-1"><span className="font-medium">الوصف:</span> {appropriation.description}</div>}
                                    <div className="flex flex-col sm:flex-row gap-1 mt-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingAppropriation(appropriation); setIsAppropriationFormOpen(true);}} className="w-full sm:w-auto"><Edit2 className="h-3 w-3 mr-1 md:mr-0"/> تعديل</Button>
                                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAppropriationForSpending(appropriation); setIsSpendingFormOpen(true);}} className="w-full sm:w-auto"><HandCoins className="h-3 w-3 mr-1 md:mr-0"/> إضافة صرف</Button>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setAppropriationToDelete(appropriation);}} className="w-full sm:w-auto"><Trash2 className="h-3 w-3 mr-1 md:mr-0"/> حذف</Button>
                                        </AlertDialogTrigger>
                                    </div>
                                </div>

                                {/* Desktop View - direct children of the grid div */}
                                <div className="hidden md:flex md:items-center md:justify-center md:w-[50px] md:pl-4">
                                  {/* Chevron is now part of AccordionTrigger */}
                                </div>
                                <div className="hidden md:flex md:items-center md:w-[25%] font-medium md:pr-4">{appropriation.name}</div>
                                <div className="hidden md:flex md:items-center md:justify-center text-center md:pr-4">{formatCurrency(appropriation.allocatedAmount)}</div>
                                <div className={`hidden md:flex md:items-center md:justify-center text-center md:pr-4 ${appropriation.spentAmount > appropriation.allocatedAmount ? "text-destructive font-semibold" : ""}`}>
                                    {formatCurrency(appropriation.spentAmount)}
                                </div>
                                <div className={`hidden md:flex md:items-center md:justify-center text-center md:pr-4 ${appropriation.remainingAmount < 0 ? "text-destructive font-semibold" : ""}`}>
                                    {formatCurrency(appropriation.remainingAmount)}
                                </div>
                                <div className="hidden md:flex md:items-center md:w-[25%] text-xs text-muted-foreground truncate md:pr-4" title={appropriation.description}>{appropriation.description || "-"}</div>
                                <div className="hidden md:flex md:items-center md:justify-center text-center w-[150px]">
                                    <div className="flex justify-center gap-1">
                                    <Button variant="ghost" size="icon" title="تعديل الاعتماد" onClick={(e) => { e.stopPropagation(); setEditingAppropriation(appropriation); setIsAppropriationFormOpen(true);}}>
                                        <Edit2 className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="إضافة صرف" onClick={(e) => { e.stopPropagation(); setSelectedAppropriationForSpending(appropriation); setIsSpendingFormOpen(true);}}>
                                        <HandCoins className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" title="حذف الاعتماد" onClick={(e) => { e.stopPropagation(); setAppropriationToDelete(appropriation);}}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/30 p-0">
                          {spendingsForThisAppropriation.length > 0 ? (
                            <div className="p-4">
                              <h4 className="text-md font-semibold mb-2">عمليات الصرف على بند: {appropriation.name}</h4>
                              <div className="overflow-x-auto">
                              <Table className="bg-background shadow-sm rounded-md">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>المبلغ</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>الوصف</TableHead>
                                    <TableHead>طلب التزود</TableHead>
                                    <TableHead>الفاتورة</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {spendingsForThisAppropriation.map(spending => (
                                    <TableRow key={spending.id}>
                                      <TableCell className="font-medium">{formatCurrency(spending.spentAmount)}</TableCell>
                                      <TableCell>{format(parseISO(spending.spendingDate), "dd/MM/yyyy", { locale: arSA })}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground truncate max-w-xs" title={spending.description}>{spending.description || "-"}</TableCell>
                                      <TableCell className="text-xs">
                                        {spending.supplyRequestNumber && <div>رقم: {spending.supplyRequestNumber}</div>}
                                        {spending.supplyRequestDate && <div>تاريخ: {format(parseISO(spending.supplyRequestDate), "dd/MM/yyyy", { locale: arSA })}</div>}
                                        {spending.supplyRequestFileName && <div className="text-blue-600 truncate max-w-[100px]" title={spending.supplyRequestFileName}>ملف: {spending.supplyRequestFileName}</div>}
                                        {!(spending.supplyRequestNumber || spending.supplyRequestDate || spending.supplyRequestFileName) && "-"}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {spending.invoiceNumber && <div>رقم: {spending.invoiceNumber}</div>}
                                        {spending.invoiceDate && <div>تاريخ: {format(parseISO(spending.invoiceDate), "dd/MM/yyyy", { locale: arSA })}</div>}
                                        {spending.invoiceFileName && <div className="text-blue-600 truncate max-w-[100px]" title={spending.invoiceFileName}>ملف: {spending.invoiceFileName}</div>}
                                        {!(spending.invoiceNumber || spending.invoiceDate || spending.invoiceFileName) && "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center p-6">لا توجد عمليات صرف مسجلة لهذا الاعتماد.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-10">
                  لم يتم إضافة أي اعتمادات بعد. ابدأ بإضافة اعتماد جديد.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>تقارير حول استهلاك الاعتمادات</CardTitle>
                  <CardDescription>عرض تقارير مفصلة حول استهلاك الاعتمادات حسب البنود والفترات الزمنية.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                      <div>
                          <Label htmlFor="reportAppropriation" className="mb-1 block">بند الاعتماد</Label>
                           <Popover open={appropriationSelectOpen} onOpenChange={setAppropriationSelectOpen}>
                              <PopoverTrigger asChild>
                                  <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={appropriationSelectOpen}
                                  className="w-full justify-between h-10"
                                  >
                                  {reportFilters.appropriationId === "all"
                                      ? "كل البنود"
                                      : appropriations.find(a => a.id === reportFilters.appropriationId)?.name || "اختر بندًا..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                  <Command shouldFilter={false}>
                                  <CommandInput
                                      placeholder="ابحث عن بند اعتماد..."
                                      value={appropriationSearchTerm}
                                      onValueChange={setAppropriationSearchTerm}
                                  />
                                  <CommandList>
                                      <CommandEmpty>لم يتم العثور على بند.</CommandEmpty>
                                      <CommandGroup>
                                      {filteredReportAppropriationOptions.map((option) => (
                                          <CommandItem
                                          key={option.value}
                                          value={option.label}
                                          onSelect={() => {
                                              setReportFilters(prev => ({ ...prev, appropriationId: option.value }));
                                              setAppropriationSelectOpen(false);
                                              setAppropriationSearchTerm(option.value === "all" ? "" : option.label);
                                          }}
                                          >
                                          <Check
                                              className={cn(
                                              "mr-2 h-4 w-4",
                                              reportFilters.appropriationId === option.value ? "opacity-100" : "opacity-0"
                                              )}
                                          />
                                          {option.label}
                                          </CommandItem>
                                      ))}
                                      </CommandGroup>
                                  </CommandList>
                                  </Command>
                              </PopoverContent>
                          </Popover>
                      </div>
                      <div>
                          <Label htmlFor="reportDateRange" className="mb-1 block">الفترة الزمنية</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                              <Button
                                  id="reportDateRange"
                                  variant={"outline"}
                                  className={cn(
                                  "w-full justify-between text-right font-normal h-10",
                                  !reportFilters.dateRange && "text-muted-foreground"
                                  )}
                              >
                                  {reportFilters.dateRange?.from ? (
                                  reportFilters.dateRange.to ? (
                                      <>
                                      {format(reportFilters.dateRange.from, "dd/MM/yy", {locale: arSA})} - {format(reportFilters.dateRange.to, "dd/MM/yy", {locale: arSA})}
                                      </>
                                  ) : (
                                      format(reportFilters.dateRange.from, "dd/MM/yy", {locale: arSA})
                                  )
                                  ) : (
                                  <span>اختر فترة</span>
                                  )}
                                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                  initialFocus
                                  mode="range"
                                  defaultMonth={reportFilters.dateRange?.from}
                                  selected={reportFilters.dateRange}
                                  onSelect={(range) => setReportFilters(prev => ({ ...prev, dateRange: range }))}
                                  numberOfMonths={2}
                                  locale={arSA} dir="rtl"
                              />
                              </PopoverContent>
                          </Popover>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <Button onClick={handleGenerateReport} className="flex-1 w-full sm:w-auto">
                              <Filter className="ml-2 h-4 w-4"/> عرض التقرير
                          </Button>
                          <Button onClick={handleClearReportFilters} variant="outline" className="flex-1 w-full sm:w-auto">
                              <Eraser className="ml-2 h-4 w-4"/> مسح
                          </Button>
                      </div>
                  </div>

                  {showReportResults && (
                      <div className="mt-6">
                          {filteredReportSpendings.length > 0 ? (
                              <>
                                  <h3 className="text-lg font-semibold mb-2">
                                      نتائج التقرير: {reportFilters.appropriationId === "all" ? "كل البنود" : appropriations.find(a => a.id === reportFilters.appropriationId)?.name}
                                      {reportFilters.dateRange?.from && ` (من ${format(reportFilters.dateRange.from, "dd/MM/yyyy", {locale: arSA})}`}
                                      {reportFilters.dateRange?.to && ` إلى ${format(reportFilters.dateRange.to, "dd/MM/yyyy", {locale: arSA})})`}
                                      {!reportFilters.dateRange?.from && reportFilters.dateRange?.to && ` (إلى ${format(reportFilters.dateRange.to, "dd/MM/yyyy", {locale: arSA})})`}
                                      {!reportFilters.dateRange?.from && !reportFilters.dateRange?.to && ""}
                                  </h3>
                                  <div className="overflow-x-auto border rounded-md">
                                  <Table>
                                      <TableHeader>
                                      <TableRow>
                                          {reportFilters.appropriationId === "all" && <TableHead>بند الاعتماد</TableHead>}
                                          <TableHead>المبلغ المصروف</TableHead>
                                          <TableHead>تاريخ الصرف</TableHead>
                                          <TableHead>الوصف</TableHead>
                                          <TableHead>طلب التزود</TableHead>
                                          <TableHead>الفاتورة</TableHead>
                                      </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                      {filteredReportSpendings.map(spending => {
                                          const appropriationName = appropriations.find(a => a.id === spending.appropriationId)?.name || "غير معروف";
                                          return (
                                          <TableRow key={spending.id}>
                                              {reportFilters.appropriationId === "all" && <TableCell>{appropriationName}</TableCell>}
                                              <TableCell className="font-medium">{formatCurrency(spending.spentAmount)}</TableCell>
                                              <TableCell>{format(parseISO(spending.spendingDate), "dd/MM/yyyy", { locale: arSA })}</TableCell>
                                              <TableCell className="text-xs text-muted-foreground truncate max-w-xs" title={spending.description}>{spending.description || "-"}</TableCell>
                                              <TableCell className="text-xs">
                                                  {spending.supplyRequestNumber && <div>رقم: {spending.supplyRequestNumber}</div>}
                                                  {spending.supplyRequestDate && <div>تاريخ: {format(parseISO(spending.supplyRequestDate), "dd/MM/yyyy", { locale: arSA })}</div>}
                                                  {spending.supplyRequestFileName && <div className="text-blue-600 truncate max-w-[100px]" title={spending.supplyRequestFileName}>ملف: {spending.supplyRequestFileName}</div>}
                                                  {!(spending.supplyRequestNumber || spending.supplyRequestDate || spending.supplyRequestFileName) && "-"}
                                              </TableCell>
                                              <TableCell className="text-xs">
                                                  {spending.invoiceNumber && <div>رقم: {spending.invoiceNumber}</div>}
                                                  {spending.invoiceDate && <div>تاريخ: {format(parseISO(spending.invoiceDate), "dd/MM/yyyy", { locale: arSA })}</div>}
                                                  {spending.invoiceFileName && <div className="text-blue-600 truncate max-w-[100px]" title={spending.invoiceFileName}>ملف: {spending.invoiceFileName}</div>}
                                                  {!(spending.invoiceNumber || spending.invoiceDate || spending.invoiceFileName) && "-"}
                                              </TableCell>
                                          </TableRow>
                                          );
                                      })}
                                      </TableBody>
                                  </Table>
                                  </div>
                                  <CardFooter className="pt-4 font-semibold">
                                      إجمالي المصروفات في التقرير: {formatCurrency(totalSpentInReport)}
                                  </CardFooter>
                              </>
                          ) : (
                              <p className="text-muted-foreground text-center py-6">لا توجد عمليات صرف تطابق معايير البحث المحددة.</p>
                          )}
                      </div>
                  )}
              </CardContent>
          </Card>

        </div>

        {/* Appropriation Form Dialog */}
        <Dialog open={isAppropriationFormOpen} onOpenChange={(isOpen) => {
            setIsAppropriationFormOpen(isOpen);
            if (!isOpen) setEditingAppropriation(null);
        }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingAppropriation ? 'تعديل الاعتماد' : 'إضافة اعتماد جديد'}</DialogTitle>
              <DialogDesc>
                {editingAppropriation ? 'قم بتحديث تفاصيل الاعتماد.' : 'أدخل تفاصيل الاعتماد الجديد.'}
              </DialogDesc>
            </DialogHeader>
            <AppropriationForm
              onSubmit={handleAppropriationFormSubmit}
              initialData={editingAppropriation}
              existingNames={appropriations.map(a => a.name).filter(name => name !== editingAppropriation?.name)}
            />
          </DialogContent>
        </Dialog>

        {/* Spending Form Dialog */}
        <Dialog open={isSpendingFormOpen} onOpenChange={(isOpen) => {
            setIsSpendingFormOpen(isOpen);
            if (!isOpen) setSelectedAppropriationForSpending(null);
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة عملية صرف للاعتماد: {selectedAppropriationForSpending?.name}</DialogTitle>
              <DialogDesc>
                أدخل تفاصيل عملية الصرف. الرصيد المتبقي الحالي للاعتماد: {formatCurrency(selectedAppropriationForSpending ? (appropriationsWithDetails.find(a => a.id === selectedAppropriationForSpending.id)?.remainingAmount || 0) : 0)}
              </DialogDesc>
            </DialogHeader>
            {selectedAppropriationForSpending && (
              <SpendingForm
                key={selectedAppropriationForSpending.id} 
                onSubmit={handleSpendingFormSubmit}
                appropriationName={selectedAppropriationForSpending.name}
                maxSpendableAmount={appropriationsWithDetails.find(a => a.id === selectedAppropriationForSpending.id)?.remainingAmount || 0}
                onCancel={() => {
                    setIsSpendingFormOpen(false);
                    setSelectedAppropriationForSpending(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog Content - Rendered conditionally by AlertDialog's open state */}
        {appropriationToDelete && (
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertTitle>تأكيد الحذف</AlertTitle>
              <AlertDesc>
                  هل أنت متأكد أنك تريد حذف الاعتماد "{appropriationToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                  {(Array.isArray(allSpendings) ? allSpendings : []).some(s => s.appropriationId === appropriationToDelete.id) && 
                    <span className="block mt-2 text-destructive font-semibold">تحذير: هذا الاعتماد لديه عمليات صرف مسجلة. حذف الاعتماد لن يحذف عمليات الصرف المرتبطة به حاليًا.</span>
                  }
              </AlertDesc>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleDeleteAppropriationConfirm}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                  نعم، قم بالحذف
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </>
    </AlertDialog>
  );
}
