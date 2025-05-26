
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
      doc.setFont('Helvetica');
    }
  } catch (e) {
    console.error("حدث خطأ أثناء إضافة الخط العربي إلى PDF:", e);
    doc.setFont('Helvetica');
  }
};

export function generateReceiptPdf(transaction: Transaction): void {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF({
    orientation: 'p', // portrait
    unit: 'mm',       // millimeters
    format: 'a4'      // A4 page size
  });
  addCustomFont(doc); // Ensure custom font is active

  // --- !!! هام جداً: يتطلب هذا القسم تعديلاً من المستخدم !!! ---
  // الإحداثيات (X, Y) التالية هي مجرد تقديرات أولية.
  // يجب عليك قياس النموذج المطبوع مسبقًا لديك وتعديل هذه القيم بدقة.
  // X: المسافة من الحافة اليسرى للصفحة (بالمليمتر).
  // Y: المسافة من الحافة العلوية للصفحة (بالمليمتر).

  // حقول الترويسة
  const X_RECEIPT_MAIN_NUM = 48;   const Y_RECEIPT_NUM = 24.5; // لـ "رقم" (الجزء الرئيسي)
  const X_RECEIPT_YEAR_SUFFIX = 30;                             // لـ "رقم" (لجزء السنة، مثلاً "24" بعد "20")

  const X_PARTY = 48;              const Y_PARTY = 52.5;       // لـ "الوحدة المنتفعة" أو "الجهة المسلمة"
  
  const X_REFERENCE_VALUE = 48;    const Y_REFERENCE_LINE = 59.5; // لـ "المرجع" (قيمة)
  const X_QUANTITY_VALUE = 90;                                 // لـ "عدد" (قيمة)
  const X_DATE_TOP_VALUE = 160;                                // لـ "تاريخ" (قيمة - في السطر العلوي)

  // محتوى الجدول (صف واحد من البيانات)
  // هذه الإحداثيات لقيم البيانات التي ستطبع داخل خلايا الجدول.
  const Y_TABLE_ROW_DATA = 79;    // الإحداثي Y لبيانات صف الجدول
  const X_TABLE_EQUIPMENT_DATA = 105; // الإحداثي X لبيانات "التجهيز" (منتصف الخلية تقريبًا)
  const X_TABLE_OFFICER_RANK_DATA = 45; // الإحداثي X لبيانات "الرتبة" (منتصف الخلية تقريبًا)
  const X_TABLE_OFFICER_NAME_DATA = 45; // الإحداثي X لبيانات "الاسم واللقب" (تحت الرتبة)
  
  // حقول التذييل
  const Y_NOTES_LINE = 180;         // الإحداثي Y لسطر "ملاحظة" المطبوع مسبقًا (الملاحظات الإضافية ستكون أسفله)
  const X_NOTES_ADDITIONAL_TEXT = 20;

  const Y_SIGNATURE_DATE_LINE = 200; // الإحداثي Y لسطر تاريخ التوقيع "المتلوي في"
  const X_SIGNATURE_DAY_VALUE = 40;
  const X_SIGNATURE_MONTH_VALUE = 55;
  const X_SIGNATURE_YEAR_SUFFIX_VALUE = 70; // لـ "xx" في "20xx"


  // دالة مساعدة لكتابة نص LTR (أو نص لملء فراغ يبدأ من اليسار)
  // النص سيتم محاذاته إلى يسار إحداثي X المعطى.
  const writeDataField = (text: string, x: number, y: number, fontSize: number = 10, options?: any) => {
    doc.setFontSize(fontSize);
    doc.text(text, x, y, options);
  };
  
  // --- تعبئة بيانات الـ PDF ---

  // "رقم" (رقم الوصل)
  const receiptNumParts = transaction.receiptNumber.split('-'); // مثال: "001-D-2024"
  const mainNumPart = receiptNumParts.length > 0 ? receiptNumParts[0] : transaction.receiptNumber;
  const yearPartSuffix = receiptNumParts.length > 2 ? receiptNumParts[2].substring(2) : ""; // مثال: "2024" -> "24"
  writeDataField(mainNumPart, X_RECEIPT_MAIN_NUM, Y_RECEIPT_NUM, 10);
  if (yearPartSuffix) {
    writeDataField(yearPartSuffix, X_RECEIPT_YEAR_SUFFIX, Y_RECEIPT_NUM, 10);
  }

  // "الوحدة المنتفعة" أو "الجهة المسلمة" (الجهة)
  writeDataField(transaction.party, X_PARTY, Y_PARTY, 10);
  
  // "المرجع" (رقم الوصل)
  writeDataField(transaction.receiptNumber, X_REFERENCE_VALUE, Y_REFERENCE_LINE, 10);

  // "عدد" (الكمية)
  writeDataField(transaction.quantity.toString(), X_QUANTITY_VALUE, Y_REFERENCE_LINE, 10);

  // "تاريخ" (التاريخ - في السطر العلوي)
  const formattedDateTop = format(new Date(transaction.date), "dd/MM/yyyy", { locale: arSA });
  writeDataField(formattedDateTop, X_DATE_TOP_VALUE, Y_REFERENCE_LINE, 10);

  // محتوى الجدول
  let equipmentDetails = transaction.equipmentName;
  if (transaction.category) {
    equipmentDetails += ` (${transaction.category})`;
  }
  // توسيط تفاصيل التجهيز في عمودها التقريبي
  doc.setFontSize(9); // حجم خط أصغر قليلاً لمحتوى الجدول
  const equipTextWidth = doc.getTextWidth(equipmentDetails);
  writeDataField(equipmentDetails, X_TABLE_EQUIPMENT_DATA - (equipTextWidth / 2), Y_TABLE_ROW_DATA);

  if (transaction.type === 'dispatch') { // المكلف بالسحب يظهر فقط في معاملات التسليم
    doc.setFontSize(8); // حجم خط أصغر لبيانات المكلف بالسحب
    if (transaction.withdrawalOfficerRank) {
      const rankWidth = doc.getTextWidth(transaction.withdrawalOfficerRank);
      // طباعة الرتبة فوق الاسم قليلاً لتناسب التصميم
      writeDataField(transaction.withdrawalOfficerRank, X_TABLE_OFFICER_RANK_DATA - (rankWidth/2), Y_TABLE_ROW_DATA - 1.5); 
    }
    if (transaction.withdrawalOfficerName) {
      const nameWidth = doc.getTextWidth(transaction.withdrawalOfficerName);
      // طباعة الاسم تحت الرتبة قليلاً
      writeDataField(transaction.withdrawalOfficerName, X_TABLE_OFFICER_NAME_DATA - (nameWidth/2), Y_TABLE_ROW_DATA + 2.5);
    }
  }

  // "ملاحظة" 
  // نفترض أن النموذج المطبوع يحتوي على "ملاحظة : تسلمت جميع التجهيزات المدونة بالبطاقة كاملة و جديدة"
  // نطبع فقط الملاحظات الإضافية إذا كانت موجودة ومختلفة.
  const prePrintedNoteText = "تسلمت جميع التجهيزات المدونة بالبطاقة كاملة و جديدة";
  if (transaction.notes && transaction.notes.trim() !== "" && !transaction.notes.includes(prePrintedNoteText)) {
    doc.setFontSize(8);
    const pageWidth = doc.internal.pageSize.getWidth();
    // يتم تقسيم الملاحظات الإضافية على عدة أسطر إذا كانت طويلة
    const additionalNotesLines = doc.splitTextToSize(`ملاحظات إضافية: ${transaction.notes}`, pageWidth - (X_NOTES_ADDITIONAL_TEXT * 2) );
    doc.text(additionalNotesLines, X_NOTES_ADDITIONAL_TEXT, Y_NOTES_LINE + 5); // طباعة أسفل سطر الملاحظة المطبوع مسبقًا
  }

  // "المتلوي في" (تاريخ التوقيع)
  // افترض أن "20" مطبوعة مسبقًا في النموذج للسنة
  const sigDate = new Date(transaction.date); // أو استخدم new Date() للتاريخ الحالي إذا أردت
  writeDataField(format(sigDate, "dd", { locale: arSA }), X_SIGNATURE_DAY_VALUE, Y_SIGNATURE_DATE_LINE, 10);
  writeDataField(format(sigDate, "MM", { locale: arSA }), X_SIGNATURE_MONTH_VALUE, Y_SIGNATURE_DATE_LINE, 10);
  writeDataField(format(sigDate, "yy", { locale: arSA }), X_SIGNATURE_YEAR_SUFFIX_VALUE, Y_SIGNATURE_DATE_LINE, 10); // لـ "xx" في 20xx

  doc.save(`Form_Receipt_${transaction.receiptNumber}_${transaction.id.substring(0,8)}.pdf`);
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

    