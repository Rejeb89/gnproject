
"use client";

import React, { useState } from 'react';
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
import { UserCog, PlusCircle, Edit2, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock user type for local state demonstration
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [mockUsers, setMockUsers] = useState<MockUser[]>([
    { id: '1', name: 'المشرف العام', email: 'admin@gn-met.tn', role: 'admin' },
    // Add more mock users here for demonstration if needed
  ]);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);

  // Mock form state for adding/editing user
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');

  const handleAddUser = () => {
    // In a real app, this would involve API calls and secure password handling
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
    // Prevent deleting the main admin for this mock
    if (mockUsers.find(u => u.id === userId)?.email === 'admin@gn-met.tn' && mockUsers.filter(u=>u.role ==='admin').length ===1) {
        toast({ title: "لا يمكن الحذف", description: "لا يمكن حذف حساب المشرف الرئيسي الوحيد. (محاكاة)", variant: "destructive" });
        return;
    }
    setMockUsers(mockUsers.filter(u => u.id !== userId));
    toast({ title: "تم الحذف بنجاح", description: "تم حذف الموظف. (محاكاة)" });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">إعدادات النظام</h1>
      </div>

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
            <Button onClick={() => {
              setEditingUser(null); 
              setUserName(''); 
              setUserEmail(''); 
              setUserRole('employee'); 
              setIsAddUserDialogOpen(true);
            }}>
              <PlusCircle className="ml-2 h-5 w-5" />
              إضافة موظف جديد
            </Button>
          </div>

          {mockUsers.length > 0 ? (
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
          ) : (
            <p className="text-muted-foreground text-center py-4">لا يوجد موظفون حاليًا.</p>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          يتم عرض {mockUsers.length} {mockUsers.length === 1 ? 'مستخدم' : 'مستخدمين'}. (بيانات محاكاة)
        </CardFooter>
      </Card>

      {/* Permissions Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-6 w-6" />
            إدارة الصلاحيات (للتطوير المستقبلي)
          </CardTitle>
          <CardDescription>
            سيتم هنا تحديد الصلاحيات المتاحة لكل دور.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">المشرف:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يمكنه إدارة المستخدمين (إنشاء، تعديل، حذف حسابات الموظفين).</li>
              <li>يمكنه عرض جميع التقارير والإحصائيات.</li>
              <li>يمكنه تعديل الإعدادات العامة للنظام.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">الموظف:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يمكنه تسجيل عمليات استلام التجهيزات.</li>
              <li>يمكنه تسجيل عمليات تسليم التجهيزات.</li>
              <li>يمكنه عرض تقارير محددة ذات صلة بعمله.</li>
            </ul>
          </div>
           <p className="mt-6 text-sm text-amber-600 font-semibold border-t pt-4">
            ملاحظة: يتطلب التنفيذ الفعلي لهذه الميزة نظام صلاحيات متقدم مرتبط بنظام مصادقة آمن (مثل Firebase Authentication مع قواعد أمان).
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
            {!editingUser && ( // Only show password field when adding, not editing for this mock
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
    </div>
  );
}
    
