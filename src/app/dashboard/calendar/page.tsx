
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "@/components/ui/dialog"; // Renamed DialogDescription
import { CalendarDays, PlusCircle, Edit2, Trash2, ListChecks, BellRing, Clock } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/store";
import { CalendarEventForm, type CalendarEventFormValues } from "@/components/forms/calendar-event-form";
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
import { format, formatDistanceToNowStrict } from "date-fns";
import { arSA } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    setEvents(getCalendarEvents().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleOpenAddDialog = () => {
    setEditingEvent(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (values: CalendarEventFormValues) => {
    try {
      const eventData: Omit<CalendarEvent, 'id'> = {
        title: values.title,
        date: values.date.toISOString(),
        description: values.description,
        reminderUnit: values.reminderUnit === "none" ? undefined : values.reminderUnit,
        reminderValue: values.reminderUnit === "none" || !values.reminderValue ? undefined : values.reminderValue,
      };

      if (editingEvent) {
        updateCalendarEvent({ ...editingEvent, ...eventData });
        toast({ title: "تم التحديث بنجاح", description: `تم تحديث الحدث: ${values.title}` });
      } else {
        addCalendarEvent(eventData);
        toast({ title: "تمت الإضافة بنجاح", description: `تم إضافة الحدث: ${values.title}` });
      }
      loadEvents();
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast({ title: "حدث خطأ", description: "لم يتم حفظ الحدث.", variant: "destructive" });
    }
  };
  
  const handleDeleteEventConfirm = () => {
    if (!eventToDelete) return;
    try {
      deleteCalendarEvent(eventToDelete.id);
      toast({ title: "تم الحذف بنجاح", description: `تم حذف الحدث: ${eventToDelete.title}` });
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "حدث خطأ", description: "لم يتم حذف الحدث.", variant: "destructive" });
    }
    setEventToDelete(null);
  };

  const getReminderText = (event: CalendarEvent): string | null => {
    if (event.reminderUnit && event.reminderUnit !== "none" && event.reminderValue) {
      let unitText = "";
      switch (event.reminderUnit) {
        case "hours": unitText = event.reminderValue === 1 ? "ساعة" : event.reminderValue === 2 ? "ساعتين" : event.reminderValue <= 10 ? "ساعات" : "ساعة"; break;
        case "days": unitText = event.reminderValue === 1 ? "يوم" : event.reminderValue === 2 ? "يومين" : event.reminderValue <= 10 ? "أيام" : "يوم"; break;
        case "weeks": unitText = event.reminderValue === 1 ? "أسبوع" : event.reminderValue === 2 ? "أسبوعين" : event.reminderValue <= 10 ? "أسابيع" : "أسبوع"; break;
      }
      return `تذكير قبل بـ ${event.reminderValue} ${unitText}`;
    }
    return null;
  };


  return (
    <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            الروزنامة
          </h1>
          <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
            <PlusCircle className="ml-2 h-5 w-5" />
            إضافة حدث جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>عرض الروزنامة (قيد التطوير)</CardTitle>
            <CardDescription>
              سيتم هنا عرض الروزنامة الفعلية (شهرية/أسبوعية/يومية). حاليًا، الأحداث تُعرض كقائمة أدناه.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 border-2 border-dashed border-muted-foreground/50 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">مكون الروزنامة المرئي سيعرض هنا (قيد التطوير)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6"/>
              قائمة الأحداث المسجلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map(event => {
                  const reminderText = getReminderText(event);
                  const eventDate = new Date(event.date);
                  const isPast = eventDate < new Date();
                  return (
                    <Card key={event.id} className={`shadow-sm ${isPast ? 'opacity-60 bg-muted/30' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {format(eventDate, "eeee, d MMMM yyyy 'الساعة' HH:mm", { locale: arSA })}
                                {isPast && <Badge variant="outline" className="text-xs px-1.5 py-0.5">منتهي</Badge>}
                            </CardDescription>
                            {reminderText && (
                                <Badge variant="secondary" className="mt-1 text-xs px-1.5 py-0.5">
                                    <BellRing className="h-3 w-3 mr-1" />
                                    {reminderText}
                                </Badge>
                            )}
                          </div>
                          <div className="flex space-x-1 rtl:space-x-reverse">
                             <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(event)} title="تعديل الحدث">
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="حذف الحدث" onClick={() => setEventToDelete(event)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                          </div>
                        </div>
                      </CardHeader>
                      {event.description && (
                          <CardContent className="pt-2">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                          </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد أحداث مسجلة حاليًا.</p>
            )}
          </CardContent>
           {events.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground pt-4">
              يتم عرض {events.length} {events.length === 1 ? 'حدث' : events.length === 2 ? 'حدثين' : events.length <=10 ? 'أحداث' : 'حدث'}.
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الميزات المخطط لها (قيد التطوير)</CardTitle>
            <CardDescription>
              هذا القسم مخصص لعرض وإدارة الأحداث والمهام المتعلقة بالروزنامة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li><span className="font-semibold text-green-600">[تم]</span> إضافة أحداث جديدة (عنوان, تاريخ, وصف, إعدادات تذكير).</li>
              <li><span className="font-semibold text-green-600">[تم]</span> تعديل وحذف الأحداث.</li>
              <li><span className="font-semibold text-amber-600">[جزئيًا]</span> تنبيهات وتذكيرات بالأحداث القادمة (تعمل عندما يكون التطبيق مفتوحًا).</li>
              <li>عرض روزنامة شهرية/أسبوعية/يومية مرئية مع عرض الأحداث عليها.</li>
              <li>إمكانية ربط الأحداث بالتجهيزات أو وسائل النقل.</li>
            </ul>
          </CardContent>
        </Card>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[525px]"> {/* Increased width for reminder fields */}
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'تعديل الحدث' : 'إضافة حدث جديد'}</DialogTitle>
              <DialogDesc> {/* Use DialogDesc alias */}
                {editingEvent ? 'قم بتحديث تفاصيل الحدث.' : 'أدخل تفاصيل الحدث الجديد.'}
              </DialogDesc>
            </DialogHeader>
            <CalendarEventForm
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormDialogOpen(false)}
              initialData={editingEvent}
            />
          </DialogContent>
        </Dialog>

        {eventToDelete && (
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                  هل أنت متأكد أنك تريد حذف الحدث "{eventToDelete.title}"؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEventToDelete(null)}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleDeleteEventConfirm}
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
