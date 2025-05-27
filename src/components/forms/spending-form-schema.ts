
import { z } from 'zod';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const fileSchema = z
  .instanceof(FileList)
  .optional()
  .refine(
    (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE_BYTES,
    `حجم الملف يجب أن لا يتجاوز ${MAX_FILE_SIZE_MB} ميغابايت.`
  )
  .refine(
    (files) => !files || files.length === 0 || ACCEPTED_FILE_TYPES.includes(files[0].type),
    "صيغة الملف يجب أن تكون PDF."
  );

export const baseSpendingFormSchema = z.object({
  spentAmount: z.coerce
    .number({ invalid_type_error: "المبلغ المصروف يجب أن يكون رقمًا." })
    .positive({ message: "المبلغ المصروف يجب أن يكون أكبر من صفر." })
    .refine(value => /^\d+(\.\d{1,3})?$/.test(String(value)), {
        message: "المبلغ المصروف يجب أن يحتوي على ثلاثة أرقام عشرية على الأكثر."
    }),
  spendingDate: z.date({
    required_error: "تاريخ الصرف مطلوب.",
    invalid_type_error: "تاريخ الصرف غير صالح.",
  }),
  description: z.string().optional(),
  supplyRequestNumber: z.string().optional(),
  supplyRequestDate: z.date().optional().nullable(),
  supplyRequestFile: fileSchema,
  invoiceNumber: z.string().optional(),
  invoiceDate: z.date().optional().nullable(),
  invoiceFile: fileSchema,
});

export type SpendingFormValues = z.infer<typeof baseSpendingFormSchema>;
