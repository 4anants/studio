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

interface AddDepartmentDialogProps {
  onAdd: (newDepartment: string) => void;
  children: React.ReactNode;
}

export function AddDepartmentDialog({ onAdd, children }: AddDepartmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');

  const handleAdd = () => {
    if (newDepartment.trim()) {
      onAdd(newDepartment.trim());
      setNewDepartment('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>Create a new department for your organization.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 'Finance'"
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
          <Button onClick={handleAdd} className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">Add Department</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
