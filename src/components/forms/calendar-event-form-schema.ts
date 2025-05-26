
import { z } from 'zod';

export const calendarEventFormSchema = z.object({
  title: z.string().min(1, { message: "عنوان الحدث مطلوب." }),
  date: z.date({ // This will be the date part from the Calendar component
    required_error: "تاريخ الحدث مطلوب.",
    invalid_type_error: "تاريخ الحدث غير صالح.",
  }),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "الوقت غير صالح، يجب أن يكون بتنسيق HH:mm (مثال: 14:30)." }),
  description: z.string().optional(),
  reminderUnit: z.enum(["none", "days", "hours", "weeks"]).optional().default("none"),
  reminderValue: z.coerce
    .number({ invalid_type_error: "قيمة التذكير يجب أن تكون رقماً." })
    .int({ message: "قيمة التذكير يجب أن تكون رقماً صحيحاً." })
    .positive({ message: "قيمة التذكير يجب أن تكون رقماً موجباً." })
    .optional(),
}).refine(data => {
  if (data.reminderUnit && data.reminderUnit !== "none") {
    return data.reminderValue !== undefined && data.reminderValue > 0;
  }
  return true;
}, {
  message: "يجب تحديد قيمة للتذكير إذا تم اختيار وحدة زمنية (غير 'بدون').",
  path: ["reminderValue"],
}).refine(data => {
    if (data.reminderValue !== undefined && data.reminderValue > 0) {
      return data.reminderUnit && data.reminderUnit !== "none";
    }
    return true;
}, {
    message: "يجب تحديد وحدة زمنية للتذكير (غير 'بدون') إذا تم تحديد قيمة.",
    path: ["reminderUnit"],
});

export type CalendarEventFormValues = z.infer<typeof calendarEventFormSchema>;
