import { z } from 'zod';

export const equipmentFormSchema = z.object({
  equipmentName: z.string().min(1, { message: "اسم التجهيز مطلوب." }),
  quantity: z.coerce.number().int().positive({ message: "الكمية يجب أن تكون رقماً صحيحاً موجباً." }),
  party: z.string().min(1, { message: "اسم الجهة مطلوب." }),
  date: z.date({ required_error: "التاريخ مطلوب." }),
  // receiptNumber is now auto-generated
  notes: z.string().optional(),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;
