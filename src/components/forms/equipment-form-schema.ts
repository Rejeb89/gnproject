import { z } from 'zod';

export const equipmentFormSchema = z.object({
  equipmentName: z.string().min(1, { message: "اسم التجهيز مطلوب." }),
  quantity: z.coerce.number().int().positive({ message: "الكمية يجب أن تكون رقماً صحيحاً موجباً." }),
  party: z.string().min(1, { message: "اسم الجهة مطلوب." }),
  date: z.date({ required_error: "التاريخ مطلوب." }),
  notes: z.string().optional(),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(1, { message: "الحد الأدنى للتنبيه يجب أن يكون 1 أو أكثر." })
    .optional(),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;
