
"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link'; // Import Link
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Building, Edit2, Trash2, Users, Send, Download, Eye } from "lucide-react";
import type { Party, Transaction } from "@/lib/types";
import { getParties, addParty, updateParty, deleteParty, getTransactions } from "@/lib/store";
import { PartyForm, type PartyFormValues } from "@/components/forms/party-form";
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

type PartyViewType = "all" | "senders" | "receivers";

export default function PartiesPage() {
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
  const [partyFilterType, setPartyFilterType] = useState<PartyViewType>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadPartiesAndTransactions();
  }, []);

  const loadPartiesAndTransactions = () => {
    setAllParties(getParties());
    setTransactions(getTransactions());
  };

  const sendingParties = useMemo(() => {
    const senderNames = new Set(transactions.filter(tx => tx.type === 'receive').map(tx => tx.party));
    return allParties.filter(p => senderNames.has(p.name));
  }, [allParties, transactions]);

  const receivingParties = useMemo(() => {
    const receiverNames = new Set(transactions.filter(tx => tx.type === 'dispatch').map(tx => tx.party));
    return allParties.filter(p => receiverNames.has(p.name));
  }, [allParties, transactions]);

  const partiesToDisplay = useMemo(() => {
    if (partyFilterType === "senders") return sendingParties;
    if (partyFilterType === "receivers") return receivingParties;
    return allParties;
  }, [partyFilterType, allParties, sendingParties, receivingParties]);

  const handleOpenAddDialog = () => {
    setEditingParty(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (party: Party) => {
    setEditingParty(party);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (values: PartyFormValues) => {
    if (editingParty) {
      const result = updateParty(editingParty.id, values.name);
      if (result.success) {
        toast({ title: "تم التحديث بنجاح", description: `تم تحديث اسم الجهة إلى: ${values.name}` });
        loadPartiesAndTransactions();
        setIsFormDialogOpen(false);
      } else {
        toast({ title: "خطأ في التحديث", description: result.message || "لم يتم تحديث الجهة.", variant: "destructive" });
      }
    } else {
      const existingParty = allParties.find(p => p.name.toLowerCase() === values.name.toLowerCase());
      if (existingParty) {
        toast({ title: "خطأ في الإضافة", description: `الجهة بالاسم "${values.name}" موجودة بالفعل.`, variant: "destructive" });
        return;
      }
      addParty(values.name);
      toast({ title: "تمت الإضافة بنجاح", description: `تم إضافة الجهة: ${values.name}` });
      loadPartiesAndTransactions();
      setIsFormDialogOpen(false);
    }
  };

  const handleDeletePartyConfirm = () => {
    if (!partyToDelete) return;

    const result = deleteParty(partyToDelete.id);
    if (result.success) {
      toast({ title: "تم الحذف بنجاح", description: `تم حذف الجهة: ${partyToDelete.name}` });
      loadPartiesAndTransactions();
    } else {
      toast({ title: "لا يمكن الحذف", description: result.message || "لم يتم حذف الجهة.", variant: "destructive" });
    }
    setPartyToDelete(null);
  };

  const getFilterTitle = (filter: PartyViewType) => {
    if (filter === "senders") return "الجهات المرسِلة";
    if (filter === "receivers") return "الجهات المتسلمة";
    return "كل الجهات المسجلة";
  };

  const getFilterDescription = (filter: PartyViewType) => {
    if (filter === "senders") return "قائمة بالجهات التي قامت بإرسال تجهيزات إلى المخزن.";
    if (filter === "receivers") return "قائمة بالجهات التي قامت بتسلم تجهيزات من المخزن.";
    return "إدارة جميع الجهات المتعامل معها في النظام.";
  };
  
  const getEmptyStateMessage = (filter: PartyViewType) => {
    if (filter === "senders") return "لا توجد جهات قامت بإرسال تجهيزات بعد.";
    if (filter === "receivers") return "لا توجد جهات قامت بتسلم تجهيزات بعد.";
    return "لم يتم تسجيل أي جهات بعد.";
  };

  const getFilterIcon = (filter: PartyViewType) => {
    if (filter === "senders") return <Send className="h-6 w-6" />;
    if (filter === "receivers") return <Download className="h-6 w-6" />;
    return <Building className="h-6 w-6" />;
  }

  return (
    <AlertDialog open={!!partyToDelete} onOpenChange={(isOpen) => !isOpen && setPartyToDelete(null)}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">إدارة الجهات</h1>
          <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
            <PlusCircle className="ml-2 h-5 w-5" />
            إضافة جهة جديدة
          </Button>
        </div>

        <Card className="shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        {getFilterIcon(partyFilterType)}
                        {getFilterTitle(partyFilterType)}
                    </CardTitle>
                    <CardDescription>
                        {getFilterDescription(partyFilterType)}
                    </CardDescription>
                </div>
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                    <Select value={partyFilterType} onValueChange={(value) => setPartyFilterType(value as PartyViewType)}>
                        <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="تصفية عرض الجهات" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" /> كل الجهات
                                </div>
                            </SelectItem>
                            <SelectItem value="senders">
                                <div className="flex items-center gap-2">
                                    <Send className="h-4 w-4" /> الجهات المرسِلة
                                </div>
                            </SelectItem>
                            <SelectItem value="receivers">
                                <div className="flex items-center gap-2">
                                    <Download className="h-4 w-4" /> الجهات المتسلمة
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
              {partiesToDisplay.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الجهة</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partiesToDisplay.map((party) => (
                        <TableRow key={party.id}>
                          <TableCell className="font-medium">
                            <Link href={`/dashboard/parties/${party.id}`} className="text-primary hover:underline hover:text-primary/80 flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              {party.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(party)} title="تعديل">
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="حذف" onClick={() => setPartyToDelete(party)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p className="text-lg">{getEmptyStateMessage(partyFilterType)}</p>
                  {partyFilterType === 'all' && (
                    <Button onClick={handleOpenAddDialog} className="mt-4">
                      <PlusCircle className="ml-2 h-5 w-5" />
                      ابدأ بإضافة جهة جديدة
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {partiesToDisplay.length > 0 && (
              <CardFooter className="text-sm text-muted-foreground">
                يتم عرض {partiesToDisplay.length}{" "}
                {partiesToDisplay.length === 1 ? 'جهة' : 
                 partiesToDisplay.length === 2 ? 'جهتين' : 
                 partiesToDisplay.length > 2 && partiesToDisplay.length <= 10 ? 'جهات' : 'جهة'}
                {partyFilterType === "all" && " مسجلة"}
                {partyFilterType === "senders" && " مرسِلة"}
                {partyFilterType === "receivers" && " متسلمة"}.
              </CardFooter>
            )}
        </Card>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingParty ? 'تعديل جهة' : 'إضافة جهة جديدة'}</DialogTitle>
              <DialogDescription>
                {editingParty ? 'قم بتحديث اسم الجهة.' : 'أدخل اسم الجهة الجديدة.'}
              </DialogDescription>
            </DialogHeader>
            <PartyForm
              onSubmit={handleFormSubmit}
              initialData={editingParty}
              existingPartyNames={allParties.map(p => p.name).filter(name => name !== editingParty?.name)}
            />
          </DialogContent>
        </Dialog>

        {partyToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف الجهة "{partyToDelete.name}"؟
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPartyToDelete(null)}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePartyConfirm}
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
    
