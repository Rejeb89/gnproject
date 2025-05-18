import Image from 'next/image';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex flex-col items-center gap-2 text-lg font-semibold text-primary hover:text-primary/90 transition-colors text-center">
      <Image
        // Temporarily using a placeholder to debug image visibility
        src="https://placehold.co/60x72.png"
        alt="شعار الحرس الوطني - placeholder"
        data-ai-hint="logo emblem"
        width={60} // Increased size slightly for better visibility
        height={72}
        className="object-contain"
      />
      <span className="font-bold">قسم التجهيز بمنطقة الحرس الوطني بالمتلوي</span>
    </Link>
  );
}
