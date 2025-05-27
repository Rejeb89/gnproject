
import { z } from 'zod';

export const fuelEntryFormSchema = z.object({
  date: z.date({
    required_error: "تاريخ تعبئة الوقود مطلوب.",
    invalid_type_error: "تاريخ تعبئة الوقود غير صالح.",
  }),
  odometerReading: z.coerce
    .number({ invalid_type_error: "قراءة العداد يجب أن تكون رقمًا." })
    .positive({ message: "قراءة العداد يجب أن تكون رقمًا موجبًا." })
    .int({ message: "قراءة العداد يجب أن تكون رقمًا صحيحًا." }),
  litersFilled: z.coerce
    .number({ invalid_type_error: "كمية الوقود يجب أن تكون رقمًا." })
    .positive({ message: "كمية الوقود يجب أن تكون أكبر من صفر." }),
  costPerLiter: z.coerce
    .number({ invalid_type_error: "سعر اللتر يجب أن يكون رقمًا." })
    .positive({ message: "سعر اللتر يجب أن يكون أكبر من صفر." })
    .optional(),
  totalCost: z.coerce
    .number({ invalid_type_error: "التكلفة الإجمالية يجب أن تكون رقمًا." })
    .positive({ message: "التكلفة الإجمالية يجب أن تكون أكبر من صفر." }),
  notes: z.string().optional(),
});

export type FuelEntryFormValues = z.infer<typeof fuelEntryFormSchema>;
