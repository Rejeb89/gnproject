import Image from 'next/image';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/90 transition-colors">
      <Image
        src="/national-guard-logo.png"
        alt="شعار الحرس الوطني"
        width={33}
        height={40}
        className="object-contain"
      />
      <span className="font-bold">قسم التجهيز بمنطقة الحرس الوطني بالمتلوي</span>
    </Link>
  );
}
