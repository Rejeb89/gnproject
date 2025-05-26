
import { z } from 'zod';

export const calendarEventFormSchema = z.object({
  title: z.string().min(1, { message: "عنوان الحدث مطلوب." }),
  date: z.date({
    required_error: "تاريخ الحدث مطلوب.",
    invalid_type_error: "تاريخ الحدث غير صالح.",
  }),
  description: z.string().optional(),
});

export type CalendarEventFormValues = z.infer<typeof calendarEventFormSchema>;
