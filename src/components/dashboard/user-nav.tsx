
"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, UserCircle, Trash2, LogOut } from "lucide-react"; // Added LogOut
import { useToast } from "@/hooks/use-toast";
import { clearAllData } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation'; // Added useRouter
import { useEffect, useState } from "react";


export function UserNav() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const [userName, setUserName] = useState("المستخدم");
  const [userInitials, setUserInitials] = useState("UL");


  useEffect(() => {
    // جلب اسم المستخدم من localStorage عند تحميل المكون
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
      const initials = storedUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
      setUserInitials(initials);
    } else {
      // إذا لم يكن هناك اسم مستخدم، قد يعني أن المستخدم غير مسجل دخوله
      // أو أن هذا هو السلوك الافتراضي قبل تسجيل الدخول
      setUserName("المستخدم المحلي");
      setUserInitials("م ل");
    }
  }, []);


  const handleClearData = () => {
    clearAllData();
    toast({
      title: "تم مسح البيانات",
      description: "تم مسح جميع بيانات التطبيق بنجاح.",
      variant: "default", 
    });
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated'); // إزالة علامة المصادقة
    localStorage.removeItem('userRole'); 
    localStorage.removeItem('userName'); 
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك من النظام بنجاح.",
    });
    router.push('/login'); // توجيه المستخدم إلى صفحة تسجيل الدخول
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials || <UserCircle size={24} />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                نظام إدارة المستودعات
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled> 
              <Settings className="ml-2 h-4 w-4" /> 
              <span>الإعدادات</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="ml-2 h-4 w-4" />
                <span>مسح كل البيانات</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="ml-2 h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيؤدي هذا الإجراء إلى حذف جميع البيانات المخزنة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            نعم، قم بالمسح
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
