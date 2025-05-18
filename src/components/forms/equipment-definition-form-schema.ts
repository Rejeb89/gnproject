
import { z } from 'zod';

export const equipmentDefinitionFormSchema = z.object({
  name: z.string().min(1, { message: "اسم نوع التجهيز مطلوب." }),
  defaultCategory: z.string().optional().transform(val => val === "" ? undefined : val),
  defaultLowStockThreshold: z.coerce
    .number({ invalid_type_error: "يجب أن يكون رقماً." })
    .int({ message: "يجب أن يكون رقماً صحيحاً." })
    .positive({ message: "يجب أن يكون رقماً موجباً." })
    .optional(),
  unitOfMeasurement: z.string().optional().transform(val => val === "" ? undefined : val),
});

export type EquipmentDefinitionFormValues = z.infer<typeof equipmentDefinitionFormSchema>;
