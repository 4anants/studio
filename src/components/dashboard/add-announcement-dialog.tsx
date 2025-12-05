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
import { Bell, Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddAnnouncementDialogProps {
  onAdd: (announcement: { title: string, message: string, eventDate?: string }) => void;
  children: React.ReactNode;
}

export function AddAnnouncementDialog({ onAdd, children }: AddAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>();

  const handleAdd = () => {
    if (title.trim() && message.trim()) {
      onAdd({ 
        title: title.trim(), 
        message: message.trim(), 
        eventDate: eventDate ? eventDate.toISOString().split('T')[0] : undefined 
      });
      setTitle('');
      setMessage('');
      setEventDate(undefined);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> New Announcement
          </DialogTitle>
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
          <div className="grid gap-2">
             <Label htmlFor="event-date">
                Event Date (Optional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'justify-start text-left font-normal',
                    !eventDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, 'PPP') : <span>Pick an event date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
                <Select
                    onValueChange={(value) =>
                        setEventDate(new Date(new Date().setDate(new Date().getDate() + parseInt(value))))
                    }
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Quick Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="1">Tomorrow</SelectItem>
                        <SelectItem value="3">In 3 days</SelectItem>
                        <SelectItem value="7">In a week</SelectItem>
                    </SelectContent>
                </Select>
                <div className="rounded-md border">
                    <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                    />
                </div>
                 {eventDate && (
                    <Button variant="ghost" size="sm" onClick={() => setEventDate(undefined)}>
                        <X className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>Publish Announcement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
