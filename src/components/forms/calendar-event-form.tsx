
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import type { CalendarEvent } from "@/lib/types";
import { calendarEventFormSchema, type CalendarEventFormValues } from "./calendar-event-form-schema";
import React from "react";

interface CalendarEventFormProps {
  onSubmit: (values: CalendarEventFormValues) => void;
  onCancel: () => void;
  initialData?: CalendarEvent | null;
}

export function CalendarEventForm({ onSubmit, onCancel, initialData }: CalendarEventFormProps) {
  const form = useForm<CalendarEventFormValues>({
    resolver: zodResolver(calendarEventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      date: initialData ? new Date(initialData.date) : new Date(),
      description: initialData?.description || "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        date: new Date(initialData.date),
        description: initialData.description || "",
      });
    } else {
      form.reset({
        title: "",
        date: new Date(),
        description: "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: CalendarEventFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان الحدث</FormLabel>
              <FormControl>
                <Input placeholder="مثال: اجتماع صيانة دورية" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الحدث</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 pr-1 text-right font-normal justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: arSA })
                      ) : (
                        <span>اختر تاريخًا</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50 mr-2" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    locale={arSA}
                    dir="rtl"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف الحدث (اختياري)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="أدخل تفاصيل إضافية عن الحدث هنا..."
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
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Save className="ml-2 h-4 w-4" />
            {initialData ? 'حفظ التعديلات' : 'إضافة الحدث'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
