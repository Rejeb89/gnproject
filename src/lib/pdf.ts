
"use client"; // This module is client-side only

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Ensure this is installed or handle if not
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

// ===================================================================================
// هام جداً: لدعم اللغة العربية بشكل صحيح، يجب توفير خط عربي بصيغة Base64.
// 1. قم بتنزيل ملف خط .ttf يدعم العربية (مثل خط Amiri).
// 2. قم بتحويل ملف الخط إلى سلسلة Base64 (ابحث عن "ttf to base64 converter" عبر الإنترنت).
// 3. الصق سلسلة Base64 الكاملة أدناه بدلاً من النص التوضيحي.
// ===================================================================================
const ARABIC_FONT_BASE64 = `
// الصق هنا سلسلة Base64 الكاملة لملف الخط العربي .ttf
// مثال (هذه ليست بيانات خط حقيقية، يجب استبدالها):
// JVBERi0xLjQKMyAwIG9iago8PA0KL0xpbmVhcml6ZWQgMQ0KL0wgNzU5MzYNCi9IIFsgNTU5ID...
// تأكد من إزالة هذه التعليقات بعد لصق بيانات الخط.
`;

const FONT_NAME_IN_VFS = 'ArabicCustomFont.ttf'; // يمكنك اختيار أي اسم هنا
const FONT_FAMILY_NAME = 'ArabicCustom'; // الاسم الذي ستستخدمه مع setFont

const addCustomFont = (doc: jsPDF) => {
  try {
    if (ARABIC_FONT_BASE64 && ARABIC_FONT_BASE64.trim() !== '' && !ARABIC_FONT_BASE64.includes("الصق هنا")) {
      doc.addFileToVFS(FONT_NAME_IN_VFS, ARABIC_FONT_BASE64.trim());
      doc.addFont(FONT_NAME_IN_VFS, FONT_FAMILY_NAME, 'normal');
      doc.setFont(FONT_FAMILY_NAME, 'normal');
    } else {
      console.warn("بيانات الخط العربي (Base64) غير متوفرة أو غير صحيحة. قد لا تظهر النصوص العربية بشكل صحيح. يرجى مراجعة التعليقات في src/lib/pdf.ts.");
      // Fallback to a standard font, Arabic might not render correctly
      doc.setFont('Helvetica');
    }
  } catch (e) {
    console.error("حدث خطأ أثناء إضافة الخط العربي إلى PDF:", e);
    doc.setFont('Helvetica'); // Fallback in case of error
  }
};


export function generateReceiptPdf(transaction: Transaction): void {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF();
  addCustomFont(doc); // يجب استدعاؤها أولاً لتجهيز الخط

  doc.setProperties({
    title: `وصل ${transaction.type === 'receive' ? 'استلام' : 'تسليم'} - ${transaction.receiptNumber}`,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // دالة محسنة للكتابة من اليمين لليسار مع الخط المخصص
  const writeRtl = (text: string, y: number, options?: any) => {
    // تأكد من أن الخط المخصص هو النشط
    // قد تحتاج إلى إعادة تعيينه إذا تم استخدام خطوط أخرى في مكان ما
    if (ARABIC_FONT_BASE64 && ARABIC_FONT_BASE64.trim() !== '' && !ARABIC_FONT_BASE64.includes("الصق هنا")) {
      doc.setFont(FONT_FAMILY_NAME, 'normal');
    } else {
      doc.setFont('Helvetica'); // Fallback
    }
    
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - textWidth, y, options);
  };
  
  // يجب أن تكون جميع استدعاءات doc.setFontSize قبل writeRtl إذا كانت تغير حجم الخط
  // لأن getTextWidth يعتمد على حجم الخط الحالي.

  doc.setFontSize(18);
  const title = `وصل ${transaction.type === 'receive' ? 'استــلام' : 'تسليــم'} تجهيزات`;
  writeRtl(title, 20);

  doc.setFontSize(10); // غير حجم الخط قبل قياس النص التالي
  writeRtl(`رقم الوصل: ${transaction.receiptNumber}`, 30);
  const formattedDate = format(new Date(transaction.date), "PPPpp", { locale: arSA });
  writeRtl(`التاريخ: ${formattedDate}`, 38);

  doc.setLineWidth(0.5);
  doc.line(margin, 45, pageWidth - margin, 45);

  doc.setFontSize(12); // أعد حجم الخط للمحتوى
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
    // كل النصوص يجب أن تُكتب بالخط العربي
    const labelText = `${detail.label}`;
    const valueText = `${detail.value}`;
    const fullText = `${labelText} ${valueText}`; // قد تحتاج إلى تعديل الترتيب هنا إذا لزم الأمر للغة العربية
    
    // لضمان محاذاة صحيحة:
    // 1. اطبع الـ label (يمين)
    // 2. اطبع الـ value (يسار الـ label)
    // هذا الجزء يحتاج تعديل ليكون أكثر دقة للمحاذاة.
    // الطريقة الأبسط هي دمج النص كما هو في fullText والاعتماد على writeRtl.
    
    // طريقة أبسط حالياً:
    writeRtl(fullText, yPos);
    yPos += 8;
  });

  yPos += 10;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  doc.setFontSize(11); // غير حجم الخط للتواقيع
  const signatureParty1 = transaction.type === 'receive' ? "توقيع المستلم (المخزن):" : "توقيع المسلّم (المخزن):";
  const signatureParty2 = transaction.type === 'receive' ? "توقيع المسلّم (الجهة):" : "توقيع المستلم (الجهة):";

  writeRtl(signatureParty1, yPos);
  yPos += 20; // مسافة أقل قليلاً
  writeRtl("____________________", yPos);
  yPos += 10;


  writeRtl(signatureParty2, yPos);
  yPos += 20;
  writeRtl("____________________", yPos);


  const footerText = "قسم التجهيز بمنطقة الحرس الوطني بالمتلوي - نظام إدارة المستودعات";
  doc.setFontSize(8); // غير حجم الخط للتذييل
  // بما أن التذييل قد يكون ثابتًا، يمكننا وضعه في الهامش الأيسر كالمعتاد أو توسيطه
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, doc.internal.pageSize.getHeight() - 10);

  doc.save(`receipt_${transaction.type}_${transaction.receiptNumber}_${transaction.id.substring(0,8)}.pdf`);
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
