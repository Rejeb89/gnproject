
"use client";

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
import { equipmentDefinitionFormSchema, type EquipmentDefinitionFormValues } from "./equipment-definition-form-schema";
import type { EquipmentDefinition } from "@/lib/types";
import { Save, Tag, AlertTriangle, Scaling } from "lucide-react";
import React from "react";

interface EquipmentDefinitionFormProps {
  onSubmit: (values: EquipmentDefinitionFormValues) => void;
  initialData?: EquipmentDefinition | null;
  existingNames?: string[];
}

export function EquipmentDefinitionForm({ onSubmit, initialData, existingNames = [] }: EquipmentDefinitionFormProps) {
  const form = useForm<EquipmentDefinitionFormValues>({
    resolver: zodResolver(
      equipmentDefinitionFormSchema.refine(
        (data) => {
          if (!initialData || initialData.name.toLowerCase() !== data.name.toLowerCase()) {
            return !existingNames.some(name => name.toLowerCase() === data.name.toLowerCase());
          }
          return true;
        },
        {
          message: "اسم نوع التجهيز هذا موجود بالفعل.",
          path: ["name"], 
        }
      )
    ),
    defaultValues: {
      name: initialData?.name || "",
      defaultCategory: initialData?.defaultCategory || "",
      defaultLowStockThreshold: initialData?.defaultLowStockThreshold || undefined,
      unitOfMeasurement: initialData?.unitOfMeasurement || "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        defaultCategory: initialData.defaultCategory || "",
        defaultLowStockThreshold: initialData.defaultLowStockThreshold || undefined,
        unitOfMeasurement: initialData.unitOfMeasurement || "",
      });
    } else {
         form.reset({
            name: "",
            defaultCategory: "",
            defaultLowStockThreshold: undefined,
            unitOfMeasurement: "",
      });
    }
  }, [initialData, form]);


  const handleSubmit = (values: EquipmentDefinitionFormValues) => {
    onSubmit(values);
    if (!initialData) { // Reset only if it's an add form, not edit
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
              <FormLabel>اسم نوع التجهيز</FormLabel>
              <FormControl>
                <Input placeholder="مثال: جهاز حاسوب محمول" {...field} />
              </FormControl>
              <FormDescription>
                الاسم المميز لنوع التجهيز (مثلاً: طابعة، شاشة، كابل شبكة).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Tag className="ml-1 h-4 w-4 text-muted-foreground" />
                الصنف الافتراضي (اختياري)
              </FormLabel>
              <FormControl>
                <Input placeholder="مثال: مكتبي، ليزر، Cat6" {...field} />
              </FormControl>
              <FormDescription>
                الصنف الذي سيُقترح تلقائيًا عند إضافة هذا النوع من التجهيزات.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultLowStockThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <AlertTriangle className="ml-1 h-4 w-4 text-orange-500" />
                حد التنبيه الافتراضي (اختياري)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="مثال: 5"
                  {...field}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                  value={field.value ?? ''}
                  min="1"
                />
              </FormControl>
              <FormDescription>
                الحد الذي سيُستخدم افتراضيًا لتنبيهات المخزون المنخفض لهذا النوع.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unitOfMeasurement"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Scaling className="ml-1 h-4 w-4 text-muted-foreground" />
                وحدة القياس (اختياري)
              </FormLabel>
              <FormControl>
                <Input placeholder="مثال: قطعة، علبة، متر" {...field} />
              </FormControl>
              <FormDescription>
                وحدة قياس هذا النوع من التجهيزات (مثلاً: وحدة، صندوق، لفة).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Save className="ml-2 h-4 w-4" />
            {initialData ? 'حفظ التعديلات' : 'إضافة النوع'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
