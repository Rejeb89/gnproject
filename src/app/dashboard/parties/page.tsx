
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function PartiesPage() {
  // This page will be used to manage parties (جهات مستلمة/مرسلة)
  // Future functionalities:
  // - List all parties
  // - Add new party
  // - Edit existing party
  // - Delete party (with checks for existing transactions)

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">إدارة الجهات</h1>
      </div>
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            قائمة الجهات
          </CardTitle>
          <CardDescription>
            هذه الصفحة مخصصة لإدارة الجهات (المرسلة والمستلمة). سيتم تفعيل هذه الميزة قريبًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            حاليًا، لا توجد وظائف لإدارة الجهات بشكل مباشر هنا. الجهات تُضاف تلقائيًا عند تسجيل عمليات استلام أو تسليم جديدة.
          </p>
          <p className="text-muted-foreground mt-2">
            سيتم تطوير هذا القسم ليشمل الميزات التالية:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>عرض جميع الجهات المسجلة في النظام.</li>
            <li>إمكانية إضافة جهة جديدة يدويًا.</li>
            <li>تعديل أسماء الجهات القائمة.</li>
            <li>حذف جهات (مع مراعاة عدم حذف جهة مرتبطة بمعاملات قائمة).</li>
            <li>دمج جهات مكررة (اختياري).</li>
          </ul>
          <p className="mt-4 text-sm text-primary font-semibold">
            هذه الميزات ستساعد في الحفاظ على قائمة جهات نظيفة ومنظمة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
