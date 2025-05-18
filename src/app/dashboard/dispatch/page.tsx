
import { EquipmentForm } from '@/components/forms/equipment-form';
import { ArrowRightLeft } from 'lucide-react';

export default function DispatchEquipmentPage() {
  return (
    <div className="container mx-auto py-8">
      <EquipmentForm
        type="dispatch"
        formTitle="تسليم تجهيزات" // Changed
        partyLabel="الجهة المستلمة"
        submitButtonText="تسليم" // Changed
      />
    </div>
  );
}
