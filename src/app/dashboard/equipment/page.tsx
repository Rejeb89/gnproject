
"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle, Package, Edit2, Trash2, PackageSearch, CheckCircle, XCircle, LogIn, ArrowRightLeft, Filter, History } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryTable } from '@/components/history/history-table';
import { Separator } from '@/components/ui/separator';

const NO_CATEGORY_VALUE = "_EMPTY_CATEGORY_";

export default function EquipmentManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [definitions, setDefinitions] = useState<EquipmentDefinition[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<EquipmentDefinition | null>(null);
  const [definitionToDelete, setDefinitionToDelete] = useState<EquipmentDefinition | null>(null);
  const [currentStock, setCurrentStock] = useState<Equipment[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    const currentDefinitions = getEquipmentDefinitions();
    setDefinitions(currentDefinitions.sort((a, b) => a.name.localeCompare(b.name)));
    const transactions = getTransactions();
    setAllTransactions(transactions);
    setCurrentStock(calculateStock(transactions));
    setIsLoading(false);
  };

  const uniqueCategories = useMemo(() => {
    const categoriesSet = new Set(definitions.map(def => def.defaultCategory).filter(Boolean) as string[]);
    return Array.from(categoriesSet).sort();
  }, [definitions]);

  const filteredDefinitions = useMemo(() => {
    return definitions.filter(def => {
      const nameMatch = nameFilter === "" || def.name.toLowerCase().includes(nameFilter.toLowerCase());
      const categoryMatch =
        categoryFilter === "" ? true : 
        categoryFilter === NO_CATEGORY_VALUE ? !def.defaultCategory : 
        (def.defaultCategory || "").toLowerCase() === categoryFilter.toLowerCase(); 
      return nameMatch && categoryMatch;
    }).sort((a, b) => a.name.localeCompare(b.name)); 
  }, [definitions, nameFilter, categoryFilter]);

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

  const TableSkeleton = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-28 mx-auto" /></TableHead>
            <TableHead><Skeleton className="h-5 w-20" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-5 mx-auto rounded-full" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                <Skeleton className="h-8 w-8 inline-block" />
                <Skeleton className="h-8 w-8 inline-block" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );


  return (
    <AlertDialog open={!!definitionToDelete} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setDefinitionToDelete(null);
      }
    }}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">إدارة أنواع التجهيزات</h1>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto">
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
            {/* The button below was removed as per user request */}
            {/* 
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="ml-2 h-5 w-5" />
              إضافة نوع تجهيز جديد
            </Button> 
            */}
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              البحث
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            <Input
              placeholder="البحث باسم نوع التجهيز..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="h-10"
            />
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="تصفية حسب الصنف الافتراضي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأصناف الافتراضية</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value={NO_CATEGORY_VALUE}>(بدون صنف افتراضي)</SelectItem> 
              </SelectContent>
            </Select>
          </CardContent>
        </Card>


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
            {isLoading ? <TableSkeleton /> : 
            filteredDefinitions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم نوع التجهيز</TableHead>
                      <TableHead>الصنف الافتراضي</TableHead>
                      <TableHead className="text-center">الكمية الحالية</TableHead>
                      <TableHead className="text-center">تم استلامه؟</TableHead>
                      <TableHead className="text-center">حد التنبيه الافتراضي</TableHead>
                      <TableHead>وحدة القياس</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDefinitions.map((def) => {
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
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <PackageSearch className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">
                  {nameFilter || categoryFilter ? "لا توجد أنواع تجهيزات تطابق معايير البحث الحالية." : "لم يتم تعريف أي أنواع تجهيزات بعد."}
                </p>
                <p className="text-sm">
                  {nameFilter || categoryFilter ? "حاول تعديل معايير البحث أو إزالتها." : "ابدأ بإضافة نوع تجهيز جديد لتنظيم مخزونك."}
                </p>
                {/* The button below was removed as per user request */}
                {/* 
                {!(nameFilter || categoryFilter) && (
                    <Button onClick={handleOpenAddDialog} className="mt-4">
                        <PlusCircle className="ml-2 h-5 w-5" />
                        إضافة نوع تجهيز جديد
                    </Button>
                )}
                */}
              </div>
            )}
          </CardContent>
          {!isLoading && filteredDefinitions.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
              يتم عرض {filteredDefinitions.length} {filteredDefinitions.length === 1 ? 'نوع تجهيز معرف' : filteredDefinitions.length === 2 ? 'نوعي تجهيز معرفين' : filteredDefinitions.length <=10 ? 'أنواع تجهيزات معرفة' : 'نوع تجهيز معرف'}.
            </CardFooter>
          )}
        </Card>

        <Separator className="my-8" />

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <History className="h-7 w-7 text-primary" />
                سجل عمليات التجهيزات
            </h2>
          </div>
          <HistoryTable />
        </div>


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

