'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Users, Clock, ExternalLink, ChevronRight, Plus, Trash2, Building2 } from 'lucide-react';
import { previewStore, INITIAL_EVENTS } from './preview-store';
import { useToast } from '@/hooks/use-toast';

export function EventCalendarPreview() {
    const { toast } = useToast();
    const [events, setEvents] = useState(() => previewStore.get('events', INITIAL_EVENTS));
    const [role, setRole] = useState(() => previewStore.getRole());
    const [userMeta, setUserMeta] = useState(() => previewStore.getMeta());

    useEffect(() => {
        const handleUpdate = (e: any) => {
            if (e.detail?.key === 'events') setEvents(previewStore.get('events', INITIAL_EVENTS));
        };
        const handleRole = (e: any) => setRole(e.detail.role);
        const handleMeta = (e: any) => setUserMeta(e.detail);

        window.addEventListener('preview_data_updated', handleUpdate);
        window.addEventListener('preview_role_updated', handleRole);
        window.addEventListener('preview_meta_updated', handleMeta);

        return () => {
            window.removeEventListener('preview_data_updated', handleUpdate);
            window.removeEventListener('preview_role_updated', handleRole);
            window.removeEventListener('preview_meta_updated', handleMeta);
        };
    }, []);

    const deleteEvent = (id: string) => {
        const filtered = events.filter((e: any) => e.id !== id);
        previewStore.set('events', filtered);
        toast({ title: "Event Deleted", variant: "destructive" });
    };

    // Filter events based on visibility if not admin
    const visibleEvents = role === 'admin'
        ? events
        : events.filter((e: any) =>
            (e.targetLocation === 'ALL' || e.targetLocation === userMeta.location) &&
            (e.targetDepartment === 'ALL' || e.targetDepartment === userMeta.department)
        );

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                        <CalendarIcon className="h-5 w-5" />
                        Company Events
                    </CardTitle>
                    <CardDescription>Target: {userMeta.location}/{userMeta.department}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {visibleEvents.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground text-xs italic bg-muted/20 rounded-xl border border-dashed">
                        No upcoming events for your team.
                    </div>
                )}
                {visibleEvents.map((event: any) => (
                    <div key={event.id} className="group relative flex gap-4 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-200">
                        <div className={`w-1 rounded-full ${event.color || 'bg-primary'} shrink-0`} />
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{event.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground italic">
                                        <span className="flex items-center gap-1 font-medium text-primary/80">
                                            <CalendarIcon className="h-3 w-3" /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold">
                                            <MapPin className="h-3 w-3" /> {event.targetLocation}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-5">
                                        {event.type}
                                    </Badge>
                                    {role === 'admin' && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteEvent(event.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> {event.targetDepartment}
                                </div>
                                <span className="italic">{event.location}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
