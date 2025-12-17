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
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { useState } from 'react';
import type { DocumentType as AppDocumentType } from '@/lib/types';

interface DeleteDocumentTypeDialogProps {
  documentType: AppDocumentType;
  onDelete: () => void;
  isTypeInUse: boolean;
  children: React.ReactNode;
}

export function DeleteDocumentTypeDialog({ documentType, onDelete, isTypeInUse, children }: DeleteDocumentTypeDialogProps) {
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
          {isTypeInUse ? (
            <Alert variant="destructive" className="mt-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Cannot Delete</AlertTitle>
              <AlertDescription>
                This document type is currently assigned to one or more documents. Please reassign them before deleting this type.
              </AlertDescription>
            </Alert>
          ) : (
            <AlertDialogDescription>
              This action will move the document type{' '}
              <span className="font-semibold text-foreground">{documentType.name}</span> to the deleted items list. You can restore it later.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
          {!isTypeInUse && (
            <AlertDialogAction onClick={handleDelete} className="rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 text-white shadow-md hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
