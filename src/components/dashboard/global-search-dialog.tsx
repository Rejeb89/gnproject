
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTransactions, getEquipmentDefinitions, getParties } from "@/lib/store";
import type { Transaction, EquipmentDefinition, Party } from "@/lib/types";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search as SearchIconLucide, Package, Building, ListChecks, ExternalLink } from 'lucide-react'; // Renamed Search to avoid conflict
import { Badge } from '@/components/ui/badge'; // Corrected import path
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResultItem {
  id: string;
  type: 'transaction' | 'equipmentDefinition' | 'party';
  title: string;
  description?: string;
  link: string;
  category?: string; 
  date?: string; 
  partyName?: string; 
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const allTransactions = useMemo(() => open ? getTransactions() : [], [open]);
  const allEquipmentDefinitions = useMemo(() => open ? getEquipmentDefinitions() : [], [open]);
  const allParties = useMemo(() => open ? getParties() : [], [open]);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setResults([]);
      return;
    }

    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const term = searchTerm.toLowerCase();
    const foundResults: SearchResultItem[] = [];

    // Search Transactions
    allTransactions.forEach(tx => {
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
          link: `/dashboard/equipment`, // Updated link
          category: tx.category,
          date: format(new Date(tx.date), "d MMM yyyy", { locale: arSA }),
          partyName: tx.party,
        });
      }
    });

    // Search Equipment Definitions
    allEquipmentDefinitions.forEach(def => {
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
          link: `/dashboard/equipment`, 
        });
      }
    });

    // Search Parties
    allParties.forEach(party => {
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
    
    setResults(foundResults.slice(0, 50)); 
    setIsLoading(false);

  }, [searchTerm, open, allTransactions, allEquipmentDefinitions, allParties]);

  const groupedResults = useMemo(() => {
    return results.reduce((acc, result) => {
      (acc[result.type] = acc[result.type] || []).push(result);
      return acc;
    }, {} as Record<SearchResultItem['type'], SearchResultItem[]>);
  }, [results]);


  const getResultIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'transaction': return <ListChecks className="h-5 w-5 text-blue-500" />;
      case 'equipmentDefinition': return <Package className="h-5 w-5 text-green-500" />;
      case 'party': return <Building className="h-5 w-5 text-purple-500" />;
      default: return null;
    }
  };
  
  const getResultTypeLabel = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'transaction': return "المعاملات";
      case 'equipmentDefinition': return "أنواع التجهيزات";
      case 'party': return "الجهات";
      default: return "";
    }
  };

  const ResultsSkeleton = () => (
    <div className="space-y-6">
      {[...Array(2)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <ul className="space-y-2">
            {[...Array(3)].map((_, j) => (
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
          {/* <DialogDescription>
            ابحث عن معاملات، أنواع تجهيزات، أو جهات.
          </DialogDescription> */}
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

          {!isLoading && searchTerm.trim().length >=2 && results.length > 0 && Object.entries(groupedResults).map(([type, items]) => (
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
                        {item.type === 'transaction' && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {item.category && <Badge variant="secondary" className="text-xs px-2 py-0.5">{item.category}</Badge>}
                                {item.partyName && <Badge variant="outline" className="text-xs px-2 py-0.5">{item.partyName}</Badge>}
                                {item.date && <Badge variant="outline" className="text-xs px-2 py-0.5">{item.date}</Badge>}
                            </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
