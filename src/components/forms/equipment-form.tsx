
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
import { CalendarIcon, Save, ChevronsUpDown, Check, AlertTriangle, Tag } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Party, EquipmentDefinition } from "@/lib/types";
import { 
  addTransaction, 
  getTransactions, 
  getParties, 
  addParty, 
  getEquipmentSettings, 
  setEquipmentThreshold,
  getEquipmentDefinitions,
  addEquipmentDefinition,
  updateEquipmentDefinition
} from "@/lib/store";
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
  const [allEquipmentDefinitions, setAllEquipmentDefinitions] = useState<EquipmentDefinition[]>([]);
  const [partyPopoverOpen, setPartyPopoverOpen] = useState(false);
  const [partySearchTerm, setPartySearchTerm] = useState("");

  useEffect(() => {
    // Load parties and definitions once on mount
    setParties(getParties());
    setAllEquipmentDefinitions(getEquipmentDefinitions());
  }, []);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      equipmentName: "",
      category: "", 
      quantity: 1,
      party: "",
      date: new Date(),
      notes: "",
      lowStockThreshold: undefined,
    },
  });

  const equipmentNameValue = form.watch("equipmentName");

  useEffect(() => {
    if (equipmentNameValue && type === 'receive') {
      const definition = allEquipmentDefinitions.find(def => def.name.toLowerCase() === equipmentNameValue.toLowerCase());
      const currentFormCategory = form.getValues('category');
      const currentFormThreshold = form.getValues('lowStockThreshold');

      if (definition) {
        // Pre-fill category only if form category is empty/not set and definition has one
        if ((currentFormCategory === "" || currentFormCategory === undefined) && definition.defaultCategory) {
          form.setValue('category', definition.defaultCategory);
        }
        // Pre-fill threshold only if form threshold is undefined and definition has one
        if (currentFormThreshold === undefined && definition.defaultLowStockThreshold !== undefined) {
          form.setValue('lowStockThreshold', definition.defaultLowStockThreshold);
        } else if (currentFormThreshold === undefined) {
          // If definition exists but has no default threshold, check general equipment settings.
          // This ensures the threshold field reflects any previously set specific threshold for this item name.
          const settings = getEquipmentSettings();
          form.setValue('lowStockThreshold', settings[equipmentNameValue]?.lowStockThreshold ?? undefined);
        }
      }
      // If no definition, user is defining a new item, so fields are based on their input or form defaults.
    } else if (type === 'dispatch') {
      // For dispatch, ensure lowStockThreshold is not set/relevant in the form
      form.setValue('lowStockThreshold', undefined);
    }
  }, [equipmentNameValue, type, form, allEquipmentDefinitions]);


  function onSubmit(values: EquipmentFormValues) {
    const generatedReceiptNumber = generateReceiptNumber(type);

    addParty(values.party);

    if (type === 'receive') {
      const definitions = getEquipmentDefinitions(); // Get latest definitions
      const existingDefinition = definitions.find(def => def.name.toLowerCase() === values.equipmentName.toLowerCase());
      
      const formCategory = values.category || undefined;
      const formThreshold = values.lowStockThreshold;

      if (!existingDefinition) {
        // New equipment name being received - create a definition for it.
        // The lowStockThreshold and category from the form will become its defaults.
        addEquipmentDefinition({
          name: values.equipmentName,
          defaultCategory: formCategory,
          defaultLowStockThreshold: formThreshold,
          // unitOfMeasurement can be added later if needed for new definitions
        });
        // addEquipmentDefinition also calls setEquipmentThreshold internally with defaultLowStockThreshold
      } else {
        // Existing equipment definition.
        // Check if category or threshold from form differs from definition's defaults.
        const needsCategoryUpdate = formCategory !== existingDefinition.defaultCategory;
        const needsThresholdUpdate = formThreshold !== existingDefinition.defaultLowStockThreshold;

        if (needsCategoryUpdate || needsThresholdUpdate) {
          updateEquipmentDefinition({
            ...existingDefinition, // Spread existing to preserve id and unitOfMeasurement
            defaultCategory: formCategory, // Update with form value
            defaultLowStockThreshold: formThreshold, // Update with form value
          });
          // updateEquipmentDefinition also calls setEquipmentThreshold internally
        }
      }
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      equipmentName: values.equipmentName,
      category: values.category || undefined, 
      quantity: values.quantity,
      party: values.party,
      date: values.date.toISOString(),
      receiptNumber: generatedReceiptNumber,
      notes: values.notes,
    };

    addTransaction(newTransaction);

    toast({
      title: "تمت العملية بنجاح",
      description: `تم تسجيل ${type === 'receive' ? 'استلام' : 'تسليم'} التجهيز: ${values.equipmentName} ${values.category ? '('+values.category+')' : ''}. رقم الوصل: ${generatedReceiptNumber}`,
      variant: "default",
    });

    form.reset();
    setParties(getParties()); // Refresh parties list for next form use
    setAllEquipmentDefinitions(getEquipmentDefinitions()); // Refresh definitions list for next form use
    router.push('/dashboard/reports');
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Tag className="ml-1 h-4 w-4 text-muted-foreground" />
                    صنف التجهيز (اختياري)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: مكتبي، محمول، شبكات" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    لتصنيف هذا النوع من التجهيزات (إن وجد). سيتم استخدامه كصنف افتراضي إذا كان هذا اسم تجهيز جديد.
                  </FormDescription>
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
                      onChange={event => field.onChange(+event.target.value)}
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
                      حد التنبيه للمخزون المنخفض (لاسم التجهيز هذا)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="مثال: 5"
                        {...field}
                        value={field.value ?? ''}
                        onChange={event => {
                          const value = event.target.value;
                          field.onChange(value === '' ? undefined : +value);
                        }}
                        min="1"
                      />
                    </FormControl>
                    <FormDescription>
                      سيتم تنبيهك إذا انخفض إجمالي كمية هذا التجهيز (بكل أصنافه) عن هذا الحد. سيصبح هذا الحد هو الافتراضي إذا كان هذا اسم تجهيز جديد.
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
                      value={field.value ?? ''}
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

