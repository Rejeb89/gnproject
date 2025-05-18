import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google'; // Using Tajawal for Arabic
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const tajawalFont = Tajawal({
  weight: ['400', '500', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'EquipTrack - نظام إدارة المستودع',
  description: 'تطبيق ويب لإدارة مستودع التجهيزات محليًا',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawalFont.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
