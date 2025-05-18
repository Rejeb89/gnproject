
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { partyFormSchema, type PartyFormValues } from "./party-form-schema";
import type { Party } from "@/lib/types";
import { Save } from "lucide-react";
import React from "react";

interface PartyFormProps {
  onSubmit: (values: PartyFormValues) => void;
  initialData?: Party | null;
  existingPartyNames?: string[];
}

export function PartyForm({ onSubmit, initialData, existingPartyNames = [] }: PartyFormProps) {
  const form = useForm<PartyFormValues>({
    resolver: zodResolver(
      partyFormSchema.refine(
        (data) => {
          const normalizedNewName = data.name.trim().toLowerCase();
          if (!initialData || initialData.name.trim().toLowerCase() !== normalizedNewName) {
            return !existingPartyNames.some(name => name.trim().toLowerCase() === normalizedNewName);
          }
          return true;
        },
        {
          message: "اسم الجهة هذا موجود بالفعل.",
          path: ["name"],
        }
      )
    ),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({ name: initialData.name });
    } else {
      form.reset({ name: "" });
    }
  }, [initialData, form]);

  const handleSubmit = (values: PartyFormValues) => {
    onSubmit({ name: values.name.trim() }); // Ensure name is trimmed before submitting
    if (!initialData) {
      form.reset({ name: "" }); // Reset only for add form
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
              <FormLabel>اسم الجهة</FormLabel>
              <FormControl>
                <Input placeholder="مثال: الإدارة العامة للتجهيز" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Save className="ml-2 h-4 w-4" />
            {initialData ? 'حفظ التعديلات' : 'إضافة الجهة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
