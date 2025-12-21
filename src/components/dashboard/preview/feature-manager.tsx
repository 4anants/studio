'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, BarChart3, FileText, Trash2, UserCog, ShieldCheck } from 'lucide-react';
import { previewStore, INITIAL_EVENTS, INITIAL_POLLS, INITIAL_RESOURCES } from './preview-store';
import { useToast } from '@/hooks/use-toast';
import { locations, departments } from '@/lib/constants';

const LOCATION_OPTIONS = ['ALL', ...Object.keys(locations)];
const DEPARTMENT_OPTIONS = ['ALL', ...departments];

export function FeatureManager() {
    const { toast } = useToast();
    const [role, setRole] = useState(() => previewStore.getRole());

    // States for adding data
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventType, setEventType] = useState('Outing');
    const [eventLoc, setEventLoc] = useState('ALL');
    const [eventDept, setEventDept] = useState('ALL');

    const [resourceName, setResourceName] = useState('');
    const [resourceCategory, setResourceCategory] = useState('Mandatory Reading');
    const [resourceType, setResourceType] = useState('PDF');

    const [pollQuestion, setPollQuestion] = useState('');
    const [pollLoc, setPollLoc] = useState('ALL');
    const [pollDept, setPollDept] = useState('ALL');
    const [pollOptions, setPollOptions] = useState(['Option 1', 'Option 2']);

    useEffect(() => {
        const handleRoleUpdate = (e: any) => setRole(e.detail.role);
        window.addEventListener('preview_role_updated', handleRoleUpdate);
        return () => window.removeEventListener('preview_role_updated', handleRoleUpdate);
    }, []);

    const toggleRole = () => {
        const newRole = role === 'admin' ? 'employee' : 'admin';
        previewStore.setRole(newRole);
        toast({ title: `Switched to ${newRole.toUpperCase()} mode` });
    };

    const addEvent = () => {
        if (!eventTitle || !eventDate) return;
        const current = previewStore.get('events', INITIAL_EVENTS);
        const newEvent = {
            id: Date.now().toString(),
            title: eventTitle,
            date: eventDate,
            time: "10:00 AM",
            location: eventLoc === 'ALL' ? 'Company-wide' : eventLoc,
            type: eventType,
            color: "bg-blue-500",
            targetLocation: eventLoc,
            targetDepartment: eventDept
        };
        previewStore.set('events', [...current, newEvent]);
        setEventTitle('');
        toast({ title: "Event Added", description: `Visible to: ${eventLoc}/${eventDept}` });
    };

    const addPoll = () => {
        if (!pollQuestion || pollOptions.some(opt => !opt)) return;
        const current = previewStore.get('polls', INITIAL_POLLS);
        const newPoll = {
            id: Date.now().toString(),
            question: pollQuestion,
            options: pollOptions.map((opt, i) => ({ id: String.fromCharCode(97 + i), text: opt, votes: 0 })),
            isActive: true,
            targetLocation: pollLoc,
            targetDepartment: pollDept
        };
        previewStore.set('polls', [newPoll, ...current.map((p: any) => ({ ...p, isActive: false }))]);
        setPollQuestion('');
        setPollOptions(['Option 1', 'Option 2']);
        toast({ title: "Poll Added", description: `Visible to: ${pollLoc}/${pollDept}` });
    };

    const addResource = () => {
        if (!resourceName) return;
        const current = previewStore.get('resources', INITIAL_RESOURCES);
        const newResource = {
            id: Date.now().toString(),
            name: resourceName,
            category: resourceCategory,
            type: resourceType,
            size: resourceType === 'PDF' ? '1.5 MB' : undefined
        };
        previewStore.set('resources', [...current, newResource]);
        setResourceName('');
        toast({ title: "Resource Added", description: "The link/document is now available." });
    };

    const clearAll = () => {
        localStorage.removeItem('preview_events');
        localStorage.removeItem('preview_resources');
        localStorage.removeItem('preview_polls');
        window.dispatchEvent(new CustomEvent('preview_data_updated', { detail: { key: 'events' } }));
        window.dispatchEvent(new CustomEvent('preview_data_updated', { detail: { key: 'resources' } }));
        window.dispatchEvent(new CustomEvent('preview_data_updated', { detail: { key: 'polls' } }));
        toast({ title: "Data Reset", description: "Preview data has been restored to defaults." });
    };

    return (
        <Card className="border-primary/20 shadow-md bg-primary/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Preview Hub Manager
                    </CardTitle>
                    <CardDescription>Simulate Admin/User behavior and manage target visibility.</CardDescription>
                </div>
                <Button
                    variant={role === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleRole}
                    className="flex items-center gap-2 rounded-full"
                >
                    {role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                    Mode: {role.toUpperCase()}
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* User Simulation Meta */}
                <div className="p-4 rounded-xl bg-muted/40 border border-muted-foreground/10">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <UserCog className="h-3 w-3" /> Simulated User Profile
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold">Current Location</Label>
                            <Select
                                value={previewStore.getMeta().location}
                                onValueChange={(v) => previewStore.setMeta({ ...previewStore.getMeta(), location: v })}
                            >
                                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {LOCATION_OPTIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold">Current Department</Label>
                            <Select
                                value={previewStore.getMeta().department}
                                onValueChange={(v) => previewStore.setMeta({ ...previewStore.getMeta(), department: v })}
                            >
                                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENT_OPTIONS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    {/* Anyone can add - as requested */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 shadow-sm">
                                <Calendar className="h-4 w-4 text-blue-500" /> New Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label>Event Title</Label>
                                        <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g., Summer Picnic" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select onValueChange={setEventType} value={eventType}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Outing">Outing</SelectItem>
                                                <SelectItem value="Webinar">Webinar</SelectItem>
                                                <SelectItem value="Social">Social</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase">Target Location</Label>
                                        <Select onValueChange={setEventLoc} value={eventLoc}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {LOCATION_OPTIONS.map(loc => <SelectItem key={loc} value={loc} className="text-xs">{loc}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase">Target Department</Label>
                                        <Select onValueChange={setEventDept} value={eventDept}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {DEPARTMENT_OPTIONS.map(dept => <SelectItem key={dept} value={dept} className="text-xs">{dept}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={addEvent} className="w-full rounded-full">Save Event</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 shadow-sm">
                                <BarChart3 className="h-4 w-4 text-purple-500" /> New Poll
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Create New Poll</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Question</Label>
                                    <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="What's your favorite color?" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Options</Label>
                                    {pollOptions.map((opt, i) => (
                                        <Input
                                            key={i}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...pollOptions];
                                                newOpts[i] = e.target.value;
                                                setPollOptions(newOpts);
                                            }}
                                            className="mb-2"
                                        />
                                    ))}
                                    <Button variant="ghost" size="sm" onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}>+ Add Option</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase">Target Location</Label>
                                        <Select onValueChange={setPollLoc} value={pollLoc}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {LOCATION_OPTIONS.map(loc => <SelectItem key={loc} value={loc} className="text-xs">{loc}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase">Target Department</Label>
                                        <Select onValueChange={setPollDept} value={pollDept}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {DEPARTMENT_OPTIONS.map(dept => <SelectItem key={dept} value={dept} className="text-xs">{dept}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={addPoll} className="w-full rounded-full">Activate Poll</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 shadow-sm">
                                <FileText className="h-4 w-4 text-orange-500" /> New Resource
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add Company Resource</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Resource Name</Label>
                                    <Input value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="e.g., HR Policy" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input value={resourceCategory} onChange={(e) => setResourceCategory(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select onValueChange={setResourceType} value={resourceType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PDF">PDF Document</SelectItem>
                                            <SelectItem value="Link">Web Link</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={addResource} className="w-full rounded-full">Add Resource</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-destructive flex items-center gap-2 ml-auto">
                        <Trash2 className="h-4 w-4" /> Reset Data
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
