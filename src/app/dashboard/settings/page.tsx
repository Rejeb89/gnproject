"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function SettingsPage() {
  // For now, this page is a placeholder.
  // User management functionality will be added later, likely integrating Firebase Auth.

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">إعدادات النظام</h1>
      </div>
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            إدارة المستخدمين
          </CardTitle>
          <CardDescription>
            هذه الصفحة مخصصة لإدارة المستخدمين والصلاحيات. سيتم تفعيل هذه الميزة قريبًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            حاليًا، لا توجد وظائف لإدارة المستخدمين. سيتم تطوير هذا القسم ليشمل:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>إنشاء حسابات موظفين جديدة.</li>
            <li>تعديل بيانات الموظفين.</li>
            <li>تعيين صلاحيات للموظفين.</li>
            <li>إعادة تعيين كلمات المرور (إذا تم استخدام نظام مصادقة يدعم ذلك).</li>
          </ul>
          <p className="mt-4 text-sm text-primary font-semibold">
            لأغراض الأمان والفعالية، يفضل دمج هذه الوظيفة مع نظام مصادقة مثل Firebase Authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
