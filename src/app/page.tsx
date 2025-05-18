
import { redirect } from 'next/navigation';

export default function HomePage() {
  // سيتم لاحقًا التحقق من حالة المصادقة هنا
  // إذا كان المستخدم مسجل دخوله، يتم توجيهه إلى /dashboard
  // وإلا، يتم توجيهه إلى /login
  redirect('/login');
}
