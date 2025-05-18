
import { EquipmentForm } from '@/components/forms/equipment-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function ReceiveEquipmentPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-start"> {/* justify-start will align to the right in RTL */}
        <Button asChild variant="outline">
          <Link href="/dashboard/equipment">
            <ArrowRight className="ml-2 h-4 w-4" /> {/* ml-2 adds margin to the right of the icon in RTL */}
            العودة إلى صفحة التجهيزات
          </Link>
        </Button>
      </div>
      <EquipmentForm
        type="receive"
        formTitle="تسجيل استلام تجهيزات"
        partyLabel="الجهة المرسلة"
        submitButtonText="تسجيل الاستلام"
      />
    </div>
  );
}
