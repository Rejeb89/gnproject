
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getTransactions,
  getEquipmentDefinitions,
  getParties,
  getPartyEmployees,
  getCalendarEvents,
  getVehicles,
  getFixedFurniture,
  getAppropriations,
  getSpendings
} from "@/lib/store";
import type {
  Transaction,
  EquipmentDefinition,
  Party,
  PartyEmployee,
  CalendarEvent,
  Vehicle,
  FixedFurnitureItem,
  Appropriation,
  Spending
} from "@/lib/types";
import Link from 'next/link';
import { Search as SearchIconLucide, Package, Building, ListChecks, ExternalLink, CalendarDays, Car, Archive, Landmark, HandCoins, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResultItem {
  id: string;
  type: 'transaction' | 'equipmentDefinition' | 'party' | 'partyEmployee' | 'calendarEvent' | 'vehicle' | 'fixedFurniture' | 'appropriation' | 'spending';
  title: string;
  description?: string;
  link: string;
  category?: string;
  date?: string;
  partyName?: string;
  subPartyName?: string; // For items linked to a party, like employees or furniture
  meta?: string; // For additional small info like rank, status etc.
}

const MAX_RESULTS_PER_TYPE = 10;
const TOTAL_MAX_RESULTS = 50;

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize data fetching to only run when dialog opens or data sources might change
  const allData = useMemo(() => {
    if (!open) return null;
    return {
      transactions: getTransactions(),
      equipmentDefinitions: getEquipmentDefinitions(),
      parties: getParties(),
      calendarEvents: getCalendarEvents(),
      vehicles: getVehicles(),
      appropriations: getAppropriations(),
      spendings: getSpendings(),
      // Nested data needs special handling
      allPartyEmployees: (() => {
        const parties = getParties();
        const employeesMap: Record<string, PartyEmployee[]> = {};
        parties.forEach(p => employeesMap[p.id] = getPartyEmployees(p.id));
        return employeesMap;
      })(),
      allFixedFurniture: (() => {
        const parties = getParties();
        const furnitureMap: Record<string, FixedFurnitureItem[]> = {};
        parties.forEach(p => furnitureMap[p.id] = getFixedFurniture(p.id));
        return furnitureMap;
      })(),
    };
  }, [open]);

  useEffect(() => {
    if (!open || !allData) {
      setSearchTerm('');
      setResults([]);
      return;
    }

    if (searchTerm.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const term = searchTerm.toLowerCase();
    let foundResults: SearchResultItem[] = [];

    // Search Transactions
    allData.transactions.forEach(tx => {
      if (
        tx.equipmentName.toLowerCase().includes(term) ||
        (tx.category || '').toLowerCase().includes(term) ||
        tx.party.toLowerCase().includes(term) ||
        (tx.notes || '').toLowerCase().includes(term) ||
        tx.receiptNumber.toLowerCase().includes(term) ||
        (tx.withdrawalOfficerName || '').toLowerCase().includes(term) ||
        (tx.withdrawalOfficerRank || '').toLowerCase().includes(term)
      ) {
        foundResults.push({
          id: tx.id,
          type: 'transaction',
          title: `${tx.type === 'receive' ? 'استلام' : 'تسليم'}: ${tx.equipmentName}`,
          description: `الكمية: ${tx.quantity}, الجهة: ${tx.party}, الوصل: ${tx.receiptNumber}`,
          link: `/dashboard/equipment#transaction-${tx.id}`, // Link to equipment page, section for transactions
          category: tx.category,
          date: format(parseISO(tx.date), "d MMM yyyy", { locale: arSA }),
          partyName: tx.party,
        });
      }
    });

    // Search Equipment Definitions
    allData.equipmentDefinitions.forEach(def => {
      if (
        def.name.toLowerCase().includes(term) ||
        (def.defaultCategory || '').toLowerCase().includes(term) ||
        (def.unitOfMeasurement || '').toLowerCase().includes(term)
      ) {
        foundResults.push({
          id: def.id,
          type: 'equipmentDefinition',
          title: def.name,
          description: `الصنف الافتراضي: ${def.defaultCategory || '-'}, حد التنبيه: ${def.defaultLowStockThreshold || '-'}`,
          link: `/dashboard/equipment#definition-${def.id}`,
        });
      }
    });

    // Search Parties
    allData.parties.forEach(party => {
      if (party.name.toLowerCase().includes(term)) {
        foundResults.push({
          id: party.id,
          type: 'party',
          title: party.name,
          description: `جهة مسجلة`,
          link: `/dashboard/parties/${party.id}`,
        });
      }
    });

    // Search Party Employees
    allData.parties.forEach(party => {
      const employees = allData.allPartyEmployees[party.id] || [];
      employees.forEach(emp => {
        if (
          emp.rank.toLowerCase().includes(term) ||
          emp.firstName.toLowerCase().includes(term) ||
          emp.lastName.toLowerCase().includes(term) ||
          emp.employeeNumber.toLowerCase().includes(term)
        ) {
          foundResults.push({
            id: `${party.id}-${emp.id}`,
            type: 'partyEmployee',
            title: `${emp.rank} ${emp.firstName} ${emp.lastName}`,
            description: `رقم: ${emp.employeeNumber}`,
            link: `/dashboard/parties/${party.id}#employee-${emp.id}`,
            subPartyName: party.name,
            meta: emp.rank,
          });
        }
      });
    });

    // Search Calendar Events
    allData.calendarEvents.forEach(event => {
      if (
        event.title.toLowerCase().includes(term) ||
        (event.description || '').toLowerCase().includes(term)
      ) {
        foundResults.push({
          id: event.id,
          type: 'calendarEvent',
          title: event.title,
          description: event.description,
          link: `/dashboard/calendar#event-${event.id}`,
          date: format(parseISO(event.date), "d MMM yyyy HH:mm", { locale: arSA }),
        });
      }
    });

    // Search Vehicles
    allData.vehicles.forEach(vehicle => {
      if (
        vehicle.type.toLowerCase().includes(term) ||
        vehicle.registrationNumber.toLowerCase().includes(term) ||
        vehicle.owningParty.toLowerCase().includes(term)
      ) {
        foundResults.push({
          id: vehicle.id,
          type: 'vehicle',
          title: `${vehicle.type} - ${vehicle.registrationNumber}`,
          description: `تابعة لـ: ${vehicle.owningParty}`,
          link: `/dashboard/vehicles#vehicle-${vehicle.id}`,
        });
      }
    });

    // Search Fixed Furniture
    allData.parties.forEach(party => {
      const furnitureItems = allData.allFixedFurniture[party.id] || [];
      furnitureItems.forEach(item => {
        if (
          item.equipmentType.toLowerCase().includes(term) ||
          (item.administrativeNumbering || '').toLowerCase().includes(term) ||
          (item.serialNumber || '').toLowerCase().includes(term) ||
          (item.location || '').toLowerCase().includes(term) ||
          (item.status || '').toLowerCase().includes(term)
        ) {
          foundResults.push({
            id: `${party.id}-${item.id}`,
            type: 'fixedFurniture',
            title: item.equipmentType,
            description: `الكمية: ${item.quantity}, الرقم الإداري: ${item.administrativeNumbering || '-'}, الموقع: ${item.location || '-'}`,
            link: `/dashboard/parties/${party.id}#furniture-${item.id}`,
            subPartyName: party.name,
            meta: item.status,
          });
        }
      });
    });

    // Search Appropriations
    allData.appropriations.forEach(approp => {
      if (
        approp.name.toLowerCase().includes(term) ||
        (approp.description || '').toLowerCase().includes(term)
      ) {
        foundResults.push({
          id: approp.id,
          type: 'appropriation',
          title: approp.name,
          description: `المبلغ المرصود: ${approp.allocatedAmount.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})} د.ت`,
          link: `/dashboard/appropriations#appropriation-${approp.id}`,
        });
      }
    });

    // Search Spendings
    allData.spendings.forEach(spending => {
      const appropriation = allData.appropriations.find(a => a.id === spending.appropriationId);
      if (
        (spending.description || '').toLowerCase().includes(term) ||
        (spending.supplier || '').toLowerCase().includes(term) ||
        (spending.supplyRequestNumber || '').toLowerCase().includes(term) ||
        (spending.invoiceNumber || '').toLowerCase().includes(term)
      ) {
        foundResults.push({
          id: spending.id,
          type: 'spending',
          title: `صرف: ${spending.spentAmount.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})} د.ت`,
          description: `للاعتماد: ${appropriation?.name || 'غير معروف'}. ${spending.description || ''}`,
          link: `/dashboard/appropriations#spending-${spending.id}`, // Might need to link to specific appropriation
          date: format(parseISO(spending.spendingDate), "d MMM yyyy", { locale: arSA }),
          partyName: spending.supplier, // Using partyName for supplier here
        });
      }
    });

    // Sort results by title, then limit total results
    foundResults.sort((a, b) => a.title.localeCompare(b.title));
    setResults(foundResults.slice(0, TOTAL_MAX_RESULTS));
    setIsLoading(false);

  }, [searchTerm, open, allData]);

  const groupedResults = useMemo(() => {
    return results.reduce((acc, result) => {
      (acc[result.type] = acc[result.type] || []).push(result);
      // Limit results per type
      if (acc[result.type].length > MAX_RESULTS_PER_TYPE) {
        acc[result.type] = acc[result.type].slice(0, MAX_RESULTS_PER_TYPE);
      }
      return acc;
    }, {} as Record<SearchResultItem['type'], SearchResultItem[]>);
  }, [results]);


  const getResultIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'transaction': return <ListChecks className="h-5 w-5 text-blue-500" />;
      case 'equipmentDefinition': return <Package className="h-5 w-5 text-green-500" />;
      case 'party': return <Building className="h-5 w-5 text-purple-500" />;
      case 'partyEmployee': return <User className="h-5 w-5 text-indigo-500" />;
      case 'calendarEvent': return <CalendarDays className="h-5 w-5 text-orange-500" />;
      case 'vehicle': return <Car className="h-5 w-5 text-teal-500" />;
      case 'fixedFurniture': return <Archive className="h-5 w-5 text-pink-500" />;
      case 'appropriation': return <Landmark className="h-5 w-5 text-yellow-500" />;
      case 'spending': return <HandCoins className="h-5 w-5 text-lime-500" />;
      default: return null;
    }
  };

  const getResultTypeLabel = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'transaction': return "المعاملات";
      case 'equipmentDefinition': return "أنواع التجهيزات";
      case 'party': return "الجهات";
      case 'partyEmployee': return "موظفو الجهات";
      case 'calendarEvent': return "أحداث الروزنامة";
      case 'vehicle': return "وسائل النقل";
      case 'fixedFurniture': return "الأثاث القار";
      case 'appropriation': return "الاعتمادات";
      case 'spending': return "المصروفات";
      default: return "";
    }
  };

  const ResultsSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <ul className="space-y-2">
            {[...Array(2)].map((_, j) => (
              <li key={j} className="rounded-md border p-3">
                <Skeleton className="h-5 w-2/3 mb-1" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 mt-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <SearchIconLucide className="h-6 w-6 text-primary" />
            البحث الشامل في التطبيق
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <Input
            type="search"
            placeholder="اكتب كلمة البحث هنا (حرفين على الأقل)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-base rounded-lg shadow-sm focus-visible:ring-primary"
            autoFocus
          />
        </div>

        <ScrollArea className="flex-grow overflow-y-auto px-6 pb-6">
          {isLoading && searchTerm.trim().length >= 2 && <ResultsSkeleton />}

          {!isLoading && searchTerm.trim().length >= 2 && results.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              <SearchIconLucide className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">لم يتم العثور على نتائج</p>
              <p className="text-sm">حاول استخدام كلمات بحث أخرى لكلمة "{searchTerm}".</p>
            </div>
          )}

          {!isLoading && searchTerm.trim().length < 2 && (
            <div className="text-center text-muted-foreground py-10">
              <SearchIconLucide className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">ابدأ البحث</p>
              <p className="text-sm">الرجاء إدخال حرفين على الأقل لبدء عملية البحث.</p>
            </div>
          )}

          {!isLoading && searchTerm.trim().length >= 2 && results.length > 0 && Object.entries(groupedResults).map(([type, items]) => (
            items.length > 0 && (
              <div key={type} className="mb-6 last:mb-0">
                <h3 className="text-base font-semibold mb-3 border-b pb-2 flex items-center gap-2 text-primary">
                  {getResultIcon(type as SearchResultItem['type'])}
                  نتائج قسم "{getResultTypeLabel(type as SearchResultItem['type'])}" ({items.length})
                </h3>
                <ul className="space-y-3">
                  {items.map(item => (
                    <li key={`${item.type}-${item.id}`}
                      className="rounded-lg border bg-card text-card-foreground p-3 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-150 ease-in-out">
                      <Link href={item.link} onClick={() => onOpenChange(false)} className="block group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-medium text-md group-hover:text-primary transition-colors">{item.title}</h4>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-opacity opacity-50 group-hover:opacity-100 shrink-0 mt-0.5" />
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.category && <Badge variant="secondary" className="text-xs px-2 py-0.5">{item.category}</Badge>}
                          {item.partyName && <Badge variant="outline" className="text-xs px-2 py-0.5">{item.partyName}</Badge>}
                          {item.subPartyName && <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted text-muted-foreground">{item.subPartyName}</Badge>}
                          {item.date && <Badge variant="outline" className="text-xs px-2 py-0.5">{item.date}</Badge>}
                          {item.meta && <Badge variant="info" className="text-xs px-2 py-0.5">{item.meta}</Badge>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
           {!isLoading && searchTerm.trim().length >= 2 && results.length >= TOTAL_MAX_RESULTS && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              تم عرض أول {TOTAL_MAX_RESULTS} نتيجة. قد تكون هناك نتائج أخرى، حاول تخصيص بحثك.
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    