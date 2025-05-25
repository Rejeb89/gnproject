
// src/app/dashboard/vehicles/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car } from "lucide-react";

export default function VehiclesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Car className="h-8 w-8" />
          إدارة وسائل النقل الإدارية
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة</CardTitle>
          <CardDescription>
            هذا القسم مخصص لإدارة وسائل النقل الإدارية. سيتم تطوير الميزات لاحقًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            الميزات المخطط لها:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>تسجيل معلومات المركبات (النوع، الرقم المنجمي، إلخ).</li>
            <li>تتبع حالة المركبات (متوفرة، في مهمة، صيانة).</li>
            <li>إدارة استهلاك الوقود.</li>
            <li>تسجيل الصيانة الدورية.</li>
            <li>إدارة مهام المركبات.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
