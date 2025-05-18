import { Package } from 'lucide-react';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/90 transition-colors">
      <Package className="h-7 w-7" />
      <span className="font-bold">قسم التجهيز بمنطقة الحرس الوطني بالمتلوي</span>
    </Link>
  );
}
