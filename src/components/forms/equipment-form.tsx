
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
import { CalendarIcon, Save, ChevronsUpDown, Check, AlertTriangle, Tag, Package, PlusCircle, ArrowRightLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Party, EquipmentDefinition, Equipment } from "@/lib/types";
import {
  addTransaction,
  getTransactions,
  getParties,
  addParty,
  getEquipmentSettings,
  setEquipmentThreshold,
  getEquipmentDefinitions,
  addEquipmentDefinition,
  updateEquipmentDefinition,
  calculateStock,
} from "@/lib/store";
import { equipmentFormSchema, type EquipmentFormValues } from "./equipment-form-schema";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
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
      if (parts.length === 2) { // e.g., 001-2024
        const seqPart = parts[0];
        const seq = parseInt(seqPart, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else if (parts.length === 3 && type === 'dispatch') { // e.g., D-001-2024 (older format possibly)
         const seqPart = parts[1];
         const seq = parseInt(seqPart, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else if (parts.length === 3 && type === 'receive') { // e.g., R-001-2024 (older format possibly)
         const seqPart = parts[1];
         const seq = parseInt(seqPart, 10);
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

  const [equipmentNamePopoverOpen, setEquipmentNamePopoverOpen] = useState(false);
  const [equipmentNameSearchTerm, setEquipmentNameSearchTerm] = useState("");
  const [availableEquipmentForDispatch, setAvailableEquipmentForDispatch] = useState<Equipment[]>([]);


  useEffect(() => {
    setParties(getParties());
    setAllEquipmentDefinitions(getEquipmentDefinitions());
    if (type === 'dispatch') {
      const currentStock = calculateStock(getTransactions());
      setAvailableEquipmentForDispatch(currentStock.filter(item => item.quantity > 0));
    }
  }, [type]);

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
  const categoryValue = form.watch("category");

  const selectedEquipmentForDispatch = availableEquipmentForDispatch.find(
    (eq) => eq.name === equipmentNameValue && (eq.category || "") === (categoryValue || "")
  );


  useEffect(() => {
    if (equipmentNameValue && type === 'receive') {
      const definition = allEquipmentDefinitions.find(def => def.name.toLowerCase() === equipmentNameValue.toLowerCase());
      const currentFormCategory = form.getValues('category');
      const currentFormThreshold = form.getValues('lowStockThreshold');

      if (definition) {
        if ((currentFormCategory === "" || currentFormCategory === undefined) && definition.defaultCategory) {
          form.setValue('category', definition.defaultCategory);
        }
        if (currentFormThreshold === undefined && definition.defaultLowStockThreshold !== undefined) {
          form.setValue('lowStockThreshold', definition.defaultLowStockThreshold);
        } else if (currentFormThreshold === undefined) {
          const settings = getEquipmentSettings();
          const equipmentSetting = settings[equipmentNameValue];
          if (equipmentSetting && typeof equipmentSetting.lowStockThreshold === 'number') {
            form.setValue('lowStockThreshold', equipmentSetting.lowStockThreshold);
          } else {
             form.setValue('lowStockThreshold', undefined);
          }
        }
      }
    }
  }, [equipmentNameValue, type, form, allEquipmentDefinitions]);


  function onSubmit(values: EquipmentFormValues) {
    const generatedReceiptNumber = generateReceiptNumber(type);

    addParty(values.party);

    if (type === 'receive') {
      const definitions = getEquipmentDefinitions();
      const existingDefinition = definitions.find(def => def.name.toLowerCase() === values.equipmentName.toLowerCase());

      const formCategory = values.category || undefined;
      const formThreshold = values.lowStockThreshold;

      if (!existingDefinition) {
        addEquipmentDefinition({
          name: values.equipmentName,
          defaultCategory: formCategory,
          defaultLowStockThreshold: formThreshold,
        });
        if (formThreshold !== undefined) {
            setEquipmentThreshold(values.equipmentName, formThreshold);
        }
      } else {
        let definitionNeedsUpdate = false;
        const updatedDefinitionData: Partial<EquipmentDefinition> = {};

        if (formCategory !== undefined && formCategory !== (existingDefinition.defaultCategory || undefined)) {
            updatedDefinitionData.defaultCategory = formCategory;
            definitionNeedsUpdate = true;
        }
        if (formThreshold !== undefined && formThreshold !== (existingDefinition.defaultLowStockThreshold || undefined) ) {
            updatedDefinitionData.defaultLowStockThreshold = formThreshold;
            definitionNeedsUpdate = true;
        }

        if (definitionNeedsUpdate) {
             updateEquipmentDefinition({
                ...existingDefinition,
                ...updatedDefinitionData,
            });
        }
        if (formThreshold !== undefined) {
            setEquipmentThreshold(values.equipmentName, formThreshold);
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
    setParties(getParties());
    setAllEquipmentDefinitions(getEquipmentDefinitions());
    if (type === 'dispatch') {
      const currentStock = calculateStock(getTransactions());
      setAvailableEquipmentForDispatch(currentStock.filter(item => item.quantity > 0));
    }
    setPartySearchTerm("");
    setEquipmentNameSearchTerm("");
    router.push('/dashboard/reports');
  }

  const filteredParties = partySearchTerm
    ? parties.filter(p => p.name.toLowerCase().includes(partySearchTerm.toLowerCase()))
    : parties;

  const uniqueEquipmentNamesForDispatch = Array.from(new Set(availableEquipmentForDispatch.map(item => item.name)));
  const filteredEquipmentNamesForDispatch = equipmentNameSearchTerm
    ? uniqueEquipmentNamesForDispatch.filter(name => name.toLowerCase().includes(equipmentNameSearchTerm.toLowerCase()))
    : uniqueEquipmentNamesForDispatch;


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
            {type === 'receive' ? <PlusCircle className="h-7 w-7 text-primary"/> : <ArrowRightLeft className="h-7 w-7 text-primary"/>}
            {formTitle}
        </CardTitle>
        <CardDescription>
          يرجى ملء جميع الحقول المطلوبة لتسجيل العملية. رقم الوصل سيتم إنشاؤه تلقائياً.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {type === 'receive' && (
              <FormField
                control={form.control}
                name="equipmentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Package className="ml-1 h-4 w-4 text-muted-foreground" />
                      اسم التجهيز
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: جهاز حاسوب محمول" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === 'dispatch' && (
              <FormField
                control={form.control}
                name="equipmentName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center">
                        <Package className="ml-1 h-4 w-4 text-muted-foreground" />
                        اسم التجهيز
                    </FormLabel>
                    <Popover open={equipmentNamePopoverOpen} onOpenChange={setEquipmentNamePopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={equipmentNamePopoverOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            onClick={() => setEquipmentNamePopoverOpen(!equipmentNamePopoverOpen)}
                          >
                            {field.value || "اختر اسم التجهيز..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="ابحث عن اسم التجهيز..."
                            value={equipmentNameSearchTerm}
                            onValueChange={setEquipmentNameSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {equipmentNameSearchTerm ? `لم يتم العثور على تجهيز باسم "${equipmentNameSearchTerm}".` : "لا توجد تجهيزات معرفة."}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredEquipmentNamesForDispatch.map((name) => (
                                <CommandItem
                                  key={name}
                                  value={name}
                                  onSelect={() => {
                                    form.setValue("equipmentName", name);
                                    form.setValue("category", "");
                                    const itemsWithSelectedName = availableEquipmentForDispatch.filter(
                                      item => item.name === name && item.quantity > 0
                                    );
                                    const uniqueCategories = Array.from(
                                      new Set(itemsWithSelectedName.map(item => item.category))
                                    );

                                    if (uniqueCategories.length === 1) {
                                      form.setValue("category", uniqueCategories[0] || "");
                                    }
                                    setEquipmentNamePopoverOpen(false);
                                    setEquipmentNameSearchTerm("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      name === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Tag className="ml-1 h-4 w-4 text-muted-foreground" />
                    صنف التجهيز (اختياري)
                  </FormLabel>
                  {type === 'receive' && (
                    <FormControl>
                      <Input placeholder="مثال: مكتبي, محمول, شبكات" {...field} value={field.value ?? ''} />
                    </FormControl>
                  )}
                  {type === 'dispatch' && (
                     <FormControl>
                        <Input
                            placeholder="الصنف (يُملأ تلقائيًا إذا وحيد)"
                            {...field}
                            value={field.value ?? ''}
                            disabled={!equipmentNameValue}
                            className={!equipmentNameValue ? "text-muted-foreground" : ""}
                        />
                     </FormControl>
                  )}
                  <FormDescription>
                    {type === 'receive' ? "لتصنيف هذا النوع من التجهيزات (إن وجد). سيتم استخدامه كصنف افتراضي إذا كان هذا اسم تجهيز جديد." : "أدخل صنف التجهيز، أو سيتم تحديده تلقائيًا إذا كان للتجهيز المختار صنف واحد متوفر."}
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
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      min="1"
                      max={type === 'dispatch' && selectedEquipmentForDispatch ? selectedEquipmentForDispatch.quantity : undefined}
                      onChange={event => field.onChange(+event.target.value)}
                    />
                  </FormControl>
                  {type === 'dispatch' && selectedEquipmentForDispatch && (
                    <FormDescription className="text-blue-600">
                      الكمية المتوفرة من {selectedEquipmentForDispatch.name} ({selectedEquipmentForDispatch.category || 'بدون صنف'}): {selectedEquipmentForDispatch.quantity.toLocaleString()}
                    </FormDescription>
                  )}
                   {type === 'dispatch' && equipmentNameValue && !selectedEquipmentForDispatch && categoryValue && (
                    <FormDescription className="text-destructive">
                        لا توجد كمية متوفرة من {equipmentNameValue} بهذا الصنف المحدد.
                    </FormDescription>
                  )}
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
                            {partySearchTerm && !parties.some(p => p.name.toLowerCase() === partySearchTerm.toLowerCase()) && (
                                 " يمكنك إضافتها عند الحفظ."
                            )}
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
                                إضافة جهة جديدة: "{partySearchTerm}"
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

    
