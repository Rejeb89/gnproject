
"use client";

import React, { useEffect, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ChevronsUpDown, Check, Building, Car, Fuel, Droplet } from "lucide-react";
import { vehicleFormSchema, type VehicleFormValues } from "./vehicle-form-schema";
import type { Vehicle, Party } from "@/lib/types";
import { getParties, addParty } from "@/lib/store";
import { cn } from "@/lib/utils";

interface VehicleFormProps {
  onSubmit: (values: VehicleFormValues) => void;
  onCancel: () => void;
  initialData?: Vehicle | null;
  existingRegistrationNumbers?: string[];
}

export function VehicleForm({
  onSubmit,
  onCancel,
  initialData,
  existingRegistrationNumbers = [],
}: VehicleFormProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [partyPopoverOpen, setPartyPopoverOpen] = useState(false);
  const [partySearchTerm, setPartySearchTerm] = useState(initialData?.owningParty || "");

  useEffect(() => {
    setParties(getParties());
  }, []);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(
      vehicleFormSchema.refine(
        (data) => {
          if (!initialData || initialData.registrationNumber.toLowerCase() !== data.registrationNumber.toLowerCase()) {
            return !existingRegistrationNumbers.some(
              (regNum) => regNum.toLowerCase() === data.registrationNumber.toLowerCase()
            );
          }
          return true;
        },
        {
          message: "هذا الرقم المنجمي مسجل لمركبة أخرى.",
          path: ["registrationNumber"],
        }
      )
    ),
    defaultValues: {
      type: initialData?.type || "",
      registrationNumber: initialData?.registrationNumber || "",
      owningParty: initialData?.owningParty || "",
      fuelType: initialData?.fuelType || undefined,
      fuelAllowanceLiters: initialData?.fuelAllowanceLiters || undefined,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        type: initialData.type,
        registrationNumber: initialData.registrationNumber,
        owningParty: initialData.owningParty,
        fuelType: initialData.fuelType || undefined,
        fuelAllowanceLiters: initialData.fuelAllowanceLiters || undefined,
      });
      setPartySearchTerm(initialData.owningParty || "");
    } else {
      form.reset({
        type: "",
        registrationNumber: "",
        owningParty: "",
        fuelType: undefined,
        fuelAllowanceLiters: undefined,
      });
      setPartySearchTerm("");
    }
  }, [initialData, form]);

  const handleSubmit = (values: VehicleFormValues) => {
    addParty(values.owningParty); // Ensure party exists
    onSubmit(values);
    if (!initialData) {
      form.reset();
      setPartySearchTerm("");
    }
  };
  
  const filteredParties = partySearchTerm
    ? parties.filter(p => p.name.toLowerCase().includes(partySearchTerm.toLowerCase()))
    : parties;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Car className="h-4 w-4 text-muted-foreground" />
                نوع المركبة
              </FormLabel>
              <FormControl>
                <Input placeholder="مثال: سيارة إسعاف، شاحنة نقل" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الرقم المنجمي</FormLabel>
              <FormControl>
                <Input placeholder="مثال: 123 تونس 4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owningParty"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                الجهة التابعة لها
              </FormLabel>
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
                        : "اختر أو أدخل اسم الجهة..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="ابحث عن جهة..."
                      value={partySearchTerm}
                      onValueChange={(search) => {
                        setPartySearchTerm(search);
                        form.setValue("owningParty", search, {shouldValidate: true});
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
                              form.setValue("owningParty", p.name, {shouldValidate: true});
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
                              form.setValue("owningParty", partySearchTerm, {shouldValidate: true});
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

        <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Droplet className="h-4 w-4 text-muted-foreground" />
                نوع الوقود (اختياري)
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الوقود" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="petrol">بنزين</SelectItem>
                  <SelectItem value="diesel">غازوال</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fuelAllowanceLiters"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                مقرر المحروقات (لتر - اختياري)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="مثال: 100"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                  min="0"
                />
              </FormControl>
              <FormDescription>
                الكمية المخصصة للمركبة من المحروقات باللتر.
              </FormDescription>
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
            {initialData ? "حفظ التعديلات" : "إضافة المركبة"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
