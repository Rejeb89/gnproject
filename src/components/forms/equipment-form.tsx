
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
import { CalendarIcon, Save, ChevronsUpDown, Check, AlertTriangle, Tag, Package, UserCheck, PlusCircle, ArrowRightLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Party, EquipmentDefinition, Equipment, PartyEmployee } from "@/lib/types";
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
  getPartyEmployees,
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
      return tx.receiptNumber && tx.receiptNumber.includes(`-${type.charAt(0).toUpperCase()}-`) && tx.receiptNumber.endsWith(`-${currentYear}`) && tx.type === type;
    } catch (e) {
      console.error("Error processing transaction for receipt number generation:", tx, e);
      return false;
    }
  });

  let maxSeq = 0;
  yearlyTypedTransactions.forEach(tx => {
    if (tx.receiptNumber) {
      const parts = tx.receiptNumber.split('-'); 
      if (parts.length === 3) { 
         const seqPart = parts[0]; 
         const seq = parseInt(seqPart, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `${String(nextSeq).padStart(3, '0')}-${type.charAt(0).toUpperCase()}-${currentYear}`;
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

  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [uniqueExistingCategories, setUniqueExistingCategories] = useState<string[]>([]);
  const [categoriesForSelectedEquipmentName, setCategoriesForSelectedEquipmentName] = useState<string[]>([]);

  const [withdrawalOfficerPopoverOpen, setWithdrawalOfficerPopoverOpen] = useState(false);
  const [withdrawalOfficerSearchTerm, setWithdrawalOfficerSearchTerm] = useState("");
  const [employeesOfSelectedParty, setEmployeesOfSelectedParty] = useState<PartyEmployee[]>([]);


  useEffect(() => {
    setParties(getParties());
    setAllEquipmentDefinitions(getEquipmentDefinitions());
    if (type === 'dispatch') {
      const currentStock = calculateStock(getTransactions());
      setAvailableEquipmentForDispatch(currentStock.filter(item => item.quantity > 0));
    }
  }, [type]);

  useEffect(() => {
    const categories = Array.from(new Set(allEquipmentDefinitions.map(def => def.defaultCategory).filter(Boolean) as string[]));
    setUniqueExistingCategories(categories.sort());
  }, [allEquipmentDefinitions]);

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
      withdrawalOfficerName: undefined,
      withdrawalOfficerRank: undefined,
    },
  });

  const equipmentNameValue = form.watch("equipmentName");
  const categoryValue = form.watch("category");
  const partyValue = form.watch("party");

  const selectedEquipmentForDispatch = useMemo(() => {
    if (type !== 'dispatch' || !equipmentNameValue) return undefined;
    return availableEquipmentForDispatch.find(
        (eq) => eq.name === equipmentNameValue && (eq.category || "") === (categoryValue || "")
    );
  }, [availableEquipmentForDispatch, equipmentNameValue, categoryValue, type]);


  useEffect(() => {
    if (equipmentNameValue && type === 'receive') {
      const definition = allEquipmentDefinitions.find(def => def.name.toLowerCase() === equipmentNameValue.toLowerCase());
      const currentFormCategory = form.getValues('category');
      const currentFormThreshold = form.getValues('lowStockThreshold');

      if (definition) {
        if ((currentFormCategory === "" || currentFormCategory === undefined) && definition.defaultCategory) {
          form.setValue('category', definition.defaultCategory);
          setCategorySearchTerm(definition.defaultCategory); 
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

  useEffect(() => {
    if (type === 'dispatch' && equipmentNameValue) {
      const itemsWithSelectedName = availableEquipmentForDispatch.filter(
        item => item.name === equipmentNameValue && item.quantity > 0
      );
      const uniqueCategoriesForDispatch = Array.from(
        new Set(itemsWithSelectedName.map(item => item.category || "(بدون صنف)"))
      ).sort();
      setCategoriesForSelectedEquipmentName(uniqueCategoriesForDispatch);

      if (uniqueCategoriesForDispatch.length === 1) {
        const singleCategory = uniqueCategoriesForDispatch[0] === "(بدون صنف)" ? "" : uniqueCategoriesForDispatch[0];
        form.setValue("category", singleCategory, {shouldValidate: true});
      } else {
        form.setValue("category", ""); 
      }
    } else if (type === 'receive') {
      // This logic might need adjustment if categories for receive need dynamic updates too
      // For now, it's based on allEquipmentDefinitions
    }
  }, [equipmentNameValue, type, availableEquipmentForDispatch, form]);

  useEffect(() => {
    if (type === 'dispatch' && partyValue) {
      const selectedPartyObject = parties.find(p => p.name === partyValue);
      if (selectedPartyObject) {
        const employees = getPartyEmployees(selectedPartyObject.id);
        setEmployeesOfSelectedParty(employees);
      } else {
        setEmployeesOfSelectedParty([]); 
      }
      form.setValue("withdrawalOfficerName", undefined);
      form.setValue("withdrawalOfficerRank", undefined);
      setWithdrawalOfficerSearchTerm("");
    } else {
      setEmployeesOfSelectedParty([]);
    }
  }, [partyValue, type, parties, form]);


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
            if(formCategory !== "" || existingDefinition.defaultCategory !== undefined) {
                updatedDefinitionData.defaultCategory = formCategory === "" ? undefined : formCategory;
                definitionNeedsUpdate = true;
            }
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
      withdrawalOfficerName: values.withdrawalOfficerName,
      withdrawalOfficerRank: values.withdrawalOfficerRank,
    };

    addTransaction(newTransaction);

    toast({
      title: "تمت العملية بنجاح",
      description: `تم تسجيل ${type === 'receive' ? 'استلام' : 'تسليم'} التجهيز: ${values.equipmentName} ${values.category ? '('+values.category+')' : ''}. رقم الوصل: ${generatedReceiptNumber}`,
      variant: "default",
    });

    form.reset();
    setParties(getParties());
    const newDefs = getEquipmentDefinitions(); 
    setAllEquipmentDefinitions(newDefs); 
    
    if (type === 'dispatch') {
      const currentStock = calculateStock(getTransactions());
      setAvailableEquipmentForDispatch(currentStock.filter(item => item.quantity > 0));
    }
    setPartySearchTerm("");
    setEquipmentNameSearchTerm("");
    setCategorySearchTerm(""); 
    setWithdrawalOfficerSearchTerm("");
    setEmployeesOfSelectedParty([]);
    router.push('/dashboard/reports');
  }

  const filteredParties = partySearchTerm
    ? parties.filter(p => p.name.toLowerCase().includes(partySearchTerm.toLowerCase()))
    : parties;

  const uniqueEquipmentNamesForDispatch = Array.from(new Set(availableEquipmentForDispatch.map(item => item.name))).sort();
  
  const filteredEquipmentNamesForDispatch = equipmentNameSearchTerm
    ? uniqueEquipmentNamesForDispatch.filter(name => name.toLowerCase().includes(equipmentNameSearchTerm.toLowerCase()))
    : uniqueEquipmentNamesForDispatch;

  const allDefinedEquipmentNames = useMemo(() => Array.from(new Set(allEquipmentDefinitions.map(def => def.name))).sort(), [allEquipmentDefinitions]);
  
  const filteredDefinedEquipmentNames = equipmentNameSearchTerm
    ? allDefinedEquipmentNames.filter(name => name.toLowerCase().includes(equipmentNameSearchTerm.toLowerCase()))
    : allDefinedEquipmentNames;
  
  const filteredExistingCategories = categorySearchTerm
    ? uniqueExistingCategories.filter(cat => cat.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    : uniqueExistingCategories;

  const filteredCategoriesForSelectedEquipmentName = categorySearchTerm
    ? categoriesForSelectedEquipmentName.filter(cat => cat.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    : categoriesForSelectedEquipmentName;

  const filteredEmployees = withdrawalOfficerSearchTerm
    ? employeesOfSelectedParty.filter(emp => 
        `${emp.rank} ${emp.firstName} ${emp.lastName} ${emp.employeeNumber}`.toLowerCase().includes(withdrawalOfficerSearchTerm.toLowerCase())
      )
    : employeesOfSelectedParty;

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

            <FormField
              control={form.control}
              name="equipmentName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center">
                      <Package className="ml-1 h-4 w-4 text-muted-foreground" />
                      اسم التجهيز
                  </FormLabel>
                  <Popover 
                    open={equipmentNamePopoverOpen} 
                    onOpenChange={(isOpen) => {
                        setEquipmentNamePopoverOpen(isOpen);
                        if (isOpen && field.value) {
                            setEquipmentNameSearchTerm(field.value);
                        } else if (!isOpen) {
                            setEquipmentNameSearchTerm(field.value || "");
                        }
                    }}
                  >
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
                        >
                          {field.value || (type === 'receive' ? "اختر أو أدخل اسم التجهيز..." : "اختر اسم التجهيز...")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={type === 'receive' ? "ابحث عن اسم تجهيز أو أنشئ جديدًا..." : "ابحث عن اسم التجهيز..."}
                          value={equipmentNameSearchTerm}
                          onValueChange={(search) => {
                            setEquipmentNameSearchTerm(search);
                            if (type === 'receive') {
                                form.setValue("equipmentName", search, { shouldValidate: true });
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {equipmentNameSearchTerm ? `لم يتم العثور على تجهيز باسم "${equipmentNameSearchTerm}".` : (type === 'receive' ? "لا توجد تجهيزات معرفة مسبقًا." : "لا توجد تجهيزات متوفرة.") }
                            {type === 'receive' && equipmentNameSearchTerm && !allDefinedEquipmentNames.some(name => name.toLowerCase() === equipmentNameSearchTerm.toLowerCase()) && (
                              " يمكنك إضافته كـ \"إضافة تجهيز جديد\"."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {(type === 'receive' ? filteredDefinedEquipmentNames : filteredEquipmentNamesForDispatch).map((name) => (
                              <CommandItem
                                key={name}
                                value={name}
                                onSelect={() => {
                                  form.setValue("equipmentName", name, { shouldValidate: true });
                                  if (type === 'dispatch') {
                                      form.setValue("category", ""); 
                                      const itemsWithSelectedName = availableEquipmentForDispatch.filter(item => item.name === name && item.quantity > 0);
                                      const uniqueCategoriesForDispatch = Array.from(new Set(itemsWithSelectedName.map(item => item.category || "(بدون صنف)"))).sort();
                                      setCategoriesForSelectedEquipmentName(uniqueCategoriesForDispatch);
                                      if (uniqueCategoriesForDispatch.length === 1) {
                                        const singleCategory = uniqueCategoriesForDispatch[0] === "(بدون صنف)" ? "" : uniqueCategoriesForDispatch[0];
                                        form.setValue("category", singleCategory, { shouldValidate: true });
                                      }
                                  }
                                  setEquipmentNamePopoverOpen(false);
                                  setEquipmentNameSearchTerm(name); 
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
                            {type === 'receive' && equipmentNameSearchTerm && !allDefinedEquipmentNames.some(name => name.toLowerCase() === equipmentNameSearchTerm.toLowerCase()) && (
                              <CommandItem
                                key={equipmentNameSearchTerm} 
                                value={equipmentNameSearchTerm}
                                onSelect={() => {
                                  form.setValue("equipmentName", equipmentNameSearchTerm, { shouldValidate: true });
                                  setEquipmentNamePopoverOpen(false);
                                  setEquipmentNameSearchTerm(equipmentNameSearchTerm);
                                }}
                                className="text-primary"
                              >
                                <Check className={cn("mr-2 h-4 w-4 opacity-0")} />
                                إضافة تجهيز جديد: "{equipmentNameSearchTerm}"
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
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center">
                    <Tag className="ml-1 h-4 w-4 text-muted-foreground" />
                    صنف التجهيز (اختياري)
                  </FormLabel>
                  {type === 'receive' ? (
                    <Popover 
                      open={categoryPopoverOpen} 
                      onOpenChange={(isOpen) => {
                        setCategoryPopoverOpen(isOpen);
                        if (isOpen && field.value) {
                            setCategorySearchTerm(field.value);
                        } else if (!isOpen) {
                            setCategorySearchTerm(field.value || "");
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={categoryPopoverOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "اختر أو أدخل الصنف..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="ابحث عن صنف أو أنشئ جديدًا..."
                            value={categorySearchTerm}
                            onValueChange={(search) => {
                              setCategorySearchTerm(search);
                              form.setValue("category", search, { shouldValidate: true });
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {categorySearchTerm ? `لم يتم العثور على صنف باسم "${categorySearchTerm}".` : "لا توجد أصناف معرفة مسبقًا."}
                              {categorySearchTerm && !uniqueExistingCategories.some(cat => cat.toLowerCase() === categorySearchTerm.toLowerCase()) && (
                                " يمكنك إضافته كـ \"إضافة صنف جديد\"."
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredExistingCategories.map((cat) => (
                                  <CommandItem
                                    key={cat}
                                    value={cat}
                                    onSelect={() => {
                                      form.setValue("category", cat, { shouldValidate: true });
                                      setCategoryPopoverOpen(false);
                                      setCategorySearchTerm(cat); 
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        cat === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {cat}
                                  </CommandItem>
                                ))}
                              {categorySearchTerm && !uniqueExistingCategories.some(cat => cat.toLowerCase() === categorySearchTerm.toLowerCase()) && (
                                <CommandItem
                                  key={categorySearchTerm} 
                                  value={categorySearchTerm}
                                  onSelect={() => {
                                    form.setValue("category", categorySearchTerm, { shouldValidate: true });
                                    setCategoryPopoverOpen(false);
                                    setCategorySearchTerm(categorySearchTerm);
                                  }}
                                  className="text-primary"
                                >
                                  <Check className={cn("mr-2 h-4 w-4 opacity-0")} />
                                  إضافة صنف جديد: "{categorySearchTerm}"
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : ( 
                     <Popover 
                      open={categoryPopoverOpen} 
                      onOpenChange={(isOpen) => {
                        setCategoryPopoverOpen(isOpen);
                         if (isOpen && field.value) {
                            setCategorySearchTerm(field.value);
                        } else if (!isOpen && equipmentNameValue) { // Only set search term if equipment is selected
                            setCategorySearchTerm(field.value || "");
                        } else if (!isOpen && !equipmentNameValue) {
                            setCategorySearchTerm(""); // Clear search if no equipment
                        }
                      }}
                    >
                      <PopoverTrigger asChild disabled={!equipmentNameValue || categoriesForSelectedEquipmentName.length === 0}>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={categoryPopoverOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                              (!equipmentNameValue || categoriesForSelectedEquipmentName.length === 0) && "cursor-not-allowed opacity-50"
                            )}
                          >
                            {field.value || (equipmentNameValue && categoriesForSelectedEquipmentName.length > 0 ? "اختر الصنف..." : "(لا يوجد صنف متوفر)")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                       {equipmentNameValue && categoriesForSelectedEquipmentName.length > 0 && (
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="ابحث عن صنف..."
                              value={categorySearchTerm}
                              onValueChange={setCategorySearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على صنف.</CommandEmpty>
                              <CommandGroup>
                                {filteredCategoriesForSelectedEquipmentName.map((cat) => (
                                  <CommandItem
                                    key={cat}
                                    value={cat}
                                    onSelect={() => {
                                      form.setValue("category", cat === "(بدون صنف)" ? "" : cat, { shouldValidate: true });
                                      setCategoryPopoverOpen(false);
                                      setCategorySearchTerm(cat);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        (cat === "(بدون صنف)" ? "" : cat) === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {cat}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      )}
                    </Popover>
                  )}
                  <FormDescription>
                    {type === 'receive' ? "اختر صنفًا موجودًا أو أدخل اسم صنف جديد. سيتم استخدامه كصنف افتراضي إذا كان هذا اسم تجهيز جديد." 
                                       : "اختر صنف التجهيز من الأصناف المتوفرة لهذا التجهيز في المخزون."}
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
                      onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                      value={field.value ?? ''}
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
                  <Popover open={partyPopoverOpen} onOpenChange={(isOpen) => {
                      setPartyPopoverOpen(isOpen);
                      if(isOpen && field.value) {
                        setPartySearchTerm(field.value);
                      } else if (!isOpen) {
                        setPartySearchTerm(field.value || "");
                      }
                  }}>
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
                          onValueChange={(search) => {
                            setPartySearchTerm(search);
                            form.setValue("party", search, {shouldValidate: true});
                          }}
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
                                  form.setValue("party", p.name, {shouldValidate: true});
                                  setPartyPopoverOpen(false);
                                  setPartySearchTerm(p.name);
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
                                  form.setValue("party", partySearchTerm, {shouldValidate: true});
                                  setPartyPopoverOpen(false);
                                  setPartySearchTerm(partySearchTerm);
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

            {type === 'dispatch' && partyValue && (
              <FormField
                control={form.control}
                name="withdrawalOfficerName" 
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center">
                      <UserCheck className="ml-1 h-4 w-4 text-muted-foreground" />
                      المكلف بالسحب
                    </FormLabel>
                    <Popover open={withdrawalOfficerPopoverOpen} onOpenChange={setWithdrawalOfficerPopoverOpen} >
                      <PopoverTrigger asChild disabled={employeesOfSelectedParty.length === 0}>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={withdrawalOfficerPopoverOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                              employeesOfSelectedParty.length === 0 && "cursor-not-allowed opacity-50"
                            )}
                          >
                            {
                              (() => {
                                const officerName = form.getValues("withdrawalOfficerName");
                                const officerRank = form.getValues("withdrawalOfficerRank");
                            
                                if (officerName && officerRank !== undefined) {
                                  const selectedEmp = employeesOfSelectedParty.find(
                                    (emp) =>
                                      `${emp.firstName} ${emp.lastName}` === officerName &&
                                      emp.rank === officerRank
                                  );
                                  if (selectedEmp) {
                                    return `${selectedEmp.firstName} ${selectedEmp.lastName} - ${selectedEmp.employeeNumber}`;
                                  }
                                  return `${officerRank} ${officerName}`; 
                                }
                                return employeesOfSelectedParty.length > 0
                                  ? "اختر المكلف بالسحب..."
                                  : "(لا يوجد موظفون لهذه الجهة)";
                              })()
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      {employeesOfSelectedParty.length > 0 && (
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="ابحث عن موظف..."
                              value={withdrawalOfficerSearchTerm}
                              onValueChange={setWithdrawalOfficerSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على موظف.</CommandEmpty>
                              <CommandGroup>
                                {filteredEmployees.map((emp) => (
                                  <CommandItem
                                    key={emp.id}
                                    value={`${emp.rank} ${emp.firstName} ${emp.lastName} - ${emp.employeeNumber}`}
                                    onSelect={() => {
                                      form.setValue("withdrawalOfficerName", `${emp.firstName} ${emp.lastName}`, { shouldValidate: true });
                                      form.setValue("withdrawalOfficerRank", emp.rank, { shouldValidate: true });
                                      setWithdrawalOfficerPopoverOpen(false);
                                      setWithdrawalOfficerSearchTerm(`${emp.rank} ${emp.firstName} ${emp.lastName} - ${emp.employeeNumber}`);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        `${emp.firstName} ${emp.lastName}` === field.value && emp.rank === form.getValues("withdrawalOfficerRank")
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {`${emp.rank} ${emp.firstName} ${emp.lastName} - ${emp.employeeNumber}`}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      )}
                    </Popover>
                    <FormDescription>
                      اختر الموظف المكلف باستلام التجهيزات من الجهة المستلمة.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}


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

    