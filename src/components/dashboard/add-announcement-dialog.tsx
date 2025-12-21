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
import { Bell, Calendar as CalendarIcon } from 'lucide-react';
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
  onAdd: (announcement: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    eventDate?: string;
    expiresOn?: string;
    targetDepartments: string[];
  }) => void;
  children: React.ReactNode;
  departments: string[];
}

export function AddAnnouncementDialog({ onAdd, children, departments }: AddAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [expiresOn, setExpiresOn] = useState<Date | undefined>();
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['All Departments']);

  const handleDepartmentToggle = (dept: string) => {
    // If clicking "All Departments"
    if (dept === 'All Departments') {
      setSelectedDepartments(['All Departments']);
      return;
    }

    // If clicking a specific department
    let newSelection = [...selectedDepartments];

    // Remove "All Departments" if it's there
    if (newSelection.includes('All Departments')) {
      newSelection = [];
    }

    // Toggle the selected department
    if (newSelection.includes(dept)) {
      newSelection = newSelection.filter(d => d !== dept);
    } else {
      newSelection.push(dept);
    }

    // If nothing selected, revert to "All Departments"
    if (newSelection.length === 0) {
      setSelectedDepartments(['All Departments']);
    } else {
      setSelectedDepartments(newSelection);
    }
  };

  const handleAdd = () => {
    if (title.trim() && message.trim()) {
      onAdd({
        title: title.trim(),
        message: message.trim(),
        priority,
        eventDate: eventDate ? format(eventDate, 'yyyy-MM-dd') : undefined,
        expiresOn: expiresOn ? format(expiresOn, 'yyyy-MM-dd') : undefined,
        targetDepartments: selectedDepartments
      });
      // Reset form
      setTitle('');
      setMessage('');
      setPriority('medium');
      setEventDate(undefined);
      setExpiresOn(undefined);
      setSelectedDepartments(['All Departments']);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Create Announcement
          </DialogTitle>
          <DialogDescription>Share important updates with employees</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>

          {/* Content */}
          <div className="grid gap-2">
            <Label htmlFor="content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Announcement details"
              rows={4}
            />
          </div>

          {/* Event Date */}
          <div className="grid gap-2">
            <Label htmlFor="event-date">Event Date (Required)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !eventDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, 'MM/dd/yyyy') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Announcement will be hidden after this date.</p>
          </div>


          {/* Priority */}
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Departments */}
          <div className="grid gap-2">
            <Label>Target Departments</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={selectedDepartments.includes('All Departments') ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDepartmentToggle('All Departments')}
              >
                All Departments
              </Button>
              {departments && departments.length > 0 ? departments.map(dept => (
                <Button
                  key={dept}
                  type="button"
                  variant={selectedDepartments.includes(dept) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDepartmentToggle(dept)}
                >
                  {dept}
                </Button>
              )) : (
                <span className="text-sm text-muted-foreground italic ml-2">No departments found</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</Button>
          <Button onClick={handleAdd} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
