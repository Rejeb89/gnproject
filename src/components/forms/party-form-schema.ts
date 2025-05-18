
import { z } from 'zod';

export const partyFormSchema = z.object({
  name: z.string().min(1, { message: "اسم الجهة مطلوب." }).trim(),
});

export type PartyFormValues = z.infer<typeof partyFormSchema>;
