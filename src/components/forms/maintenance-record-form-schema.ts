
import { z } from 'zod';

export const maintenanceRecordFormSchema = z.object({
  date: z.date({
    required_error: "تاريخ الصيانة مطلوب.",
    invalid_type_error: "تاريخ الصيانة غير صالح.",
  }),
  type: z.string().min(1, { message: "نوع الصيانة مطلوب." }),
  odometerReading: z.coerce
    .number({ invalid_type_error: "قراءة العداد يجب أن تكون رقمًا." })
    .positive({ message: "قراءة العداد يجب أن تكون رقمًا موجبًا." })
    .int({ message: "قراءة العداد يجب أن تكون رقمًا صحيحًا." })
    .optional(),
  // cost field removed from schema validation
  description: z.string().min(1, { message: "وصف الصيانة مطلوب." }),
  nextDueDate: z.date().optional().nullable(),
  nextDueOdometer: z.coerce
    .number({ invalid_type_error: "عداد الصيانة القادمة يجب أن يكون رقمًا." })
    .positive({ message: "عداد الصيانة القادمة يجب أن يكون رقمًا موجبًا." })
    .int({ message: "عداد الصيانة القادمة يجب أن تكون رقمًا صحيحًا." })
    .optional(),
  notes: z.string().optional(),
});

export type MaintenanceRecordFormValues = z.infer<typeof maintenanceRecordFormSchema>;

