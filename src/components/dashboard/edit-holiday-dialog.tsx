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
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { holidayLocations } from '@/lib/constants';
import { type Holiday, type HolidayLocation } from '@/lib/types';

interface EditHolidayDialogProps {
    holiday: Holiday;
    onSave: (updatedHoliday: Holiday) => void;
    children: React.ReactNode;
}

export function EditHolidayDialog({ holiday, onSave, children }: EditHolidayDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(holiday.name);
    // Ensure we handle date string vs Date object correctly
    const [date, setDate] = useState<Date | undefined>(
        holiday.date ? new Date(holiday.date) : undefined
    );
    const [location, setLocation] = useState<HolidayLocation>(holiday.location);

    // Sync state if holiday prop changes meaningfully (e.g. from parent refresh)
    // This is useful if the dialog is reused or data refreshes while mounted
    useEffect(() => {
        setName(holiday.name);
        setDate(holiday.date ? new Date(holiday.date) : undefined);
        setLocation(holiday.location);
    }, [holiday]);

    const handleSave = () => {
        if (name.trim() && date && location) {
            onSave({
                ...holiday,
                name: name.trim(),
                date: format(date, 'yyyy-MM-dd'), // Keep it as string like "2023-12-25" for backend
                location
            });
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Holiday</DialogTitle>
                    <DialogDescription>Update holiday details.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-date" className="text-right">
                            Date
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        'col-span-3 justify-start text-left font-normal',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-location" className="text-right">
                            Location
                        </Label>
                        <Select onValueChange={(value: HolidayLocation) => setLocation(value)} value={location}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {holidayLocations.map(loc => (
                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
