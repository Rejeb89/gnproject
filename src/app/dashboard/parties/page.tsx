
"use client";

import { useEffect, useState } from 'react';
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
import { PlusCircle, Building, Edit2, Trash2, Users } from "lucide-react";
import type { Party } from "@/lib/types";
import { getParties, addParty, updateParty, deleteParty } from "@/lib/store";
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

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = () => {
    setParties(getParties());
  };

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
      // Edit existing party
      const result = updateParty(editingParty.id, values.name);
      if (result.success) {
        toast({ title: "تم التحديث بنجاح", description: `تم تحديث اسم الجهة إلى: ${values.name}` });
        loadParties();
        setIsFormDialogOpen(false);
      } else {
        toast({ title: "خطأ في التحديث", description: result.message || "لم يتم تحديث الجهة.", variant: "destructive" });
      }
    } else {
      // Add new party
      // Check for uniqueness before adding (PartyForm already does this via existingNames prop)
      const existingParty = parties.find(p => p.name.toLowerCase() === values.name.toLowerCase());
      if (existingParty) {
        toast({ title: "خطأ في الإضافة", description: `الجهة بالاسم "${values.name}" موجودة بالفعل.`, variant: "destructive" });
        return;
      }
      addParty(values.name);
      toast({ title: "تمت الإضافة بنجاح", description: `تم إضافة الجهة: ${values.name}` });
      loadParties();
      setIsFormDialogOpen(false);
    }
  };

  const handleDeletePartyConfirm = () => {
    if (!partyToDelete) return;

    const result = deleteParty(partyToDelete.id);
    if (result.success) {
      toast({ title: "تم الحذف بنجاح", description: `تم حذف الجهة: ${partyToDelete.name}` });
      loadParties();
    } else {
      toast({ title: "لا يمكن الحذف", description: result.message || "لم يتم حذف الجهة.", variant: "destructive" });
    }
    setPartyToDelete(null); // Close AlertDialog
  };

  return (
    <AlertDialog open={!!partyToDelete} onOpenChange={(isOpen) => !isOpen && setPartyToDelete(null)}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">إدارة الجهات</h1>
          <Button onClick={handleOpenAddDialog}>
            <PlusCircle className="ml-2 h-5 w-5" />
            إضافة جهة جديدة
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              قائمة الجهات المسجلة
            </CardTitle>
            <CardDescription>
              إدارة الجهات (المرسلة والمستلمة) المتعامل معها في النظام.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الجهة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-medium">{party.name}</TableCell>
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
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">لم يتم تسجيل أي جهات بعد.</p>
                <p>ابدأ بإضافة جهة جديدة.</p>
              </div>
            )}
          </CardContent>
          {parties.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
              يتم عرض {parties.length} {parties.length === 1 ? 'جهة مسجلة' : parties.length === 2 ? 'جهتين مسجلتين' : parties.length <= 10 ? 'جهات مسجلة' : 'جهة مسجلة'}.
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
              existingPartyNames={parties.map(p => p.name).filter(name => name !== editingParty?.name)}
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
