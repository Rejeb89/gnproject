
"use client";

import { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, BuildingIcon, FileDown, UploadCloud, UsersIcon, ListX, UserX } from 'lucide-react'; 
import type { Party, Transaction, PartyEmployee } from '@/lib/types';
import { getParties, getTransactions, getPartyEmployees, importPartyEmployeesFromExcel } from '@/lib/store';
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

export default function PartyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params.partyId as string;
  const { toast } = useToast();

  const [party, setParty] = useState<Party | null>(null);
  const [partyTransactions, setPartyTransactions] = useState<Transaction[]>([]);
  const [partyEmployees, setPartyEmployees] = useState<PartyEmployee[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);


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
      }
    }
  }, [partyId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportEmployees = async () => {
    if (!selectedFile || !partyId) {
      toast({
        title: "خطأ في الاستيراد",
        description: "يرجى اختيار ملف Excel أولاً.",
        variant: "destructive",
      });
      return;
    }
    setIsImporting(true);
    const result = await importPartyEmployeesFromExcel(partyId, selectedFile);
    setIsImporting(false);
    toast({
      title: result.success ? "نجاح الاستيراد" : "فشل الاستيراد",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success && result.data) {
      setPartyEmployees(result.data);
    }
    setSelectedFile(null); 
    const fileInput = document.getElementById('employee-excel-file') as HTMLInputElement;
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
                تصدير تقارير المعاملات
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
                          {tx.type === 'receive' ? `استلام من ${tx.party}` : `تسليم إلى ${tx.party}`}
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" />
            بيانات موظفي الجهة
          </CardTitle>
          <CardDescription>
            إدارة بيانات موظفي هذه الجهة. قم باستيراد أو تحديث البيانات باستخدام ملف Excel.
            <br />
            يجب أن يحتوي ملف Excel على الأعمدة التالية بالترتيب: الرتبة, الاسم, اللقب, الرقم.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              id="employee-excel-file"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="flex-grow"
              aria-label="اختيار ملف Excel لبيانات الموظفين"
            />
            <Button onClick={handleImportEmployees} disabled={!selectedFile || isImporting} className="w-full sm:w-auto">
              <UploadCloud className="ml-2 h-4 w-4" />
              {isImporting ? "جارٍ الاستيراد..." : "استيراد / تحديث من Excel"}
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
      </Card>
    </div>
  );
}

