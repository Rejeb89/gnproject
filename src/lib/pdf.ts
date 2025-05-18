
"use client"; // This module is client-side only

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Ensure this is installed or handle if not
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

// Function to load a font that supports Arabic
const addCustomFont = (doc: jsPDF) => {
  // Placeholder: In a real scenario, you would add a base64 encoded TTF font here
  try {
    doc.setFont('Helvetica'); // Or a known available font
  } catch (e) {
    console.warn("Font not found, using default. Arabic text might not render correctly.", e);
  }
};


export function generateReceiptPdf(transaction: Transaction): void {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF();
  addCustomFont(doc);

  doc.setProperties({
    title: `وصل ${transaction.type === 'receive' ? 'استلام' : 'تسليم'} - ${transaction.receiptNumber}`,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const writeRtl = (text: string, y: number, options?: any) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - textWidth, y, options);
  };

  doc.setFontSize(18);
  const title = `وصل ${transaction.type === 'receive' ? 'استــلام' : 'تسليــم'} تجهيزات`;
  writeRtl(title, 20);

  doc.setFontSize(10);
  writeRtl(`رقم الوصل: ${transaction.receiptNumber}`, 30);
  const formattedDate = format(new Date(transaction.date), "PPPpp", { locale: arSA });
  writeRtl(`التاريخ: ${formattedDate}`, 38);

  doc.setLineWidth(0.5);
  doc.line(margin, 45, pageWidth - margin, 45);

  doc.setFontSize(12);
  let yPos = 55;

  const details = [
    { label: "اسم التجهيز:", value: transaction.equipmentName },
  ];
  if (transaction.category) {
    details.push({ label: "صنف التجهيز:", value: transaction.category });
  }
  details.push(
    { label: "الكمية:", value: transaction.quantity.toString() },
    { label: transaction.type === 'receive' ? "الجهة المرسلة:" : "الجهة المستلمة:", value: transaction.party }
  );


  if (transaction.notes) {
    details.push({ label: "ملاحظات:", value: transaction.notes });
  }

  details.forEach(detail => {
    writeRtl(`${detail.label} ${detail.value}`, yPos);
    yPos += 8;
  });

  yPos += 10;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  doc.setFontSize(11);
  const signatureParty1 = transaction.type === 'receive' ? "توقيع المستلم (المخزن):" : "توقيع المسلّم (المخزن):";
  const signatureParty2 = transaction.type === 'receive' ? "توقيع المسلّم (الجهة):" : "توقيع المستلم (الجهة):";

  writeRtl(signatureParty1, yPos);
  yPos += 25;
  writeRtl("____________________", yPos-5);


  writeRtl(signatureParty2, yPos);
  yPos += 25;
  writeRtl("____________________", yPos-5);


  const footerText = "قسم التجهيز بمنطقة الحرس الوطني بالمتلوي - نظام إدارة المستودعات";
  doc.setFontSize(8);
  doc.text(footerText, margin, doc.internal.pageSize.getHeight() - 10);

  doc.save(`receipt_${transaction.type}_${transaction.receiptNumber}_${transaction.id.substring(0,8)}.pdf`);
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
