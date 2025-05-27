
import { z } from 'zod';

export const appropriationFormSchema = z.object({
  name: z.string().min(1, { message: "اسم بند الاعتماد مطلوب." }),
  allocatedAmount: z.coerce
    .number({ invalid_type_error: "المبلغ المرصود يجب أن يكون رقمًا." })
    .positive({ message: "المبلغ المرصود يجب أن يكون أكبر من صفر." })
    .refine(value => /^\d+(\.\d{1,3})?$/.test(String(value)), {
        message: "المبلغ المرصود يجب أن يحتوي على ثلاثة أرقام عشرية على الأكثر."
    }),
  description: z.string().optional(),
});

export type AppropriationFormValues = z.infer<typeof appropriationFormSchema>;
