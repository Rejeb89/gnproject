
import { EquipmentForm } from '@/components/forms/equipment-form';
import { ArrowRightLeft } from 'lucide-react'; // Import if you want to use it in title

export default function DispatchEquipmentPage() {
  return (
    <div className="container mx-auto py-8">
      {/* 
        The title is now part of the EquipmentForm component itself using CardHeader.
        If you need a specific title here still, you can add it:
        <h1 className="text-3xl font-bold tracking-tight mb-6">تسجيل تسليم تجهيزات</h1> 
      */}
      <EquipmentForm
        type="dispatch"
        formTitle="تسجيل تسليم تجهيزات"
        partyLabel="الجهة المستلمة"
        submitButtonText="تسجيل التسليم"
      />
    </div>
  );
}
