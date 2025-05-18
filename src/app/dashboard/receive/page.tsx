import { EquipmentForm } from '@/components/forms/equipment-form';

export default function ReceiveEquipmentPage() {
  return (
    <div className="container mx-auto py-8">
      <EquipmentForm
        type="receive"
        formTitle="تسجيل استلام تجهيزات"
        partyLabel="الجهة المرسلة"
        submitButtonText="تسجيل الاستلام"
      />
    </div>
  );
}
