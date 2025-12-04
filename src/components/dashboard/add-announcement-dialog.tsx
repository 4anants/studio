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
import { Textarea } from '../ui/textarea';

interface AddAnnouncementDialogProps {
  onAdd: (announcement: { title: string, message: string }) => void;
  children: React.ReactNode;
}

export function AddAnnouncementDialog({ onAdd, children }: AddAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleAdd = () => {
    if (title.trim() && message.trim()) {
      onAdd({ title: title.trim(), message: message.trim() });
      setTitle('');
      setMessage('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
          <DialogDescription>Create a new announcement to be broadcast to all employees.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 'Company Offsite Next Month'"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">
                Message
            </Label>
            <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the announcement details here..."
                rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>Publish Announcement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
