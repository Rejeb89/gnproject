"use client"; // This module is client-side only

import * as XLSX from 'xlsx';
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface ExcelTransactionRow {
  "المعرف": string;
  "نوع العملية": string;
  "اسم التجهيز": string;
  "الكمية": number;
  "الجهة": string;
  "التاريخ": string;
  "رقم الوصل": string;
  "ملاحظات"?: string;
}

export function exportTransactionsToExcel(transactions: Transaction[]): void {
  if (typeof window === 'undefined' || transactions.length === 0) return;

  const dataForExcel: ExcelTransactionRow[] = transactions.map(tx => ({
    "المعرف": tx.id,
    "نوع العملية": tx.type === 'receive' ? 'استلام' : 'تسليم',
    "اسم التجهيز": tx.equipmentName,
    "الكمية": tx.quantity,
    "الجهة": tx.party,
    "التاريخ": format(new Date(tx.date), "yyyy/MM/dd HH:mm", { locale: arSA }),
    "رقم الوصل": tx.receiptNumber,
    "ملاحظات": tx.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  
  // Set column widths (optional, for better readability)
  // Widths are in character units.
  const columnWidths = [
    { wch: 38 }, // ID
    { wch: 15 }, // Type
    { wch: 30 }, // Equipment Name
    { wch: 10 }, // Quantity
    { wch: 30 }, // Party
    { wch: 20 }, // Date
    { wch: 20 }, // Receipt Number
    { wch: 40 }, // Notes
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل العمليات');

  // Generate Excel file and trigger download
  const today = format(new Date(), "yyyy-MM-dd");
  XLSX.writeFile(workbook, `EquipTrack_سجل_العمليات_${today}.xlsx`);
}
