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
import { useToast } from '@/hooks/use-toast';
import { FolderPlus } from 'lucide-react';

interface AddDocumentTypeDialogProps {
  onAdd: (newType: string) => void;
  children: React.ReactNode;
}

export function AddDocumentTypeDialog({ onAdd, children }: AddDocumentTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    if (newType.trim()) {
      onAdd(newType.trim());
      toast({
        title: 'Document Type Added',
        description: `"${newType.trim()}" has been added to the list of document types.`,
      });
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>Add Type</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
