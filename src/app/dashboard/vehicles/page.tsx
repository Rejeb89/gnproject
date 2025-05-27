
"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Car, PlusCircle, Edit2, Trash2, PackageSearch, Wrench, Route, Fuel, ListChecks, ChevronDown, StickyNote, Thermometer, DollarSign, SprayCan, ClipboardList, CalendarClock } from "lucide-react";
import type { Vehicle, FuelEntry, MaintenanceRecord } from "@/lib/types";
import { getVehicles, addVehicle, updateVehicle, deleteVehicle, addFuelEntryToVehicle, addMaintenanceRecordToVehicle } from "@/lib/store";
import { VehicleForm, type VehicleFormValues } from "@/components/forms/vehicle-form";
import { FuelEntryForm, type FuelEntryFormValues } from "@/components/forms/fuel-entry-form";
import { MaintenanceRecordForm, type MaintenanceRecordFormValues } from "@/components/forms/maintenance-record-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function VehiclesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  
  const [isFuelFormOpen, setIsFuelFormOpen] = useState(false);
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [selectedVehicleForEntry, setSelectedVehicleForEntry] = useState<Vehicle | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setIsLoading(true);
    setVehicles(getVehicles().sort((a,b) => a.type.localeCompare(b.type) || a.registrationNumber.localeCompare(b.registrationNumber)));
    setIsLoading(false);
  };

  const handleOpenAddVehicleDialog = () => {
    setEditingVehicle(null);
    setIsVehicleFormOpen(true);
  };

  const handleOpenEditVehicleDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsVehicleFormOpen(true);
  };

  const handleVehicleFormSubmit = (values: VehicleFormValues) => {
    try {
      if (editingVehicle) {
        updateVehicle({ 
            ...editingVehicle, 
            ...values, 
            fuelEntries: editingVehicle.fuelEntries || [], 
            maintenanceRecords: editingVehicle.maintenanceRecords || []
        });
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
      setIsVehicleFormOpen(false);
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

  const handleFuelFormSubmit = (values: FuelEntryFormValues) => {
    if (!selectedVehicleForEntry) return;
    try {
      addFuelEntryToVehicle(selectedVehicleForEntry.id, {
        ...values,
        date: values.date.toISOString(),
      });
      toast({ title: "تمت إضافة بيانات الوقود بنجاح."});
      loadVehicles();
      setIsFuelFormOpen(false);
      setSelectedVehicleForEntry(null);
    } catch (error) {
      console.error("Error adding fuel entry:", error);
      toast({ title: "حدث خطأ", description: "لم يتم إضافة بيانات الوقود.", variant: "destructive" });
    }
  };

  const handleMaintenanceFormSubmit = (values: MaintenanceRecordFormValues) => {
    if (!selectedVehicleForEntry) return;
    try {
      // Cost is no longer directly passed from the form
      const maintenanceData: Omit<MaintenanceRecord, 'id' | 'cost'> & { cost?: number } = {
        ...values,
        date: values.date.toISOString(),
        nextDueDate: values.nextDueDate ? values.nextDueDate.toISOString() : undefined,
      };
      // If cost was part of the form values and we wanted to keep it optional
      // if (values.cost !== undefined) {
      //   maintenanceData.cost = values.cost;
      // }
      addMaintenanceRecordToVehicle(selectedVehicleForEntry.id, maintenanceData as Omit<MaintenanceRecord, 'id'>);
      toast({ title: "تمت إضافة سجل الصيانة بنجاح."});
      loadVehicles();
      setIsMaintenanceFormOpen(false);
      setSelectedVehicleForEntry(null);
    } catch (error) {
      console.error("Error adding maintenance record:", error);
      toast({ title: "حدث خطأ", description: "لم يتم إضافة سجل الصيانة.", variant: "destructive" });
    }
  };
  
  const TableSkeleton = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-5 w-8" /></TableHead>
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
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
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

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "-";
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} د.ت`;
  };

  const latestOdometer = (vehicle: Vehicle): number | undefined => {
    const allReadings = [
        ...(vehicle.fuelEntries || []).map(fe => fe.odometerReading),
        ...(vehicle.maintenanceRecords || []).map(mr => mr.odometerReading).filter(Boolean) as number[],
    ];
    if (allReadings.length === 0) return undefined;
    return Math.max(...allReadings);
  }


  return (
    <>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Car className="h-8 w-8" />
            إدارة وسائل النقل الإدارية
          </h1>
          <Button onClick={handleOpenAddVehicleDialog} className="w-full sm:w-auto">
            <PlusCircle className="ml-2 h-5 w-5" />
            إضافة مركبة جديدة
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>قائمة المركبات المسجلة</CardTitle>
            <CardDescription>
              عرض وإدارة معلومات المركبات الإدارية وسجلاتها.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? <TableSkeleton/> :
            vehicles.length > 0 ? (
            <div className="border-t"> {/* Add top border for the accordion container */}
              <Accordion type="single" collapsible className="w-full">
                {vehicles.map((vehicle) => (
                  <AccordionItem value={vehicle.id} key={vehicle.id} className="border-b last:border-b-0">
                    <AccordionTrigger className="hover:no-underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm">
                       <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] items-center w-full p-4 gap-x-4 text-sm">
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
                            <span className="font-medium truncate" title={vehicle.type}>{vehicle.type}</span>
                            <span className="truncate" title={vehicle.registrationNumber}>{vehicle.registrationNumber}</span>
                            <span className="truncate" title={vehicle.owningParty}>{vehicle.owningParty}</span>
                            <span className="text-center truncate" title={vehicle.fuelAllowanceLiters?.toLocaleString()}>{vehicle.fuelAllowanceLiters?.toLocaleString() || "-"} لتر</span>
                            <div className="flex justify-end items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenEditVehicleDialog(vehicle); }} title="تعديل بيانات المركبة">
                                    <Edit2 className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" title="حذف المركبة" onClick={(e) => { e.stopPropagation(); setVehicleToDelete(vehicle); }}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/30 p-0">
                        <div className="p-4 space-y-6">
                            {/* Fuel Entries Section */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-md font-semibold flex items-center gap-2"><Fuel className="h-5 w-5 text-green-600"/>سجل تعبئة الوقود</h4>
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedVehicleForEntry(vehicle); setIsFuelFormOpen(true); }}>
                                        <PlusCircle className="ml-2 h-4 w-4"/> إضافة تعبئة
                                    </Button>
                                </div>
                                {vehicle.fuelEntries && vehicle.fuelEntries.length > 0 ? (
                                    <div className="overflow-x-auto border rounded-md">
                                        <Table className="bg-background">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>التاريخ</TableHead>
                                                    <TableHead className="text-center">عداد الكيلومترات</TableHead>
                                                    <TableHead className="text-center">الكمية (لتر)</TableHead>
                                                    <TableHead className="text-center">سعر اللتر (د.ت)</TableHead>
                                                    <TableHead className="text-center">التكلفة الإجمالية (د.ت)</TableHead>
                                                    <TableHead>ملاحظات</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {vehicle.fuelEntries.map(entry => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell>{format(parseISO(entry.date), "dd/MM/yyyy", { locale: arSA })}</TableCell>
                                                        <TableCell className="text-center">{entry.odometerReading.toLocaleString()}</TableCell>
                                                        <TableCell className="text-center">{entry.litersFilled.toLocaleString()}</TableCell>
                                                        <TableCell className="text-center">{formatCurrency(entry.costPerLiter)}</TableCell>
                                                        <TableCell className="text-center">{formatCurrency(entry.totalCost)}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]" title={entry.notes}>{entry.notes || "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : <p className="text-sm text-muted-foreground text-center py-2">لا توجد سجلات تعبئة وقود لهذه المركبة.</p>}
                            </div>

                            {/* Maintenance Records Section */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-md font-semibold flex items-center gap-2"><Wrench className="h-5 w-5 text-blue-600"/>سجل الصيانة</h4>
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedVehicleForEntry(vehicle); setIsMaintenanceFormOpen(true); }}>
                                        <PlusCircle className="ml-2 h-4 w-4"/> إضافة صيانة
                                    </Button>
                                </div>
                                {vehicle.maintenanceRecords && vehicle.maintenanceRecords.length > 0 ? (
                                     <div className="overflow-x-auto border rounded-md">
                                        <Table className="bg-background">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>التاريخ</TableHead>
                                                    <TableHead>نوع الصيانة</TableHead>
                                                    <TableHead>الوصف</TableHead>
                                                    <TableHead className="text-center">عداد الكيلومترات</TableHead>
                                                    {/* <TableHead className="text-center">التكلفة (د.ت)</TableHead> */} {/* Cost column removed */}
                                                    <TableHead>الصيانة القادمة</TableHead>
                                                    <TableHead>ملاحظات</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {vehicle.maintenanceRecords.map(record => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>{format(parseISO(record.date), "dd/MM/yyyy", { locale: arSA })}</TableCell>
                                                        <TableCell className="font-medium truncate max-w-[150px]" title={record.type}>{record.type}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={record.description}>{record.description}</TableCell>
                                                        <TableCell className="text-center">{record.odometerReading?.toLocaleString() || "-"}</TableCell>
                                                        {/* <TableCell className="text-center">{formatCurrency(record.cost)}</TableCell> */} {/* Cost cell removed */}
                                                        <TableCell className="text-xs">
                                                            {record.nextDueDate && <div>تاريخ: {format(parseISO(record.nextDueDate), "dd/MM/yy", { locale: arSA })}</div>}
                                                            {record.nextDueOdometer && <div>عداد: {record.nextDueOdometer.toLocaleString()} كم</div>}
                                                            {!(record.nextDueDate || record.nextDueOdometer) && "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]" title={record.notes}>{record.notes || "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : <p className="text-sm text-muted-foreground text-center py-2">لا توجد سجلات صيانة لهذه المركبة.</p>}
                            </div>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <PackageSearch className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">لم يتم تسجيل أي مركبات بعد.</p>
                <p className="text-sm">ابدأ بإضافة مركبة جديدة.</p>
                <Button onClick={handleOpenAddVehicleDialog} className="mt-4">
                    <PlusCircle className="ml-2 h-5 w-5" />
                    إضافة مركبة جديدة
                </Button>
              </div>
            )}
          </CardContent>
          {!isLoading && vehicles.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground pt-4">
              يتم عرض {vehicles.length} {vehicles.length === 1 ? 'مركبة' : vehicles.length === 2 ? 'مركبتين' : vehicles.length <=10 ? 'مركبات' : 'مركبة'}.
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Vehicle Form Dialog */}
      <Dialog open={isVehicleFormOpen} onOpenChange={(isOpen) => {
          setIsVehicleFormOpen(isOpen);
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
            onSubmit={handleVehicleFormSubmit}
            onCancel={() => {
              setIsVehicleFormOpen(false);
              setEditingVehicle(null);
            }}
            initialData={editingVehicle}
            existingRegistrationNumbers={vehicles.map(v => v.registrationNumber).filter(regNum => regNum !== editingVehicle?.registrationNumber)}
          />
        </DialogContent>
      </Dialog>

      {/* Fuel Entry Form Dialog */}
      <Dialog open={isFuelFormOpen} onOpenChange={(isOpen) => {
          setIsFuelFormOpen(isOpen);
          if(!isOpen) setSelectedVehicleForEntry(null);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة تعبئة وقود للمركبة: {selectedVehicleForEntry?.type} - {selectedVehicleForEntry?.registrationNumber}</DialogTitle>
          </DialogHeader>
          {selectedVehicleForEntry && (
            <FuelEntryForm 
                onSubmit={handleFuelFormSubmit} 
                onCancel={() => { setIsFuelFormOpen(false); setSelectedVehicleForEntry(null);}}
                initialOdometer={latestOdometer(selectedVehicleForEntry)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance Record Form Dialog */}
       <Dialog open={isMaintenanceFormOpen} onOpenChange={(isOpen) => {
          setIsMaintenanceFormOpen(isOpen);
          if(!isOpen) setSelectedVehicleForEntry(null);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة سجل صيانة للمركبة: {selectedVehicleForEntry?.type} - {selectedVehicleForEntry?.registrationNumber}</DialogTitle>
          </DialogHeader>
          {selectedVehicleForEntry && (
            <MaintenanceRecordForm 
                onSubmit={handleMaintenanceFormSubmit} 
                onCancel={() => { setIsMaintenanceFormOpen(false); setSelectedVehicleForEntry(null);}}
                initialOdometer={latestOdometer(selectedVehicleForEntry)}
            />
          )}
        </DialogContent>
      </Dialog>


      {/* Delete Vehicle Confirmation Dialog */}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={(isOpen) => !isOpen && setVehicleToDelete(null)}>
        {vehicleToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف المركبة "{vehicleToDelete.type} - {vehicleToDelete.registrationNumber}"؟
                سيتم حذف جميع سجلات الوقود والصيانة المرتبطة بها أيضًا. لا يمكن التراجع عن هذا الإجراء.
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

