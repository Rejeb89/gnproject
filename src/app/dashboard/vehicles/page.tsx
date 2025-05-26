
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, PlusCircle, Edit2, Trash2, PackageSearch, Wrench, Route, Fuel } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from "@/lib/store";
import { VehicleForm, type VehicleFormValues } from "@/components/forms/vehicle-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setIsLoading(true);
    setVehicles(getVehicles().sort((a,b) => a.type.localeCompare(b.type) || a.registrationNumber.localeCompare(b.registrationNumber)));
    setIsLoading(false);
  };

  const handleOpenAddDialog = () => {
    setEditingVehicle(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (values: VehicleFormValues) => {
    try {
      if (editingVehicle) {
        updateVehicle({ ...editingVehicle, ...values });
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات المركبة: ${values.type} - ${values.registrationNumber}`,
        });
      } else {
        addVehicle(values);
        toast({
          title: "تمت الإضافة بنجاح",
          description: `تمت إضافة المركبة: ${values.type} - ${values.registrationNumber}`,
        });
      }
      loadVehicles();
      setIsFormDialogOpen(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم حفظ بيانات المركبة.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVehicleConfirm = () => {
    if (!vehicleToDelete) return;
    try {
      deleteVehicle(vehicleToDelete.id);
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف المركبة: ${vehicleToDelete.type} - ${vehicleToDelete.registrationNumber}`,
      });
      loadVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم حذف المركبة.",
        variant: "destructive",
      });
    }
    setVehicleToDelete(null);
  };
  
  const TableSkeleton = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-28 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
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
    <>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Car className="h-8 w-8" />
            إدارة وسائل النقل الإدارية
          </h1>
          <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
            <PlusCircle className="ml-2 h-5 w-5" />
            إضافة مركبة جديدة
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>قائمة المركبات المسجلة</CardTitle>
            <CardDescription>
              عرض وإدارة معلومات المركبات الإدارية.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeleton/> :
            vehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نوع المركبة</TableHead>
                      <TableHead>الرقم المنجمي</TableHead>
                      <TableHead>الجهة التابعة لها</TableHead>
                      <TableHead className="text-center">مقرر المحروقات (لتر)</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.type}</TableCell>
                        <TableCell>{vehicle.registrationNumber}</TableCell>
                        <TableCell>{vehicle.owningParty}</TableCell>
                        <TableCell className="text-center">
                          {vehicle.fuelAllowanceLiters?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(vehicle)}
                            title="تعديل المركبة"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف المركبة"
                            onClick={() => setVehicleToDelete(vehicle)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <PackageSearch className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">لم يتم تسجيل أي مركبات بعد.</p>
                <p className="text-sm">ابدأ بإضافة مركبة جديدة.</p>
                <Button onClick={handleOpenAddDialog} className="mt-4">
                    <PlusCircle className="ml-2 h-5 w-5" />
                    إضافة مركبة جديدة
                </Button>
              </div>
            )}
          </CardContent>
          {!isLoading && vehicles.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
              يتم عرض {vehicles.length} {vehicles.length === 1 ? 'مركبة' : vehicles.length === 2 ? 'مركبتين' : vehicles.length <=10 ? 'مركبات' : 'مركبة'}.
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الميزات المخطط لها (قيد التطوير)</CardTitle>
            <CardDescription>
              هذا القسم مخصص للميزات المتقدمة لإدارة المركبات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>
                <span className="font-semibold text-green-600">[تم]</span> تسجيل معلومات المركبات (النوع، الرقم المنجمي، الجهة التابعة لها، مقرر المحروقات).
              </li>
              <li>
                <Wrench className="inline-block h-4 w-4 ml-1 text-primary" />
                تتبع حالة المركبات (متوفرة، في مهمة، صيانة).
              </li>
              <li>
                <Fuel className="inline-block h-4 w-4 ml-1 text-primary" />
                إدارة استهلاك الوقود.
              </li>
              <li>
                <Wrench className="inline-block h-4 w-4 ml-1 text-primary" />
                تسجيل الصيانة الدورية.
              </li>
              <li>
                <Route className="inline-block h-4 w-4 ml-1 text-primary" />
                إدارة مهام المركبات.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
          setIsFormDialogOpen(isOpen);
          if (!isOpen) setEditingVehicle(null);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'تعديل بيانات المركبة' : 'إضافة مركبة جديدة'}</DialogTitle>
            <DialogDesc>
              {editingVehicle ? 'قم بتحديث تفاصيل المركبة.' : 'أدخل تفاصيل المركبة الجديدة.'}
            </DialogDesc>
          </DialogHeader>
          <VehicleForm
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormDialogOpen(false);
              setEditingVehicle(null);
            }}
            initialData={editingVehicle}
            existingRegistrationNumbers={vehicles.map(v => v.registrationNumber).filter(regNum => regNum !== editingVehicle?.registrationNumber)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!vehicleToDelete} onOpenChange={(isOpen) => !isOpen && setVehicleToDelete(null)}>
        {vehicleToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف المركبة "{vehicleToDelete.type} - {vehicleToDelete.registrationNumber}"؟
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setVehicleToDelete(null)}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteVehicleConfirm}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                نعم، قم بالحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}
