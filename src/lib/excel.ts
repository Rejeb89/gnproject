
"use client"; // This module is client-side only

import * as XLSX from 'xlsx';
import type { Transaction, Spending } from '@/lib/types'; // Added Spending
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface ExcelTransactionRow {
  "المعرف": string;
  "نوع العملية": string;
  "اسم التجهيز": string;
  "صنف التجهيز"?: string; 
  "الكمية": number;
  "الجهة": string;
  "رتبة المكلف بالسحب"?: string;
  "اسم المكلف بالسحب"?: string;
  "التاريخ": string;
  "رقم الوصل": string;
  "ملاحظات"?: string;
}

interface ExcelSpendingRow {
    "معرف الصرف": string;
    "معرف الاعتماد": string; // Could be replaced with Appropriation Name if needed
    "اسم الاعتماد"?: string; // If you pass appropriations to map
    "المبلغ المصروف": string; // Formatted as currency
    "تاريخ الصرف": string;
    "المزود"?: string;
    "الوصف"?: string;
    "رقم طلب التزود"?: string;
    "تاريخ طلب التزود"?: string;
    "ملف طلب التزود"?: string;
    "رقم الفاتورة"?: string;
    "تاريخ الفاتورة"?: string;
    "ملف الفاتورة"?: string;
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
    "رتبة المكلف بالسحب": tx.type === 'dispatch' ? tx.withdrawalOfficerRank || '' : '',
    "اسم المكلف بالسحب": tx.type === 'dispatch' ? tx.withdrawalOfficerName || '' : '',
    "التاريخ": format(new Date(tx.date), "yyyy/MM/dd HH:mm", { locale: arSA }),
    "رقم الوصل": tx.receiptNumber,
    "ملاحظات": tx.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

  const columnWidths = [
    { wch: 38 }, // ID
    { wch: 15 }, // Type
    { wch: 30 }, // Equipment Name
    { wch: 20 }, // Category
    { wch: 10 }, // Quantity
    { wch: 30 }, // Party
    { wch: 20 }, // Officer Rank
    { wch: 30 }, // Officer Name
    { wch: 20 }, // Date
    { wch: 20 }, // Receipt Number
    { wch: 40 }, // Notes
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  const sheetName = (reportTitle || 'التقارير').substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName); 

  const today = format(new Date(), "yyyy-MM-dd");
  const finalReportTitleForFileName = reportTitle ? reportTitle.replace(/\s+/g, '_') : 'التقارير';
  XLSX.writeFile(workbook, `EquipSupplyMetlaoui_${finalReportTitleForFileName}_${today}.xlsx`);
}

// New function to export spendings
export function exportSpendingsToExcel(
  spendings: Spending[],
  reportTitle?: string,
  appropriationsMap?: Record<string, string> // Optional: { appropriationId: appropriationName }
): void {
  if (typeof window === 'undefined' || spendings.length === 0) return;

  const formatCurrencyForExcel = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} د.ت`;
  };

  const dataForExcel: ExcelSpendingRow[] = spendings.map(sp => ({
    "معرف الصرف": sp.id,
    "معرف الاعتماد": sp.appropriationId,
    "اسم الاعتماد": appropriationsMap ? appropriationsMap[sp.appropriationId] || sp.appropriationId : sp.appropriationId,
    "المبلغ المصروف": formatCurrencyForExcel(sp.spentAmount),
    "تاريخ الصرف": format(new Date(sp.spendingDate), "yyyy/MM/dd", { locale: arSA }),
    "المزود": sp.supplier || '',
    "الوصف": sp.description || '',
    "رقم طلب التزود": sp.supplyRequestNumber || '',
    "تاريخ طلب التزود": sp.supplyRequestDate ? format(new Date(sp.supplyRequestDate), "yyyy/MM/dd", { locale: arSA }) : '',
    "ملف طلب التزود": sp.supplyRequestFileName || '',
    "رقم الفاتورة": sp.invoiceNumber || '',
    "تاريخ الفاتورة": sp.invoiceDate ? format(new Date(sp.invoiceDate), "yyyy/MM/dd", { locale: arSA }) : '',
    "ملف الفاتورة": sp.invoiceFileName || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

  const columnWidths = [
    { wch: 38 }, // Spending ID
    { wch: 38 }, // Appropriation ID
    { wch: 30 }, // Appropriation Name
    { wch: 20 }, // Spent Amount
    { wch: 15 }, // Spending Date
    { wch: 25 }, // Supplier
    { wch: 40 }, // Description
    { wch: 20 }, // Supply Request Number
    { wch: 20 }, // Supply Request Date
    { wch: 30 }, // Supply Request File Name
    { wch: 20 }, // Invoice Number
    { wch: 20 }, // Invoice Date
    { wch: 30 }, // Invoice File Name
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  const sheetName = (reportTitle || 'تقرير_المصروفات').substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName); 

  const today = format(new Date(), "yyyy-MM-dd");
  const finalReportTitleForFileName = reportTitle ? reportTitle.replace(/\s+/g, '_') : 'تقرير_المصروفات';
  XLSX.writeFile(workbook, `EquipSupplyMetlaoui_${finalReportTitleForFileName}_${today}.xlsx`);
}
