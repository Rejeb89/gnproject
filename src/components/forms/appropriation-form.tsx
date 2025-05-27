
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { appropriationFormSchema, type AppropriationFormValues } from "./appropriation-form-schema";
import type { Appropriation } from "@/lib/types";
import { Save, Coins } from "lucide-react";

interface AppropriationFormProps {
  onSubmit: (values: AppropriationFormValues) => void;
  initialData?: Appropriation | null;
  existingNames?: string[];
  onCancel?: () => void; // Optional cancel handler
}

export function AppropriationForm({
  onSubmit,
  initialData,
  existingNames = [],
  onCancel,
}: AppropriationFormProps) {
  const form = useForm<AppropriationFormValues>({
    resolver: zodResolver(
      appropriationFormSchema.refine(
        (data) => {
          if (!initialData || initialData.name.toLowerCase() !== data.name.toLowerCase()) {
            return !existingNames.some(name => name.toLowerCase() === data.name.toLowerCase());
          }
          return true;
        },
        {
          message: "اسم بند الاعتماد هذا موجود بالفعل.",
          path: ["name"],
        }
      )
    ),
    defaultValues: {
      name: initialData?.name || "",
      allocatedAmount: initialData?.allocatedAmount || 0,
      description: initialData?.description || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        allocatedAmount: initialData.allocatedAmount,
        description: initialData.description || "",
      });
    } else {
      form.reset({
        name: "",
        allocatedAmount: 0,
        description: "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: AppropriationFormValues) => {
    onSubmit(values);
    if (!initialData) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم البند/المشروع</FormLabel>
              <FormControl>
                <Input placeholder="مثال: صيانة المعدات المكتبية" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allocatedAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Coins className="ml-1 h-4 w-4 text-muted-foreground" />
                المبلغ المرصود (بالدينار التونسي)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.000"
                  {...field}
                  step="0.001"
                  lang="en-US" // To ensure dot is used as decimal separator during input
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  value={field.value}
                />
              </FormControl>
               <FormDescription>
                أدخل المبلغ بثلاثة أرقام عشرية. مثال: 1500.000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف (اختياري)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="أدخل وصفًا موجزًا لهذا البند..."
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          )}
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Save className="ml-2 h-4 w-4" />
            {initialData ? 'حفظ التعديلات' : 'إضافة الاعتماد'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
