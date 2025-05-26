
"use client";

import { useEffect, useState, ChangeEvent, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, BuildingIcon, FileDown, UploadCloud, UsersIcon, ListX, UserX, Archive, Edit2, Trash2, PlusCircle, Search, ChevronDown } from 'lucide-react'; 
import type { Party, Transaction, PartyEmployee, FixedFurnitureItem } from '@/lib/types';
import { getParties, getTransactions, getPartyEmployees, importPartyEmployeesFromExcel, getFixedFurniture, importFixedFurnitureFromExcel } from '@/lib/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportTransactionsToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
// Placeholder for a future FixedFurnitureForm if manual entry is implemented
// import { FixedFurnitureForm, type FixedFurnitureFormValues } from '@/components/forms/fixed-furniture-form';
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
} from "@/components/ui/alert-dialog";


export default function PartyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params.partyId as string;
  const { toast } = useToast();

  const [party, setParty] = useState<Party | null>(null);
  const [partyTransactions, setPartyTransactions] = useState<Transaction[]>([]);
  
  const [partyEmployees, setPartyEmployees] = useState<PartyEmployee[]>([]);
  const [employeeFile, setEmployeeFile] = useState<File | null>(null);
  const [isImportingEmployees, setIsImportingEmployees] = useState(false);
  const [isEmployeeSectionOpen, setIsEmployeeSectionOpen] = useState(false);


  const [fixedFurniture, setFixedFurniture] = useState<FixedFurnitureItem[]>([]);
  const [furnitureFile, setFurnitureFile] = useState<File | null>(null);
  const [isImportingFurniture, setIsImportingFurniture] = useState(false);
  const [furnitureSearchTerm, setFurnitureSearchTerm] = useState("");
  const [isFurnitureSectionOpen, setIsFurnitureSectionOpen] = useState(false);


  // Placeholder for future manual add/edit furniture dialog
  const [isFurnitureFormOpen, setIsFurnitureFormOpen] = useState(false);
  const [editingFurnitureItem, setEditingFurnitureItem] = useState<FixedFurnitureItem | null>(null);
  const [furnitureItemToDelete, setFurnitureItemToDelete] = useState<FixedFurnitureItem | null>(null);


  useEffect(() => {
    if (partyId) {
      const allParties = getParties();
      const foundParty = allParties.find(p => p.id === partyId);
      setParty(foundParty || null);

      if (foundParty) {
        const allTransactions = getTransactions();
        const relatedTransactions = allTransactions
          .filter(tx => tx.party === foundParty.name)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPartyTransactions(relatedTransactions);

        const employees = getPartyEmployees(partyId);
        setPartyEmployees(employees);

        const furniture = getFixedFurniture(partyId);
        setFixedFurniture(furniture);
      }
    }
  }, [partyId]);

  const filteredFixedFurniture = useMemo(() => {
    if (!furnitureSearchTerm.trim()) {
      return fixedFurniture;
    }
    const lowercasedFilter = furnitureSearchTerm.toLowerCase().trim();
    return fixedFurniture.filter(item =>
      item.equipmentType.toLowerCase().includes(lowercasedFilter) ||
      (item.administrativeNumbering || "").toLowerCase().includes(lowercasedFilter) ||
      (item.serialNumber || "").toLowerCase().includes(lowercasedFilter) ||
      (item.location || "").toLowerCase().includes(lowercasedFilter) ||
      (item.status || "").toLowerCase().includes(lowercasedFilter)
    );
  }, [fixedFurniture, furnitureSearchTerm]);

  const handleEmployeeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setEmployeeFile(event.target.files[0]);
    } else {
      setEmployeeFile(null);
    }
  };

  const handleImportEmployees = async () => {
    if (!employeeFile || !partyId) {
      toast({
        title: "خطأ في الاستيراد",
        description: "يرجى اختيار ملف Excel للموظفين أولاً.",
        variant: "destructive",
      });
      return;
    }
    setIsImportingEmployees(true);
    const result = await importPartyEmployeesFromExcel(partyId, employeeFile);
    setIsImportingEmployees(false);
    toast({
      title: result.success ? "نجاح الاستيراد" : "فشل الاستيراد",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success && result.data) {
      setPartyEmployees(result.data);
    }
    setEmployeeFile(null); 
    const fileInput = document.getElementById('employee-excel-file') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
  };

  const handleFurnitureFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFurnitureFile(event.target.files[0]);
    } else {
      setFurnitureFile(null);
    }
  };

  const handleImportFurniture = async () => {
    if (!furnitureFile || !partyId) {
      toast({
        title: "خطأ في الاستيراد",
        description: "يرجى اختيار ملف Excel للأثاث أولاً.",
        variant: "destructive",
      });
      return;
    }
    setIsImportingFurniture(true);
    const result = await importFixedFurnitureFromExcel(partyId, furnitureFile);
    setIsImportingFurniture(false);
    toast({
      title: result.success ? "نجاح الاستيراد" : "فشل الاستيراد",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success && result.data) {
      setFixedFurniture(result.data);
    }
    setFurnitureFile(null);
    const fileInput = document.getElementById('furniture-excel-file') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
  };


  const exportPartyTransactions = (periodType: 'month' | 'year') => {
    if (!party) return;

    const transactionsToFilter = [...partyTransactions]; 

    if (transactionsToFilter.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: `لا توجد معاملات مسجلة مع ${party.name}.`,
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    let fromDate: Date, toDate: Date;
    let reportPeriodName: string;
    const reportTypeName: string = 'كل_المعاملات';


    if (periodType === 'month') {
      fromDate = startOfMonth(now);
      toDate = endOfMonth(now);
      reportPeriodName = `الشهر_الحالي (${format(now, "MMMM yyyy", { locale: arSA })})`;
    } else { 
      fromDate = startOfYear(now);
      toDate = endOfYear(now);
      reportPeriodName = `السنة_الحالية (${format(now, "yyyy", { locale: arSA })})`;
    }
    fromDate.setHours(0,0,0,0);
    toDate.setHours(23,59,59,999);

    const filteredForPeriod = transactionsToFilter.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= fromDate && txDate <= toDate;
    });

    if (filteredForPeriod.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: `لا توجد معاملات مسجلة مع ${party.name} خلال ${reportPeriodName.replace('_', ' ')}.`,
        variant: "destructive",
      });
      return;
    }

    const exportTitle = `تقرير_${reportTypeName}_مع_${party.name.replace(/\s+/g, '_')}_${reportPeriodName.replace(/[ ()]/g, '_')}`;
    exportTransactionsToExcel(filteredForPeriod, exportTitle);
    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير تقرير ${reportTypeName.replace('_', ' ')} مع ${party.name} لـ ${reportPeriodName.replace('_', ' ')} إلى ملف Excel.`,
    });
  };


  if (!party && partyId) {
    return (
        <div className="container mx-auto py-8 text-center">
            <Card className="max-w-md mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>الجهة غير موجودة</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">لم يتم العثور على الجهة المطلوبة.</p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/parties">
                            <ArrowRight className="ml-2 h-4 w-4" />
                            العودة إلى قائمة الجهات
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (!party) { 
    return (
        <div className="container mx-auto py-8 text-center">
            <p>جارٍ تحميل بيانات الجهة...</p>
        </div>
    );
  }


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <BuildingIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">تفاصيل الجهة: {party.name}</h1>
        </div>
        <Button onClick={() => router.push('/dashboard/parties')} variant="outline" className="w-full sm:w-auto">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة إلى قائمة الجهات
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle>معاملات الجهة</CardTitle>
            <CardDescription>قائمة بجميع عمليات الاستلام والتسليم المرتبطة بالجهة: {party.name}.</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <FileDown className="ml-2 h-4 w-4" />
                تصدير كل المعاملات
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => exportPartyTransactions('month')}>
                <FileDown className="ml-2 h-4 w-4" />
                تقرير كل المعاملات الشهري
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPartyTransactions('year')}>
                <FileDown className="ml-2 h-4 w-4" />
                تقرير كل المعاملات السنوي
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {partyTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع العملية</TableHead>
                    <TableHead>اسم التجهيز</TableHead>
                    <TableHead>صنف التجهيز</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>رقم الوصل</TableHead>
                    <TableHead>ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partyTransactions.map(tx => (
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
                      <TableCell>{format(new Date(tx.date), 'PPpp', { locale: arSA })}</TableCell>
                      <TableCell>{tx.receiptNumber}</TableCell>
                      <TableCell className="max-w-xs truncate" title={tx.notes}>{tx.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <ListX className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">لا توجد معاملات مسجلة لهذه الجهة.</p>
              <p className="text-sm">ابدأ بتسجيل عمليات استلام أو تسليم لترى المعاملات هنا.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader 
            className="cursor-pointer flex flex-row justify-between items-center" 
            onClick={() => setIsFurnitureSectionOpen(!isFurnitureSectionOpen)}
        >
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
                <Archive className="h-6 w-6 text-primary" />
                الأثاث القار المعين للوحدة
            </CardTitle>
            <CardDescription>
                إدارة بيانات الأثاث القار الخاص بهذه الجهة. انقر لعرض/إخفاء التفاصيل.
                {isFurnitureSectionOpen && (
                    <>
                    <br />
                    يجب أن يحتوي ملف Excel على الأعمدة التالية بالترتيب: نوع التجهيز، الكمية، الترقيم الإداري، الترقيم التسلسلي، مكان تواجده، الحالة.
                    </>
                )}
            </CardDescription>
          </div>
          <ChevronDown
            className={cn("h-5 w-5 text-muted-foreground transition-transform", isFurnitureSectionOpen && "rotate-180")}
          />
        </CardHeader>
        {isFurnitureSectionOpen && (
            <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                id="furniture-excel-file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFurnitureFileChange}
                className="flex-grow"
                aria-label="اختيار ملف Excel لبيانات الأثاث القار"
                />
                <Button onClick={handleImportFurniture} disabled={!furnitureFile || isImportingFurniture} className="w-full sm:w-auto">
                <UploadCloud className="ml-2 h-4 w-4" />
                {isImportingFurniture ? "جارٍ الاستيراد..." : "استيراد / تحديث من Excel"}
                </Button>
                <Button variant="outline" onClick={() => setIsFurnitureFormOpen(true)} className="w-full sm:w-auto" disabled>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة قطعة أثاث (قيد التطوير)
                </Button>
            </div>
            <div className="my-4">
                <Input
                type="search"
                placeholder="ابحث في الأثاث (نوع، ترقيم، موقع...)"
                value={furnitureSearchTerm}
                onChange={(e) => setFurnitureSearchTerm(e.target.value)}
                className="h-10 w-full sm:w-1/2"
                />
            </div>
            {filteredFixedFurniture.length > 0 ? (
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>نوع التجهيز</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead>الترقيم الإداري</TableHead>
                        <TableHead>الترقيم التسلسلي</TableHead>
                        <TableHead>مكان تواجده</TableHead>
                        <TableHead>الحالة</TableHead>
                        {/* <TableHead className="text-center">إجراءات</TableHead> */}
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredFixedFurniture.map(item => (
                        <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.equipmentType}</TableCell>
                        <TableCell className="text-center">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell>{item.administrativeNumbering || '-'}</TableCell>
                        <TableCell>{item.serialNumber || '-'}</TableCell>
                        <TableCell>{item.location || '-'}</TableCell>
                        <TableCell>{item.status || '-'}</TableCell>
                        {/* <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingFurnitureItem(item); setIsFurnitureFormOpen(true); }} title="تعديل" disabled>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" title="حذف" onClick={() => setFurnitureItemToDelete(item)} disabled>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell> */}
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                <Archive className="mx-auto h-12 w-12 mb-4 opacity-50" />
                {furnitureSearchTerm ? (
                    <p className="text-lg">لا يوجد أثاث يطابق معايير البحث الحالية.</p>
                ) : (
                    <>
                    <p className="text-lg">لم يتم تسجيل أي أثاث قار لهذه الجهة بعد.</p>
                    <p className="text-sm">استخدم زر الاستيراد من Excel أو زر الإضافة اليدوية (قيد التطوير) لبدء الإدارة.</p>
                    </>
                )}
                </div>
            )}
            </CardContent>
        )}
      </Card>

      <Card className="shadow-lg">
        <CardHeader 
            className="cursor-pointer flex flex-row justify-between items-center"
            onClick={() => setIsEmployeeSectionOpen(!isEmployeeSectionOpen)}
        >
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-6 w-6 text-primary" />
                بيانات موظفي الجهة
            </CardTitle>
            <CardDescription>
                إدارة بيانات موظفي هذه الجهة. انقر لعرض/إخفاء التفاصيل.
                {isEmployeeSectionOpen && (
                    <>
                    <br/>
                    قم باستيراد أو تحديث البيانات باستخدام ملف Excel. يجب أن يحتوي ملف Excel على الأعمدة التالية بالترتيب: الرتبة, الاسم, اللقب, الرقم.
                    </>
                )}
            </CardDescription>
          </div>
          <ChevronDown
            className={cn("h-5 w-5 text-muted-foreground transition-transform", isEmployeeSectionOpen && "rotate-180")}
          />
        </CardHeader>
        {isEmployeeSectionOpen && (
            <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                id="employee-excel-file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleEmployeeFileChange}
                className="flex-grow"
                aria-label="اختيار ملف Excel لبيانات الموظفين"
                />
                <Button onClick={handleImportEmployees} disabled={!employeeFile || isImportingEmployees} className="w-full sm:w-auto">
                <UploadCloud className="ml-2 h-4 w-4" />
                {isImportingEmployees ? "جارٍ الاستيراد..." : "استيراد / تحديث من Excel"}
                </Button>
            </div>
            {partyEmployees.length > 0 ? (
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>الرتبة</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>اللقب</TableHead>
                        <TableHead>الرقم</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {partyEmployees.map(emp => (
                        <TableRow key={emp.id}>
                        <TableCell>{emp.rank}</TableCell>
                        <TableCell>{emp.firstName}</TableCell>
                        <TableCell>{emp.lastName}</TableCell>
                        <TableCell>{emp.employeeNumber}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                <UserX className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">لم يتم استيراد بيانات موظفين لهذه الجهة بعد.</p>
                <p className="text-sm">استخدم الزر أعلاه للاستيراد من ملف Excel.</p>
                </div>
            )}
            </CardContent>
        )}
      </Card>

      {/* Placeholder for Furniture Form Dialog - Future Development */}
      <Dialog open={isFurnitureFormOpen} onOpenChange={setIsFurnitureFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFurnitureItem ? "تعديل قطعة أثاث" : "إضافة قطعة أثاث جديدة"}</DialogTitle>
            <DialogDesc>
              {/* <FixedFurnitureForm onSubmit={handleFurnitureFormSubmit} initialData={editingFurnitureItem} /> */}
              ميزة الإضافة/التعديل اليدوي للأثاث قيد التطوير.
            </DialogDesc>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Placeholder for Furniture Delete Confirmation - Future Development */}
      {furnitureItemToDelete && (
        <AlertDialog open={!!furnitureItemToDelete} onOpenChange={(isOpen) => !isOpen && setFurnitureItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertTitle>تأكيد الحذف</AlertTitle>
                    <AlertDesc>
                        هل أنت متأكد أنك تريد حذف قطعة الأثاث "{furnitureItemToDelete.equipmentType}"؟
                    </AlertDesc>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setFurnitureItemToDelete(null)}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { /* handleDeleteFurnitureItemConfirm(); */ setFurnitureItemToDelete(null);}} disabled>
                        نعم، قم بالحذف (قيد التطوير)
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}

