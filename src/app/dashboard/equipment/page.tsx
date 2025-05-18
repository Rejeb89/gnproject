
"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle, Package, Edit2, Trash2, PackageSearch, CheckCircle, XCircle, LogIn, ArrowRightLeft, ArrowUp, ArrowDown } from "lucide-react";
import type { EquipmentDefinition, Transaction, Equipment } from "@/lib/types";
import { getEquipmentDefinitions, addEquipmentDefinition, updateEquipmentDefinition, deleteEquipmentDefinition, getTransactions, calculateStock } from "@/lib/store";
import { EquipmentDefinitionForm, type EquipmentDefinitionFormValues } from "@/components/forms/equipment-definition-form";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type SortableKeys = keyof Pick<EquipmentDefinition, 'name' | 'defaultCategory'>;

export default function EquipmentManagementPage() {
  const [definitions, setDefinitions] = useState<EquipmentDefinition[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<EquipmentDefinition | null>(null);
  const [definitionToDelete, setDefinitionToDelete] = useState<EquipmentDefinition | null>(null);
  const [currentStock, setCurrentStock] = useState<Equipment[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys | null; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDefinitions(getEquipmentDefinitions()); // Initial load, sorting will be handled by useMemo
    const transactions = getTransactions();
    setAllTransactions(transactions);
    setCurrentStock(calculateStock(transactions));
  };

  const requestSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDefinitions = useMemo(() => {
    let sortableItems = [...definitions];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA === null || valA === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (valB === null || valB === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        
        // Fallback for other types (e.g. comparing string with undefined if not handled above)
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort if no key is specified (e.g. initial load before sortConfig is fully set by user)
      sortableItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sortableItems;
  }, [definitions, sortConfig]);


  const handleOpenAddDialog = () => {
    setEditingDefinition(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (definition: EquipmentDefinition) => {
    setEditingDefinition(definition);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (values: EquipmentDefinitionFormValues) => {
    try {
      if (editingDefinition) {
        updateEquipmentDefinition({ ...editingDefinition, ...values });
        toast({ title: "تم التحديث بنجاح", description: `تم تحديث نوع التجهيز: ${values.name}` });
      } else {
        if (definitions.some(def => def.name.toLowerCase() === values.name.toLowerCase())) {
            toast({
                title: "خطأ في الإضافة",
                description: `نوع التجهيز بالاسم "${values.name}" موجود بالفعل.`,
                variant: "destructive",
            });
            return;
        }
        addEquipmentDefinition(values);
        toast({ title: "تمت الإضافة بنجاح", description: `تم إضافة نوع التجهيز: ${values.name}` });
      }
      loadData();
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error("Error saving equipment definition:", error);
      toast({ title: "حدث خطأ", description: "لم يتم حفظ نوع التجهيز.", variant: "destructive" });
    }
  };

  const handleDeleteDefinition = (definition: EquipmentDefinition) => {
    const isUsed = allTransactions.some(tx => tx.equipmentName === definition.name);

    if (isUsed) {
      toast({
        title: "لا يمكن الحذف",
        description: `لا يمكن حذف نوع التجهيز "${definition.name}" لأنه مستخدم في معاملات قائمة.`,
        variant: "destructive",
      });
      setDefinitionToDelete(null); 
      return;
    }

    try {
      deleteEquipmentDefinition(definition.id);
      toast({ title: "تم الحذف بنجاح", description: `تم حذف نوع التجهيز: ${definition.name}` });
      loadData();
    } catch (error) {
      console.error("Error deleting equipment definition:", error);
      toast({ title: "حدث خطأ", description: "لم يتم حذف نوع التجهيز.", variant: "destructive" });
    }
    setDefinitionToDelete(null);
  };

  const getQuantityForDefinition = (definitionName: string): number => {
    return currentStock
      .filter(stockItem => stockItem.name === definitionName)
      .reduce((total, item) => total + item.quantity, 0);
  };


  return (
    <AlertDialog open={!!definitionToDelete} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setDefinitionToDelete(null);
      }
    }}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">إدارة أنواع التجهيزات</h1>
          <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/dashboard/receive">
                <LogIn className="ml-2 h-5 w-5" />
                تسجيل استلام جديد
              </Link>
            </Button>
            <Button asChild variant="destructive">
              <Link href="/dashboard/dispatch">
                <ArrowRightLeft className="ml-2 h-5 w-5" />
                تسليم تجهيزات
              </Link>
            </Button>
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="ml-2 h-5 w-5" />
              إضافة نوع تجهيز جديد
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              قائمة أنواع التجهيزات المعرفة
            </CardTitle>
            <CardDescription>
              إدارة الأنواع المختلفة للتجهيزات الموجودة في النظام، مع بيان الكمية الحالية وحالة الاستلام.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedDefinitions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('name')} className="px-1 py-1 h-auto hover:bg-muted">
                        اسم نوع التجهيز
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('defaultCategory')} className="px-1 py-1 h-auto hover:bg-muted">
                        الصنف الافتراضي
                        {sortConfig.key === 'defaultCategory' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">الكمية الحالية</TableHead>
                    <TableHead className="text-center">تم استلامه؟</TableHead>
                    <TableHead className="text-center">حد التنبيه الافتراضي</TableHead>
                    <TableHead>وحدة القياس</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDefinitions.map((def) => {
                    const currentQuantity = getQuantityForDefinition(def.name);
                    const hasBeenReceived = allTransactions.some(tx => tx.equipmentName === def.name && tx.type === 'receive');
                    return (
                      <TableRow key={def.id}>
                        <TableCell className="font-medium">{def.name}</TableCell>
                        <TableCell>{def.defaultCategory || '-'}</TableCell>
                        <TableCell className="text-center font-semibold">
                          <span className={cn(
                            currentQuantity <= (def.defaultLowStockThreshold || 0) && currentQuantity > 0 ? "text-destructive" :
                            currentQuantity === 0 ? "text-muted-foreground" : ""
                          )}>
                            {currentQuantity.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasBeenReceived ? (
                            <CheckCircle className="h-5 w-5 text-green-600 inline-block" title="نعم، تم استلامه"/>
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground inline-block" title="لا، لم يتم استلامه بعد"/>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{def.defaultLowStockThreshold?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{def.unitOfMeasurement || '-'}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(def)} title="تعديل">
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="حذف" onClick={() => setDefinitionToDelete(def)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <PackageSearch className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">لم يتم تعريف أي أنواع تجهيزات بعد.</p>
                <p>ابدأ بإضافة نوع تجهيز جديد لتنظيم مخزونك.</p>
              </div>
            )}
          </CardContent>
          {sortedDefinitions.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
              يتم عرض {sortedDefinitions.length} {sortedDefinitions.length === 1 ? 'نوع تجهيز معرف' : sortedDefinitions.length === 2 ? 'نوعي تجهيز معرفين' : sortedDefinitions.length <=10 ? 'أنواع تجهيزات معرفة' : 'نوع تجهيز معرف'}.
            </CardFooter>
          )}
        </Card>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingDefinition ? 'تعديل نوع التجهيز' : 'إضافة نوع تجهيز جديد'}</DialogTitle>
              <DialogDescription>
                {editingDefinition ? 'قم بتحديث تفاصيل نوع التجهيز.' : 'أدخل تفاصيل نوع التجهيز الجديد.'}
              </DialogDescription>
            </DialogHeader>
            <EquipmentDefinitionForm
              onSubmit={handleFormSubmit}
              initialData={editingDefinition}
              existingNames={definitions.map(d => d.name).filter(name => name !== editingDefinition?.name)}
            />
          </DialogContent>
        </Dialog>

        {definitionToDelete && (
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                  هل أنت متأكد أنك تريد حذف نوع التجهيز "{definitionToDelete.name}"؟
                  لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                  onClick={() => handleDeleteDefinition(definitionToDelete)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                  نعم، قم بالحذف
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </div>
    </AlertDialog>
  );
}
    
