
"use client";

import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { UserCog, PlusCircle, Edit2, Trash2, KeyRound, ShieldCheck, Users, DatabaseBackup, Upload, Download, Palette, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportAllData, importAllData } from "@/lib/store";
import { cn } from '@/lib/utils';

// Mock user type for local state demonstration
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

interface ThemeColorSet {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string; 
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

interface AppTheme {
  name: string; // e.g., "default", "ocean"
  displayName: string;
  // Colors are kept here for PalettePreview, but actual styling is done via CSS.
  colors: Partial<ThemeColorSet>; 
}

const THEME_STORAGE_KEY = 'equipTrack_selected_app_theme_v1'; // Changed key slightly

// These color values are for PalettePreview. Actual theme values are in globals.css
const defaultPreviewColors: Partial<ThemeColorSet> = {
  background: "0 0% 100%",
  foreground: "210 15% 20%",
  primary: "207 88% 70%",
  accent: "125 37% 75%",
  secondary: "207 80% 88%",
};

const availableThemes: AppTheme[] = [
  {
    name: "default",
    displayName: "الافتراضي",
    colors: defaultPreviewColors,
  },
  {
    name: "ocean",
    displayName: "أعماق المحيط",
    colors: { // For PalettePreview
      background: "210 40% 98%",
      foreground: "210 30% 15%",
      primary: "200 90% 55%",
      accent: "170 60% 70%",
      secondary: "190 70% 90%",
    },
  },
  {
    name: "forest",
    displayName: "غابة خضراء",
    colors: { // For PalettePreview
      background: "120 10% 98%", 
      foreground: "120 25% 15%", 
      primary: "130 50% 45%",   
      accent: "90 60% 65%",     
      secondary: "120 30% 88%", 
    },
  },
];

const PalettePreview = ({ colors }: { colors: Partial<ThemeColorSet> }) => {
  const previewColors = [
    colors.primary,
    colors.accent,
    colors.secondary,
    colors.background,
    colors.foreground,
  ].filter(Boolean) as string[];

  return (
    <div className="flex gap-1 mt-1 h-4">
      {previewColors.map((color, index) => (
        <div
          key={index}
          className="w-4 h-4 rounded-xs border border-border"
          style={{ backgroundColor: `hsl(${color})` }}
        />
      ))}
    </div>
  );
};


export default function SettingsPage() {
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [mockUsers, setMockUsers] = useState<MockUser[]>([
    { id: '1', name: 'المشرف العام', email: 'admin@gn-met.tn', role: 'admin' },
  ]);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeAppTheme, setActiveAppTheme] = useState<string>('default');

  // Apply theme by setting data-attribute on HTML element
  const applyAppTheme = (themeName: string) => {
    document.documentElement.setAttribute('data-app-theme', themeName);
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
    setActiveAppTheme(themeName);
    const selectedTheme = availableThemes.find(t => t.name === themeName);
    if (selectedTheme) {
        toast({ title: "تم تطبيق السمة", description: `تم تغيير السمة إلى: ${selectedTheme.displayName}` });
    }
  };

  // Load saved theme on mount
  useEffect(() => {
    const savedThemeName = localStorage.getItem(THEME_STORAGE_KEY) || 'default';
    document.documentElement.setAttribute('data-app-theme', savedThemeName);
    setActiveAppTheme(savedThemeName);
  }, []);


  const handleAddUser = () => {
    if (!userName || !userEmail) {
      toast({ title: "خطأ", description: "الرجاء إدخال الاسم والبريد الإلكتروني.", variant: "destructive" });
      return;
    }
    const newUser: MockUser = {
      id: crypto.randomUUID(),
      name: userName,
      email: userEmail,
      role: userRole,
    };
    setMockUsers([...mockUsers, newUser]);
    toast({ title: "تمت الإضافة بنجاح", description: `تم إضافة الموظف ${userName}. (محاكاة)` });
    setIsAddUserDialogOpen(false);
    setUserName('');
    setUserEmail('');
    setUserRole('employee');
  };

  const handleOpenEditUserDialog = (user: MockUser) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setIsEditUserDialogOpen(true);
  };

  const handleEditUser = () => {
    if (!editingUser || !userName || !userEmail) {
      toast({ title: "خطأ", description: "الرجاء إدخال الاسم والبريد الإلكتروني.", variant: "destructive" });
      return;
    }
    setMockUsers(mockUsers.map(u => u.id === editingUser.id ? { ...u, name: userName, email: userEmail, role: userRole } : u));
    toast({ title: "تم التحديث بنجاح", description: `تم تحديث بيانات الموظف ${userName}. (محاكاة)` });
    setIsEditUserDialogOpen(false);
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('employee');
  };
  
  const handleDeleteUser = (userId: string) => {
    if (mockUsers.find(u => u.id === userId)?.email === 'admin@gn-met.tn' && mockUsers.filter(u=>u.role ==='admin').length ===1) {
        toast({ title: "لا يمكن الحذف", description: "لا يمكن حذف حساب المشرف الرئيسي الوحيد. (محاكاة)", variant: "destructive" });
        return;
    }
    setMockUsers(mockUsers.filter(u => u.id !== userId));
    toast({ title: "تم الحذف بنجاح", description: "تم حذف الموظف. (محاكاة)" });
  };

  const openAddDialogClean = () => {
    setEditingUser(null); 
    setUserName(''); 
    setUserEmail(''); 
    setUserRole('employee'); 
    setIsAddUserDialogOpen(true);
  }

  const handleExportData = () => {
    exportAllData();
    toast({
      title: "تم تصدير البيانات",
      description: "تم تصدير جميع بيانات التطبيق بنجاح إلى ملف JSON.",
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportData = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    const result = await importAllData(selectedFile);
    setIsImporting(false);
    setShowImportConfirmDialog(false);
    toast({
      title: result.success ? "نجاح الاستيراد" : "فشل الاستيراد",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) {
      // Reload to apply imported theme and other settings
      window.location.reload(); 
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  return (
    <AlertDialog open={showImportConfirmDialog} onOpenChange={setShowImportConfirmDialog}>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">إعدادات النظام</h1>
        </div>

        {/* Theme Customization Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Palette className="h-6 w-6" />
              تخصيص سمة التطبيق (الوضع الفاتح)
            </CardTitle>
            <CardDescription>
              اختر السمة الأساسية لواجهة المستخدم عند استخدام الوضع الفاتح. الوضع الداكن له سمة ثابتة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableThemes.map((theme) => (
                <Button
                  key={theme.name}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-start justify-start text-right relative",
                    activeAppTheme === theme.name && "ring-2 ring-primary border-primary"
                  )}
                  onClick={() => applyAppTheme(theme.name)}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold">{theme.displayName}</span>
                    {activeAppTheme === theme.name && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <PalettePreview colors={theme.colors} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {theme.name === 'default' ? 'السمة الأساسية للتطبيق.' : `سمة بألوان مستوحاة من ${theme.displayName.toLowerCase()}.`}
                  </p>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* User Management Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserCog className="h-6 w-6" />
              إدارة المستخدمين (واجهة تجريبية)
            </CardTitle>
            <CardDescription>
              إدارة حسابات الموظفين وصلاحياتهم. هذه الواجهة هي للعرض فقط حاليًا. يتطلب التنفيذ الكامل نظام مصادقة آمن.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={openAddDialogClean}>
                <PlusCircle className="ml-2 h-5 w-5" />
                إضافة موظف جديد
              </Button>
            </div>

            {mockUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role === 'admin' ? 'مشرف' : 'موظف'}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" title="تعديل" onClick={() => handleOpenEditUserDialog(user)}>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" title="حذف" onClick={() => handleDeleteUser(user.id)} disabled={user.email === 'admin@gn-met.tn' && mockUsers.filter(u=>u.role ==='admin').length ===1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">لا يوجد مستخدمون معرفون حاليًا.</p>
                <p className="text-sm">ابدأ بإضافة موظف جديد.</p>
                <Button onClick={openAddDialogClean} className="mt-4">
                  <PlusCircle className="ml-2 h-5 w-5" />
                  إضافة موظف جديد
                </Button>
              </div>
            )}
          </CardContent>
          {mockUsers.length > 0 && (
          <CardFooter className="text-sm text-muted-foreground">
            يتم عرض {mockUsers.length} {mockUsers.length === 1 ? 'مستخدم' : mockUsers.length === 2 ? 'مستخدمين' : mockUsers.length <= 10 ? 'مستخدمين' : 'مستخدم'}. (بيانات محاكاة)
          </CardFooter>
          )}
        </Card>

        {/* App Data Management Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DatabaseBackup className="h-6 w-6" />
              إدارة بيانات التطبيق
            </CardTitle>
            <CardDescription>
              تصدير جميع بيانات التطبيق للاحتفاظ بنسخة احتياطية، أو استيراد بيانات من ملف.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExportData} className="w-full sm:w-auto">
              <Download className="ml-2 h-5 w-5" />
              تصدير كل بيانات التطبيق (JSON)
            </Button>
            <div className="space-y-2">
              <Label htmlFor="importFile">استيراد بيانات من ملف JSON</Label>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Input
                  id="importFile"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="flex-grow"
                />
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={() => {
                      if (selectedFile) {
                        setShowImportConfirmDialog(true);
                      } else {
                        toast({ title: "خطأ", description: "يرجى اختيار ملف أولاً.", variant: "destructive" });
                      }
                    }}
                    disabled={!selectedFile || isImporting}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="ml-2 h-5 w-5" />
                    {isImporting ? "جارٍ الاستيراد..." : "استيراد البيانات"}
                  </Button>
                </AlertDialogTrigger>
              </div>
              <p className="text-xs text-muted-foreground">
                تحذير: استيراد البيانات سيقوم بالكتابة فوق جميع البيانات الحالية في التطبيق.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-6 w-6" />
              إدارة الصلاحيات
            </CardTitle>
            <CardDescription>
              تحديد الصلاحيات المتاحة لكل دور في النظام.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">المشرف:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>إدارة المستخدمين (إنشاء، تعديل، حذف حسابات الموظفين).</li>
                <li>عرض جميع التقارير والإحصائيات.</li>
                <li>تعديل الإعدادات العامة للنظام.</li>
                <li>تصدير واستيراد بيانات التطبيق.</li>
                <li>تخصيص سمة التطبيق.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">الموظف (مثال):</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>تسجيل عمليات استلام التجهيزات.</li>
                <li>تسجيل عمليات تسليم التجهيزات.</li>
                <li>عرض تقارير محددة ذات صلة بعمله.</li>
                <li>(لا يمكنه إدارة المستخدمين أو الإعدادات العامة أو تصدير/استيراد كل البيانات أو تخصيص السمة)</li>
              </ul>
            </div>
            <p className="mt-6 text-sm text-amber-600 font-semibold border-t pt-4">
              ملاحظة: التنفيذ الفعلي لهذه الصلاحيات يتطلب نظام مصادقة وتخويل متقدم (مثل Firebase Authentication مع قواعد أمان). الواجهة الحالية هي للعرض التوضيحي.
            </p>
          </CardContent>
        </Card>
        
        {/* Password Reset Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <KeyRound className="h-6 w-6" />
              إعادة تعيين كلمات المرور (للتطوير المستقبلي)
            </CardTitle>
            <CardDescription>
              خاصية إعادة تعيين كلمات المرور للموظفين (عادةً ما يقوم بها المشرف أو يرسل الموظف طلبًا).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              هذه الميزة تعتمد بشكل كبير على نظام المصادقة المستخدم (مثل Firebase Authentication)، والذي يوفر آليات آمنة لإعادة تعيين كلمات المرور.
            </p>
          </CardContent>
        </Card>

        {/* Add/Edit User Dialog */}
        <Dialog open={isAddUserDialogOpen || isEditUserDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsAddUserDialogOpen(false);
            setIsEditUserDialogOpen(false);
            setEditingUser(null);
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'قم بتحديث تفاصيل الموظف.' : 'أدخل تفاصيل الموظف الجديد. كلمة المرور هي للمحاكاة فقط.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right col-span-1">
                  الاسم
                </Label>
                <Input id="name" value={userName} onChange={(e) => setUserName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right col-span-1">
                  البريد الإلكتروني
                </Label>
                <Input id="email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="col-span-3" />
              </div>
              {!editingUser && ( 
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password_mock" className="text-right col-span-1">
                  كلمة المرور
                </Label>
                <Input id="password_mock" type="password" placeholder=" (للمحاكاة فقط)" className="col-span-3" />
              </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right col-span-1">
                  الدور
                </Label>
                <Select value={userRole} onValueChange={(value: 'admin' | 'employee') => setUserRole(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="admin">مشرف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                  <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <Button onClick={editingUser ? handleEditUser : handleAddUser}>
                {editingUser ? 'حفظ التعديلات' : 'إضافة موظف'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Confirmation Dialog */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الاستيراد</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد استيراد البيانات من الملف المحدد؟ سيؤدي هذا إلى الكتابة فوق جميع البيانات الحالية في التطبيق. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowImportConfirmDialog(false)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportData}
              disabled={isImporting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isImporting ? "جارٍ الاستيراد..." : "نعم، قم بالاستيراد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}
