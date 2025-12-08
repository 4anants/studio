'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditDocumentTypeDialogProps {
  onEdit: (oldType: string, newType: string) => void;
  documentType: string;
  children: React.ReactNode;
}

export function EditDocumentTypeDialog({ onEdit, documentType, children }: EditDocumentTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState(documentType);

  useEffect(() => {
    if (open) {
      setNewType(documentType);
    }
  }, [open, documentType]);

  const handleSave = () => {
    if (newType.trim() && newType.trim() !== documentType) {
      onEdit(documentType, newType.trim());
      setOpen(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Document Type</DialogTitle>
          <DialogDescription>Rename the document type. This will update all associated documents.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Type Name
            </Label>
            <Input
              id="name"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="col-span-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
