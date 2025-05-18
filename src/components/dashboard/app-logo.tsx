
import Image from 'next/image';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex flex-col items-center gap-2 text-lg font-semibold text-primary hover:text-primary/90 transition-colors text-center">
      <Image
        src="/national-guard-logo.png" // Assumes the image is saved as national-guard-logo.png in the public folder
        alt="شعار الحرس الوطني التونسي"
        data-ai-hint="logo emblem"
        width={60} // Adjusted width, height can be auto or set to maintain aspect ratio
        height={72} // Adjusted height to maintain aspect ratio, (227/187 * 60) approx 72
        className="object-contain"
        priority // Optional: if this is a critical LCP element
      />
      <span className="font-bold text-sm leading-tight">قسم التجهيز بمنطقة الحرس الوطني بالمتلوي</span>
    </Link>
  );
}
