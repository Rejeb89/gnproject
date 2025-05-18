
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
import { CalendarIcon, Save, ChevronsUpDown, Check, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale"; 
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Party } from "@/lib/types";
import { addTransaction, getTransactions, getParties, addParty, getEquipmentSettings, setEquipmentThreshold } from "@/lib/store";
import { equipmentFormSchema, type EquipmentFormValues } from "./equipment-form-schema";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EquipmentFormProps {
  type: 'receive' | 'dispatch';
  formTitle: string;
  partyLabel: string; 
  submitButtonText: string;
}

function generateReceiptNumber(type: 'receive' | 'dispatch'): string {
  const currentYear = new Date().getFullYear();
  const transactions = getTransactions();
  
  const yearlyTypedTransactions = transactions.filter(tx => {
    try {
      const txYear = new Date(tx.date).getFullYear();
      // Ensure receiptNumber is not null or undefined before calling endsWith
      return tx.receiptNumber && tx.receiptNumber.endsWith(`-${currentYear}`) && tx.type === type;
    } catch (e) {
      console.error("Error processing transaction for receipt number generation:", tx, e);
      return false; 
    }
  });

  let maxSeq = 0;
  yearlyTypedTransactions.forEach(tx => {
    if (tx.receiptNumber) { 
      const parts = tx.receiptNumber.split('-');
      if (parts.length === 2) {
        const seq = parseInt(parts[0], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `${String(nextSeq).padStart(3, '0')}-${currentYear}`;
}

export function EquipmentForm({ type, formTitle, partyLabel, submitButtonText }: EquipmentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [partyPopoverOpen, setPartyPopoverOpen] = useState(false);
  const [partySearchTerm, setPartySearchTerm] = useState("");

  useEffect(() => {
    setParties(getParties());
  }, []);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      equipmentName: "",
      quantity: 1,
      party: "",
      date: new Date(),
      notes: "",
      lowStockThreshold: undefined, // Keep undefined for form state if it means "not set"
    },
  });

  const equipmentNameValue = form.watch("equipmentName");

  useEffect(() => {
    if (type === 'receive' && equipmentNameValue) {
      const settings = getEquipmentSettings();
      const currentThreshold = settings[equipmentNameValue]?.lowStockThreshold;
      // Set to undefined if not found, so the input can be empty.
      // The input component itself will handle `undefined` by rendering `''`.
      form.setValue('lowStockThreshold', currentThreshold === null || currentThreshold === undefined ? undefined : currentThreshold);
    } else if (type === 'dispatch') {
      form.setValue('lowStockThreshold', undefined);
    }
  }, [equipmentNameValue, type, form]);


  function onSubmit(values: EquipmentFormValues) {
    const generatedReceiptNumber = generateReceiptNumber(type);

    addParty(values.party); 

    if (type === 'receive' && typeof values.lowStockThreshold === 'number' && values.lowStockThreshold > 0) {
      setEquipmentThreshold(values.equipmentName, values.lowStockThreshold);
    } else if (type === 'receive' && values.lowStockThreshold === undefined) {
        // If the field is optional and cleared, you might want to remove the setting or handle it.
        // For now, we only set if a positive number is provided.
    }


    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      equipmentName: values.equipmentName,
      quantity: values.quantity,
      party: values.party,
      date: values.date.toISOString(),
      receiptNumber: generatedReceiptNumber,
      notes: values.notes,
    };

    addTransaction(newTransaction);

    toast({
      title: "تمت العملية بنجاح",
      description: `تم تسجيل ${type === 'receive' ? 'استلام' : 'تسليم'} التجهيز: ${values.equipmentName}. رقم الوصل: ${generatedReceiptNumber}`,
      variant: "default", 
    });

    form.reset(); 
    setParties(getParties()); 
    router.push('/dashboard/history');
  }

  const filteredParties = partySearchTerm
    ? parties.filter(p => p.name.toLowerCase().includes(partySearchTerm.toLowerCase()))
    : parties;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{formTitle}</CardTitle>
        <CardDescription>
          يرجى ملء جميع الحقول المطلوبة لتسجيل العملية. رقم الوصل سيتم إنشاؤه تلقائياً.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="equipmentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم التجهيز</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: جهاز حاسوب محمول" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الكمية</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} min="1" 
                      onChange={event => field.onChange(+event.target.value)} // Ensure number conversion
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'receive' && (
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <AlertTriangle className="ml-1 h-4 w-4 text-orange-500" />
                      حد التنبيه للمخزون المنخفض (اختياري)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="مثال: 5" 
                        {...field} 
                        value={field.value ?? ''} // Ensure input is controlled: value is never undefined
                        onChange={event => {
                          const value = event.target.value;
                          // For optional number, set to undefined if empty, else convert to number
                          field.onChange(value === '' ? undefined : +value);
                        }}
                        min="1" 
                      />
                    </FormControl>
                    <FormDescription>
                      سيتم تنبيهك إذا انخفضت كمية هذا التجهيز عن هذا الحد.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="party"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{partyLabel}</FormLabel>
                  <Popover open={partyPopoverOpen} onOpenChange={setPartyPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={partyPopoverOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? parties.find(p => p.name === field.value)?.name || field.value
                            : `اختر أو أدخل ${partyLabel}...`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={`ابحث عن ${partyLabel}...`}
                          value={partySearchTerm}
                          onValueChange={setPartySearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {partySearchTerm ? `لم يتم العثور على جهة باسم "${partySearchTerm}".` : "لا توجد جهات."}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredParties.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => {
                                  form.setValue("party", p.name);
                                  setPartyPopoverOpen(false);
                                  setPartySearchTerm("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    p.name === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {p.name}
                              </CommandItem>
                            ))}
                            {partySearchTerm && !parties.some(p => p.name.toLowerCase() === partySearchTerm.toLowerCase()) && (
                              <CommandItem
                                value={partySearchTerm}
                                onSelect={() => {
                                  form.setValue("party", partySearchTerm);
                                  setPartyPopoverOpen(false);
                                  setPartySearchTerm("");
                                }}
                                className="text-primary"
                              >
                                <Check className={cn("mr-2 h-4 w-4 opacity-0")} />
                                إنشاء جهة جديدة: "{partySearchTerm}"
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>التاريخ</FormLabel>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={arSA} dir="rtl"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل أي ملاحظات إضافية هنا..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''} // Ensure textarea is also controlled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Save className="ml-2 h-4 w-4" /> 
              {submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

