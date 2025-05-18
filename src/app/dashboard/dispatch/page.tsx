import { EquipmentForm } from '@/components/forms/equipment-form';

export default function DispatchEquipmentPage() {
  return (
    <div className="container mx-auto py-8">
      <EquipmentForm
        type="dispatch"
        formTitle="تسجيل تسليم تجهيزات"
        partyLabel="الجهة المستلمة"
        submitButtonText="تسجيل التسليم"
      />
    </div>
  );
}
