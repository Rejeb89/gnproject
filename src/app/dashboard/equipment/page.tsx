
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function EquipmentManagementPage() {
  // This page will be used to manage equipment types/definitions
  // Future functionalities:
  // - List all equipment types and their categories
  // - Add new equipment type (name, default category, default low stock threshold)
  // - Edit existing equipment type details
  // - Delete equipment type (with checks for existing transactions)

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">إدارة التجهيزات</h1>
      </div>
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            قائمة أنواع التجهيزات
          </CardTitle>
          <CardDescription>
            هذه الصفحة مخصصة لإدارة أنواع التجهيزات الموجودة في النظام. سيتم تفعيل هذه الميزة قريبًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            حاليًا، يتم إضافة أسماء التجهيزات وأصنافها تلقائيًا عند تسجيل عمليات استلام جديدة.
          </p>
          <p className="text-muted-foreground mt-2">
            سيتم تطوير هذا القسم ليشمل الميزات التالية:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>عرض جميع أنواع التجهيزات المسجلة وأصنافها.</li>
            <li>إمكانية إضافة نوع تجهيز جديد يدويًا مع تحديد صنفه الافتراضي (إن وجد).</li>
            <li>تعديل أسماء وأصناف التجهيزات القائمة.</li>
            <li>إمكانية تحديد/تعديل حد التنبيه الافتراضي للمخزون المنخفض لكل نوع تجهيز.</li>
            <li>ربط التجهيزات بوحدات قياس (إن لزم الأمر).</li>
            <li>حذف أنواع تجهيزات (مع مراعاة عدم حذف نوع مرتبط بمعاملات قائمة).</li>
          </ul>
          <p className="mt-4 text-sm text-primary font-semibold">
            هذه الميزات ستساعد في الحفاظ على قائمة تجهيزات دقيقة ومنظمة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
