
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Landmark } from "lucide-react";

export default function AppropriationsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Landmark className="h-8 w-8" />
          إدارة الاعتمادات المالية
        </h1>
        {/* Add buttons for actions like "Add Appropriation" later */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على الاعتمادات</CardTitle>
          <CardDescription>
            هذا القسم مخصص لعرض وإدارة الاعتمادات المالية المرصودة للمؤسسة. (قيد التطوير)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            سيتم هنا عرض تفاصيل الاعتمادات، مثل:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>إجمالي الاعتمادات المرصودة.</li>
            <li>الاعتمادات المستهلكة.</li>
            <li>الاعتمادات المتبقية.</li>
            <li>تفصيل الاعتمادات حسب البنود أو المشاريع.</li>
            <li>إمكانية إضافة اعتماد جديد أو تعديل اعتماد قائم.</li>
            <li>تقارير حول استهلاك الاعتمادات.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Placeholder for table or list of appropriations */}
      <Card>
        <CardHeader>
            <CardTitle>قائمة الاعتمادات</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-center py-10">
                سيتم عرض قائمة الاعتمادات هنا. (قيد التطوير)
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
