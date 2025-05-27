
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Wrench, Thermometer, DollarSign, StickyNote, ClipboardList, CalendarClock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { maintenanceRecordFormSchema, type MaintenanceRecordFormValues } from "./maintenance-record-form-schema";
import React from "react";

interface MaintenanceRecordFormProps {
  onSubmit: (values: MaintenanceRecordFormValues) => void;
  onCancel: () => void;
  initialOdometer?: number;
}

export function MaintenanceRecordForm({ onSubmit, onCancel, initialOdometer }: MaintenanceRecordFormProps) {
  const form = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordFormSchema),
    defaultValues: {
      date: new Date(),
      type: "",
      odometerReading: initialOdometer || undefined,
      // cost: undefined, // Default value for cost removed
      description: "",
      nextDueDate: undefined,
      nextDueOdometer: undefined,
      notes: "",
    },
  });
  
  React.useEffect(() => {
    if (initialOdometer) {
        form.setValue("odometerReading", initialOdometer);
    }
  }, [initialOdometer, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الصيانة</FormLabel>
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
                    disabled={(date) => date > new Date()}
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                نوع الصيانة
              </FormLabel>
              <FormControl>
                <Input placeholder="مثال: تغيير زيت، فحص دوري" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                وصف الصيانة / الأعمال المنجزة
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="أدخل وصفًا تفصيليًا لأعمال الصيانة..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="odometerReading"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-1">
                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                    قراءة العداد (كم - اختياري)
                </FormLabel>
                <FormControl>
                    <Input type="number" placeholder="مثال: 155000" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            {/* Removed cost field FormField */}

        <div className="space-y-2 rounded-md border p-4">
            <FormLabel className="flex items-center gap-2 text-base mb-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                تذكير الصيانة القادمة (اختياري)
            </FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <FormField
                control={form.control}
                name="nextDueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>التاريخ القادم</FormLabel>
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
                            disabled={(date) => date < new Date()}
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
                name="nextDueOdometer"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        قراءة العداد القادمة (كم)
                    </FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="مثال: 165000" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                ملاحظات (اختياري)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="أدخل أي ملاحظات إضافية هنا..."
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
          <Button type="submit">
            <Save className="ml-2 h-4 w-4" />
            حفظ سجل الصيانة
          </Button>
        </div>
      </form>
    </Form>
  );
}

