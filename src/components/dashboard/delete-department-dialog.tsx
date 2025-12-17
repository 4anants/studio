'use client';

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
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { Department } from '@/lib/types';

interface DeleteDepartmentDialogProps {
  department: Department;
  onDelete: () => void;
  children: React.ReactNode;
}

export function DeleteDepartmentDialog({ department, onDelete, children }: DeleteDepartmentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the department{' '}
            <span className="font-semibold text-foreground">{department.name}</span>.
            This might affect users assigned to this department. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 text-white shadow-md hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
