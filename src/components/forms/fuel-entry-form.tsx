
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
import { CalendarIcon, Save, Thermometer, SprayCan, DollarSign, StickyNote } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { fuelEntryFormSchema, type FuelEntryFormValues } from "./fuel-entry-form-schema";
import React from "react";

interface FuelEntryFormProps {
  onSubmit: (values: FuelEntryFormValues) => void;
  onCancel: () => void;
  initialOdometer?: number;
}

export function FuelEntryForm({ onSubmit, onCancel, initialOdometer }: FuelEntryFormProps) {
  const form = useForm<FuelEntryFormValues>({
    resolver: zodResolver(fuelEntryFormSchema),
    defaultValues: {
      date: new Date(),
      odometerReading: initialOdometer || undefined,
      litersFilled: undefined,
      costPerLiter: undefined,
      totalCost: undefined,
      notes: "",
    },
  });

  const litersFilled = form.watch("litersFilled");
  const costPerLiter = form.watch("costPerLiter");

  React.useEffect(() => {
    if (litersFilled && costPerLiter) {
      form.setValue("totalCost", parseFloat((litersFilled * costPerLiter).toFixed(3)));
    } else if (litersFilled && form.getValues("totalCost") && !costPerLiter) {
        // If total cost is set and cost per liter is not, calculate cost per liter
        const calculatedCostPerLiter = parseFloat((form.getValues("totalCost") / litersFilled).toFixed(3));
        if (!isNaN(calculatedCostPerLiter) && isFinite(calculatedCostPerLiter)) {
             form.setValue("costPerLiter", calculatedCostPerLiter);
        }
    }
  }, [litersFilled, costPerLiter, form]);
  
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
              <FormLabel>تاريخ تعبئة الوقود</FormLabel>
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
          name="odometerReading"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                قراءة العداد (كم)
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="مثال: 150000" {...field} onChange={e => field.onChange(+e.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="litersFilled"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <SprayCan className="h-4 w-4 text-muted-foreground" />
                كمية الوقود المعبأة (لتر)
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="مثال: 40.5" step="0.01" {...field} onChange={e => field.onChange(+e.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="costPerLiter"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    سعر اللتر (د.ت - اختياري)
                </FormLabel>
                <FormControl>
                    <Input type="number" placeholder="مثال: 2.350" step="0.001" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ""} />
                </FormControl>
                <FormDescription className="text-xs">إذا تم إدخال التكلفة الإجمالية، سيتم حسابه.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="totalCost"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    التكلفة الإجمالية (د.ت)
                </FormLabel>
                <FormControl>
                    <Input type="number" placeholder="مثال: 95.175" step="0.001" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormDescription className="text-xs">إذا تم إدخال سعر اللتر، سيتم حسابها.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
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
            حفظ بيانات الوقود
          </Button>
        </div>
      </form>
    </Form>
  );
}
