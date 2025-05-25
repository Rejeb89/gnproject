
// src/app/dashboard/calendar/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-8 w-8" />
          الروزنامة
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على الروزنامة</CardTitle>
          <CardDescription>
            هذا القسم مخصص لعرض وإدارة الأحداث والمهام المتعلقة بالروزنامة. سيتم تطوير الميزات لاحقًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            الميزات المخطط لها:
          </p>
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
