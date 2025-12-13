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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!isTypeInUse && (
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
