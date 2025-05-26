
// src/app/dashboard/calendar/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { CalendarDays, PlusCircle } from "lucide-react";

export default function CalendarPage() {
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-8 w-8" />
          الروزنامة
        </h1>
        <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddEventDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="ml-2 h-5 w-5" />
              إضافة حدث جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>إضافة حدث جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الحدث الجديد. (النموذج قيد التطوير)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {/* سيتم وضع نموذج إدخال الحدث هنا لاحقًا */}
              <p className="text-muted-foreground text-center">نموذج إضافة الحدث سيتم تطويره هنا.</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                  <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <Button type="submit" disabled> {/* تعطيل الزر حاليًا */}
                حفظ الحدث
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>عرض الروزنامة</CardTitle>
          <CardDescription>
            سيتم هنا عرض الروزنامة الفعلية (شهرية/أسبوعية/يومية).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 border-2 border-dashed border-muted-foreground/50 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">مكون الروزنامة سيعرض هنا</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الميزات المخطط لها</CardTitle>
          <CardDescription>
            هذا القسم مخصص لعرض وإدارة الأحداث والمهام المتعلقة بالروزنامة. سيتم تطوير الميزات لاحقًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>عرض روزنامة شهرية/أسبوعية/يومية.</li>
            <li>إضافة أحداث جديدة (مثل مواعيد الصيانة، المهام الخاصة).</li>
            <li>تعديل وحذف الأحداث.</li>
            <li>إمكانية ربط الأحداث بالتجهيزات أو وسائل النقل.</li>
            <li>تنبيهات وتذكيرات بالأحداث القادمة.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
