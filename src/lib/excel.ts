
"use client"; // This module is client-side only

import * as XLSX from 'xlsx';
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface ExcelTransactionRow {
  "المعرف": string;
  "نوع العملية": string;
  "اسم التجهيز": string;
  "صنف التجهيز"?: string; // Added category
  "الكمية": number;
  "الجهة": string;
  "التاريخ": string;
  "رقم الوصل": string;
  "ملاحظات"?: string;
}

export function exportTransactionsToExcel(transactions: Transaction[], reportTitle?: string): void {
  if (typeof window === 'undefined' || transactions.length === 0) return;

  const dataForExcel: ExcelTransactionRow[] = transactions.map(tx => ({
    "المعرف": tx.id,
    "نوع العملية": tx.type === 'receive' ? 'استلام' : 'تسليم',
    "اسم التجهيز": tx.equipmentName,
    "صنف التجهيز": tx.category || '', 
    "الكمية": tx.quantity,
    "الجهة": tx.party,
    "التاريخ": format(new Date(tx.date), "yyyy/MM/dd HH:mm", { locale: arSA }),
    "رقم الوصل": tx.receiptNumber,
    "ملاحظات": tx.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

  // Set column widths
  const columnWidths = [
    { wch: 38 }, // ID
    { wch: 15 }, // Type
    { wch: 30 }, // Equipment Name
    { wch: 20 }, // Category
    { wch: 10 }, // Quantity
    { wch: 30 }, // Party
    { wch: 20 }, // Date
    { wch: 20 }, // Receipt Number
    { wch: 40 }, // Notes
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  const sheetName = (reportTitle || 'التقارير').substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName); 

  const today = format(new Date(), "yyyy-MM-dd");
  // The filename itself can be longer, this part is not affected by the sheet name limit.
  const finalReportTitleForFileName = reportTitle ? reportTitle.replace(/\s+/g, '_') : 'التقارير';
  XLSX.writeFile(workbook, `EquipSupplyMetlaoui_${finalReportTitleForFileName}_${today}.xlsx`);
}

