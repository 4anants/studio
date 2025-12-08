
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
import type { Company } from '@/lib/mock-data';
import { useState } from 'react';

interface DeleteCompanyDialogProps {
  company: Company;
  onDelete: () => void;
  children: React.ReactNode;
}

export function DeleteCompanyDialog({ company, onDelete, children }: DeleteCompanyDialogProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild onClick={(e) => { e.stopPropagation(); setOpen(true); }}>{children}</AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the company{' '}
            <span className="font-semibold text-foreground">{company.name}</span>. 
            This action cannot be undone and will only succeed if no employees are assigned to this company.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
