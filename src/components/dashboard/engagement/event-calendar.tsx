'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Ensure Input is imported
import { Label } from "@/components/ui/label"; // Ensure Label is imported
import { Textarea } from "@/components/ui/textarea"; // Ensure Textarea is imported
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, MapPin, Trash2, Building2, Plus, Send, Sparkles, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { EngagementEvent, User, Department } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { cn } from '@/lib/utils';
import { locations, holidayLocations } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function EventCalendar() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const { data: currentUser } = useSWR<User>(session?.user ? `/api/users?email=${session.user.email}` : null, fetcher);
    const { departments } = useData();

    // Create Event State
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        type: 'General',
        description: '',
        target_department: 'ALL',
        target_location: 'ALL',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch events based on user's location and department
    const queryParams = currentUser
        ? `?location=${currentUser.location || 'ALL'}&department=${currentUser.department || 'ALL'}`
        : '';

    const { data: rawEvents, mutate } = useSWR<EngagementEvent[]>(`/api/engagement/events${queryParams}`, fetcher);
    const events = React.useMemo(() => Array.isArray(rawEvents) ? rawEvents : [], [rawEvents]);

    const deleteEvent = async (id: string) => {
        try {
            const res = await fetch(`/api/engagement/events?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            mutate();
            toast({ title: "Event Deleted", variant: "destructive" });
        } catch (e) {
            toast({ title: "Error deleting event", variant: "destructive" });
        }
    };

    const handleCreate = async () => {
        if (!newEvent.title || !newEvent.date) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/engagement/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newEvent,
                    target_location: newEvent.target_location,
                    target_department: newEvent.target_department
                }),
            });
            if (!res.ok) throw new Error();
            mutate();
            setNewEvent({
                title: '',
                date: '',
                time: '',
                location: '',
                type: 'General',
                description: '',
                target_department: 'ALL',
                target_location: 'ALL'
            });
            toast({ title: "Event Created", description: "Your event has been scheduled." });
        } catch (e) {
            toast({ title: "Error creating event", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAdmin = session?.user?.role === 'admin';

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left Column: Create Form */}
            <div className="w-full lg:w-[420px] flex-shrink-0">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                    <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm flex flex-col">
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600"></div>

                        <CardHeader className="pb-4 px-7 pt-7 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                                    <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                                        <CalendarIcon className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                        Schedule Event
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        Create a new event
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-7 pb-7 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Details</Label>
                                    <Input
                                        placeholder="Event Title"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="bg-muted/40"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            type="date"
                                            value={newEvent.date}
                                            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                            className="bg-muted/40"
                                        />
                                        <Input
                                            type="time"
                                            value={newEvent.time}
                                            onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                            className="bg-muted/40"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Input
                                        placeholder="Location (e.g. Conf Room A)"
                                        value={newEvent.location}
                                        onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                        className="bg-muted/40"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Select value={newEvent.type} onValueChange={v => setNewEvent({ ...newEvent, type: v })}>
                                        <SelectTrigger className="bg-muted/40">
                                            <SelectValue placeholder="Event Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="Outing">Outing</SelectItem>
                                            <SelectItem value="Webinar">Webinar</SelectItem>
                                            <SelectItem value="Social">Social</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Description..."
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className="bg-muted/40 min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visibility</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select value={newEvent.target_department} onValueChange={v => setNewEvent({ ...newEvent, target_department: v })}>
                                            <SelectTrigger className="bg-muted/40 text-xs h-9">
                                                <SelectValue placeholder="Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Depts</SelectItem>
                                                {departments?.map((dept: Department) => (
                                                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={newEvent.target_location} onValueChange={v => setNewEvent({ ...newEvent, target_location: v })}>
                                            <SelectTrigger className="bg-muted/40 text-xs h-9">
                                                <SelectValue placeholder="Location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {holidayLocations.map(loc => (
                                                    <SelectItem key={loc} value={loc}>{loc === 'ALL' ? 'All Locs' : loc}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                                onClick={handleCreate}
                                disabled={!newEvent.title || !newEvent.date || isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Schedule Event'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right Column: Events List */}
            <div className="flex-1 w-full">
                <div className="relative group h-full flex flex-col">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                    <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm h-full flex flex-col">
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-600"></div>

                        <CardHeader className="pb-4 px-7 pt-7">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                                        <div className="relative bg-gradient-to-br from-indigo-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                            Upcoming Events
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-0.5">
                                            {sortedEvents.length} scheduled event{sortedEvents.length !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 uppercase tracking-wider text-[10px] font-semibold px-3 py-1 rounded-full">
                                    Calendar
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="px-7 pb-7">
                            {sortedEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sortedEvents.map((event, index) => (
                                        <div
                                            key={event.id}
                                            className="group/item relative"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-xl opacity-40 group-hover/item:opacity-70 blur-sm animate-gradient-xy transition-opacity duration-500"></div>

                                            <div className="relative bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm p-5 rounded-xl border-2 border-indigo-500/20 group-hover/item:border-blue-500/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4 h-full">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200">
                                                        {event.type || 'Event'}
                                                    </Badge>
                                                    {isAdmin && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteEvent(event.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="space-y-2 flex-1">
                                                    <h4 className="font-bold text-lg leading-tight">{event.title}</h4>
                                                    <div className="text-sm text-muted-foreground space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="h-3 w-3 text-indigo-500" />
                                                            {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        {event.time && (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3 w-3 text-indigo-500" />
                                                                {event.time}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3 w-3 text-indigo-500" />
                                                            {event.location || event.target_location}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-border/50 text-[10px] text-muted-foreground flex items-center justify-between">
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {event.target_department === 'ALL' ? 'All Depts' : event.target_department}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-muted animate-in fade-in zoom-in-50 duration-500">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground font-medium">No upcoming events found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
