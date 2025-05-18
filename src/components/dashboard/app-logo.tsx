import Image from 'next/image';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex flex-col items-center gap-2 text-lg font-semibold text-primary hover:text-primary/90 transition-colors text-center">
      <Image
        src="/national-guard-logo.png"
        alt="شعار الحرس الوطني"
        width={40} // Adjusted width for better proportion
        height={48} // Adjusted height for better proportion
        className="object-contain"
      />
      <span className="font-bold">قسم التجهيز بمنطقة الحرس الوطني بالمتلوي</span>
    </Link>
  );
}
