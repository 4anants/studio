'use client';

import { useState } from 'react';
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

interface AddDocumentTypeDialogProps {
  onAdd: (newType: string) => void;
  children: React.ReactNode;
}

export function AddDocumentTypeDialog({ onAdd, children }: AddDocumentTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState('');

  const handleAdd = () => {
    if (newType.trim()) {
      onAdd(newType.trim());
      setNewType('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Document Type</DialogTitle>
          <DialogDescription>Create a new category for documents.</DialogDescription>
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
              placeholder="e.g., 'Offer Letter'"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">Add Type</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
