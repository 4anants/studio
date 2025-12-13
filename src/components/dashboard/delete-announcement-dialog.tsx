
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
import type { Announcement } from '@/lib/types';
import { useState } from 'react';

interface DeleteAnnouncementDialogProps {
  announcement: Announcement;
  onDelete: () => void;
  isPermanent: boolean;
  children: React.ReactNode;
}

export function DeleteAnnouncementDialog({ announcement, onDelete, isPermanent, children }: DeleteAnnouncementDialogProps) {
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
            {isPermanent ? (
              <>
                This action will <span className="font-semibold text-destructive">permanently delete</span> the announcement titled "{' '}"
                <span className="font-semibold text-foreground">{announcement.title}</span>. This action cannot be undone.
              </>
            ) : (
              <>
                This action will move the announcement titled "{' '}"
                <span className="font-semibold text-foreground">{announcement.title}</span> to the deleted announcements list.
                You can restore it later.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            {isPermanent ? 'Delete Permanently' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
