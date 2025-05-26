
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save, BellRing } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import type { CalendarEvent } from "@/lib/types";
import { calendarEventFormSchema, type CalendarEventFormValues } from "./calendar-event-form-schema";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      reminderUnit: initialData?.reminderUnit || "none",
      reminderValue: initialData?.reminderValue || undefined,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        date: new Date(initialData.date),
        description: initialData.description || "",
        reminderUnit: initialData.reminderUnit || "none",
        reminderValue: initialData.reminderValue || undefined,
      });
    } else {
      form.reset({
        title: "",
        date: new Date(),
        description: "",
        reminderUnit: "none",
        reminderValue: undefined,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: CalendarEventFormValues) => {
    const finalValues = {
        ...values,
        reminderValue: values.reminderUnit === 'none' ? undefined : values.reminderValue,
    };
    onSubmit(finalValues);
  };

  const reminderUnit = form.watch("reminderUnit");

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
                        format(field.value, "PPP HH:mm", { locale: arSA }) 
                      ) : (
                        <span>اختر تاريخًا ووقتًا</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50 mr-2" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(selectedDay) => {
                      if (selectedDay) {
                        const currentTime = field.value || new Date(); // Get current time from form or now
                        const newDateTime = new Date(
                          selectedDay.getFullYear(),
                          selectedDay.getMonth(),
                          selectedDay.getDate(),
                          currentTime.getHours(),
                          currentTime.getMinutes(),
                          currentTime.getSeconds(),
                          currentTime.getMilliseconds()
                        );
                        field.onChange(newDateTime);
                      } else {
                        field.onChange(undefined); // Handle cases where selection might be cleared
                      }
                    }}
                    initialFocus
                    locale={arSA}
                    dir="rtl"
                  />
                  <div className="p-3 border-t border-border">
                    <FormLabel htmlFor="event-time">وقت الحدث</FormLabel>
                    <Input
                        id="event-time"
                        type="time"
                        className="mt-1"
                        defaultValue={field.value ? format(field.value, "HH:mm") : "00:00"}
                        onChange={(e) => {
                            const timeParts = e.target.value.split(':');
                            const hours = parseInt(timeParts[0], 10);
                            const minutes = parseInt(timeParts[1], 10);
                            if (!isNaN(hours) && !isNaN(minutes)) {
                                const currentDatePart = field.value ? new Date(field.value) : new Date();
                                const newDate = new Date(
                                  currentDatePart.getFullYear(),
                                  currentDatePart.getMonth(),
                                  currentDatePart.getDate(),
                                  hours,
                                  minutes
                                );
                                newDate.setSeconds(0);
                                newDate.setMilliseconds(0);
                                field.onChange(newDate);
                            }
                        }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2 rounded-md border p-4">
            <FormLabel className="flex items-center gap-2 text-base">
                <BellRing className="h-5 w-5 text-primary" />
                إعدادات التذكير (اختياري)
            </FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <FormField
                control={form.control}
                name="reminderUnit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>التذكير قبل بـ:</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر وحدة زمنية" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="none">بدون تذكير</SelectItem>
                        <SelectItem value="hours">ساعات</SelectItem>
                        <SelectItem value="days">أيام</SelectItem>
                        <SelectItem value="weeks">أسابيع</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="reminderValue"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>القيمة</FormLabel>
                    <FormControl>
                        <Input
                        type="number"
                        placeholder="أدخل القيمة"
                        {...field}
                        value={field.value ?? ""}
                        disabled={reminderUnit === "none" || !reminderUnit}
                        min="1"
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            {reminderUnit && reminderUnit !== "none" && (
                 <FormDescription className="text-xs pt-1">
                    سيتم إرسال تذكير قبل الحدث بـ {form.getValues("reminderValue") || "..."} {
                        {"hours": "ساعات", "days": "أيام", "weeks": "أسابيع"}[reminderUnit as "hours" | "days" | "weeks"] || ""
                    }.
                </FormDescription>
            )}
        </div>


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

