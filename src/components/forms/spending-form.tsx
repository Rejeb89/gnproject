
"use client";

import React, { useEffect, useMemo } from "react";
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
import { CalendarIcon, Save, Coins, FileText, FileUp } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { arSA } from "date-fns/locale";
import { baseSpendingFormSchema, type SpendingFormValues } from "./spending-form-schema";
import type { Spending } from "@/lib/types";

const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} د.ت`;
};

interface SpendingFormProps {
  onSubmit: (values: SpendingFormValues) => void;
  initialData?: Partial<Spending> | null; // Made initialData partial to allow for new forms
  appropriationName: string;
  maxSpendableAmount: number;
  onCancel: () => void;
}

export function SpendingForm({
  onSubmit,
  initialData,
  appropriationName,
  maxSpendableAmount,
  onCancel,
}: SpendingFormProps) {

  const dynamicSpendingFormSchema = useMemo(() => {
    return baseSpendingFormSchema.refine(
      (data) => {
        if (data.spentAmount) {
          return data.spentAmount <= maxSpendableAmount;
        }
        return true;
      },
      (data) => ({ // Return an object for the second argument of refine
        message: `المبلغ المصروف (${formatCurrency(data.spentAmount || 0)}) يتجاوز الرصيد المتبقي لهذا الاعتماد (${formatCurrency(maxSpendableAmount || 0)}).`,
        path: ["spentAmount"],
      })
    );
  }, [maxSpendableAmount]);

  const form = useForm<SpendingFormValues>({
    resolver: zodResolver(dynamicSpendingFormSchema),
    defaultValues: {
      spentAmount: initialData?.spentAmount || 0,
      spendingDate: initialData?.spendingDate ? new Date(initialData.spendingDate) : new Date(),
      description: initialData?.description || "",
      supplyRequestNumber: initialData?.supplyRequestNumber || "",
      supplyRequestDate: initialData?.supplyRequestDate ? new Date(initialData.supplyRequestDate) : undefined,
      supplyRequestFile: undefined,
      invoiceNumber: initialData?.invoiceNumber || "",
      invoiceDate: initialData?.invoiceDate ? new Date(initialData.invoiceDate) : undefined,
      invoiceFile: undefined,
    },
  });

  useEffect(() => {
    form.reset({
      spentAmount: initialData?.spentAmount || 0,
      spendingDate: initialData?.spendingDate ? new Date(initialData.spendingDate) : new Date(),
      description: initialData?.description || "",
      supplyRequestNumber: initialData?.supplyRequestNumber || "",
      supplyRequestDate: initialData?.supplyRequestDate ? new Date(initialData.supplyRequestDate) : undefined,
      supplyRequestFile: undefined, // Files are not typically part of initialData in this way
      invoiceNumber: initialData?.invoiceNumber || "",
      invoiceDate: initialData?.invoiceDate ? new Date(initialData.invoiceDate) : undefined,
      invoiceFile: undefined,
    });
  }, [initialData, form]);

  const handleSubmit = (values: SpendingFormValues) => {
    onSubmit(values);
    // Do not reset form here, let the parent component decide
    // For example, if it's an add form, the parent closes the dialog and might reset.
  };
  
  // Watch file fields to display selected file names
  const supplyRequestFile = form.watch("supplyRequestFile");
  const invoiceFile = form.watch("invoiceFile");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="spentAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Coins className="ml-1 h-4 w-4 text-muted-foreground" />
                المبلغ المصروف (بالدينار التونسي)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.000"
                  {...field}
                  step="0.001"
                  lang="en-US"
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  value={field.value}
                />
              </FormControl>
              <FormDescription>
                أدخل المبلغ بثلاثة أرقام عشرية. الرصيد المتبقي للاعتماد: {formatCurrency(maxSpendableAmount)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spendingDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الصرف</FormLabel>
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
                    disabled={(date) => date > new Date()}
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
              <FormLabel>الوصف/البيان (اختياري)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="أدخل وصفًا لعملية الصرف..."
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Supply Request Section */}
        <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-md font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary"/>
                بيانات طلب التزود (اختياري)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="supplyRequestNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>رقم طلب التزود</FormLabel>
                    <FormControl>
                        <Input placeholder="أدخل رقم الطلب" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="supplyRequestDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>تاريخ طلب التزود</FormLabel>
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
                            locale={arSA}
                            dir="rtl"
                             disabled={(date) => date > new Date()}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
                control={form.control}
                name="supplyRequestFile"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1">
                           <FileUp className="h-4 w-4 text-muted-foreground"/> ملف طلب التزود (PDF)
                        </FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept=".pdf" 
                                onChange={(e) => field.onChange(e.target.files)}
                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </FormControl>
                        <FormDescription>
                            سيتم حفظ اسم الملف فقط. الحد الأقصى للحجم: 5 ميغابايت.
                             {supplyRequestFile?.[0]?.name && <span className="block mt-1 text-xs text-foreground">الملف المختار: {supplyRequestFile[0].name}</span>}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        {/* Invoice Section */}
         <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-md font-semibold flex items-center gap-2">
                 <FileText className="h-5 w-5 text-primary"/>
                بيانات الفاتورة (اختياري)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>رقم الفاتورة</FormLabel>
                    <FormControl>
                        <Input placeholder="أدخل رقم الفاتورة" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>تاريخ الفاتورة</FormLabel>
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
                            locale={arSA}
                            dir="rtl"
                             disabled={(date) => date > new Date()}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="invoiceFile"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1">
                            <FileUp className="h-4 w-4 text-muted-foreground"/> ملف الفاتورة (PDF)
                        </FormLabel>
                        <FormControl>
                             <Input 
                                type="file" 
                                accept=".pdf" 
                                onChange={(e) => field.onChange(e.target.files)}
                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </FormControl>
                         <FormDescription>
                            سيتم حفظ اسم الملف فقط. الحد الأقصى للحجم: 5 ميغابايت.
                            {invoiceFile?.[0]?.name && <span className="block mt-1 text-xs text-foreground">الملف المختار: {invoiceFile[0].name}</span>}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Save className="ml-2 h-4 w-4" />
            {initialData?.id ? 'حفظ التعديلات' : 'إضافة الصرف'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
