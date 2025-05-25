
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

// بيانات اعتماد المشرف المؤقتة (للمحاكاة فقط - غير آمنة للاستخدام الفعلي)
const ADMIN_EMAIL = "admin@gn-met.tn";
const ADMIN_PASSWORD = "gn-met2025";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 1000));

    // محاكاة المصادقة (غير آمنة إطلاقًا للاستخدام الإنتاجي)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('isAuthenticated', 'true'); // علامة مؤقتة
      localStorage.setItem('userRole', 'admin'); // علامة مؤقتة لدور المستخدم
      localStorage.setItem('userName', 'المشرف العام');
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك أيها المشرف.",
      });
      router.push('/dashboard');
    } else {
      toast({
        title: "فشل تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <Image
            src="/national-guard-logo.png"
            alt="شعار الحرس الوطني"
            data-ai-hint="logo emblem"
            width={80}
            height={96}
            className="mx-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>
            الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى النظام.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@gn-met.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
