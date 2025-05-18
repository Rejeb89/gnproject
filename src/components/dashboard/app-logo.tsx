import { Package } from 'lucide-react';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
      <Package className="h-7 w-7" />
      <span className="font-bold">EquipTrack</span>
    </Link>
  );
}
