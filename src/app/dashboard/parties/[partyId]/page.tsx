
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BuildingIcon } from 'lucide-react'; // ArrowRight for back button
import type { Party, Transaction } from '@/lib/types';
import { getParties, getTransactions } from '@/lib/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PartyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params.partyId as string;

  const [party, setParty] = useState<Party | null>(null);
  const [partyTransactions, setPartyTransactions] = useState<Transaction[]>([]);

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
      }
    }
  }, [partyId]);

  if (!party && partyId) { // Check if partyId exists to avoid flashing "not found" during initial load
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
  
  if (!party) { // Still loading or party truly not found after check
    return (
        <div className="container mx-auto py-8 text-center">
            <p>جارٍ تحميل بيانات الجهة...</p>
        </div>
    );
  }


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BuildingIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">تفاصيل الجهة: {party.name}</h1>
        </div>
        <Button onClick={() => router.push('/dashboard/parties')} variant="outline">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة إلى قائمة الجهات
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>معاملات الجهة</CardTitle>
          <CardDescription>قائمة بجميع عمليات الاستلام والتسليم المرتبطة بالجهة: {party.name}.</CardDescription>
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
                          {tx.type === 'receive' ? 'استلام منها' : 'تسليم لها'}
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
            <p className="text-muted-foreground text-center py-4">لا توجد معاملات مسجلة لهذه الجهة.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
