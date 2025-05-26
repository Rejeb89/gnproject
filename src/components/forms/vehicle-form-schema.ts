
import { z } from 'zod';

export const vehicleFormSchema = z.object({
  type: z.string().min(1, { message: "نوع المركبة مطلوب." }),
  registrationNumber: z.string().min(1, { message: "الرقم المنجمي مطلوب." }),
  owningParty: z.string().min(1, { message: "الجهة التابعة لها مطلوبة." }),
  fuelAllowanceLiters: z.coerce
    .number({ invalid_type_error: "يجب أن يكون رقماً." })
    .positive({ message: "يجب أن يكون رقماً موجباً." })
    .optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
