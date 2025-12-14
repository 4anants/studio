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
import type { Announcement } from '@/lib/types';

interface EditAnnouncementDialogProps {
    announcement: Announcement;
    onSave: (announcement: {
        id: string;
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

export function EditAnnouncementDialog({ announcement, onSave, children, departments }: EditAnnouncementDialogProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [eventDate, setEventDate] = useState<Date | undefined>();
    const [expiresOn, setExpiresOn] = useState<Date | undefined>();
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['All Departments']);

    // Load announcement data when dialog opens
    useEffect(() => {
        if (open && announcement) {
            setTitle(announcement.title);
            setMessage(announcement.message);
            setPriority(announcement.priority || 'medium');

            if (announcement.eventDate) {
                setEventDate(new Date(announcement.eventDate));
            } else {
                setEventDate(undefined);
            }

            if (announcement.expiresOn) {
                setExpiresOn(new Date(announcement.expiresOn));
            } else {
                setExpiresOn(undefined);
            }

            if (announcement.targetDepartments) {
                const depts = announcement.targetDepartments.split(',').map(d => d.trim());
                setSelectedDepartments(depts.length > 0 ? depts : ['All Departments']);
            } else {
                setSelectedDepartments(['All Departments']);
            }
        }
    }, [open, announcement]);

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

    const handleSave = () => {
        if (title.trim() && message.trim()) {
            onSave({
                id: announcement.id,
                title: title.trim(),
                message: message.trim(),
                priority,
                eventDate: eventDate ? format(eventDate, 'yyyy-MM-dd') : undefined,
                expiresOn: expiresOn ? format(expiresOn, 'yyyy-MM-dd') : undefined,
                targetDepartments: selectedDepartments
            });
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Edit Announcement
                    </DialogTitle>
                    <DialogDescription>Update announcement details</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Title */}
                    <div className="grid gap-2">
                        <Label htmlFor="edit-title">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Announcement title"
                        />
                    </div>

                    {/* Content */}
                    <div className="grid gap-2">
                        <Label htmlFor="edit-content">
                            Content <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="edit-content"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Announcement details"
                            rows={4}
                        />
                    </div>

                    {/* Event Date */}
                    <div className="grid gap-2">
                        <Label htmlFor="edit-event-date">Event Date (Required)</Label>
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
                        <Label htmlFor="edit-priority">Priority</Label>
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
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
