'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, BarChart3, FileText, Trash2, MessageSquare, Bell, Cake, Edit, CalendarPlus, Download, UploadCloud, FileJson, FileSpreadsheet, ThumbsUp, Loader2, Undo, Trash } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import useSWR from 'swr';
import { EngagementEvent, EngagementPoll, EngagementResource, EngagementFeedback, Announcement, Holiday, User, Department, HolidayLocation } from '@/lib/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { locations, holidayLocations, departments as defaultDepartments } from '@/lib/constants';
import { useData } from '@/hooks/use-data';
import { Checkbox } from "@/components/ui/checkbox";
import { AddAnnouncementDialog } from '@/components/dashboard/add-announcement-dialog';
import { EditAnnouncementDialog } from '@/components/dashboard/edit-announcement-dialog';
import { DeleteAnnouncementDialog } from '@/components/dashboard/delete-announcement-dialog';
import { AddHolidayDialog } from '@/components/dashboard/add-holiday-dialog';
import { EditHolidayDialog } from '@/components/dashboard/edit-holiday-dialog';
import { ImportExportButtons } from '@/components/dashboard/import-export-buttons';
import { BirthdayList } from '@/components/dashboard/birthday-list';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const LOCATION_OPTIONS = ['ALL', ...Object.keys(locations)];

export function AdminEngagementManager({ searchTerm = '' }: { searchTerm?: string }) {
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const {
        users,
        holidays: allHolidays,
        announcements: allAnnouncements,
        birthdays,
        departments,
        mutateHolidays,
        mutateAnnouncements
    } = useData();

    const { data: rawEvents, mutate: mutateEvents } = useSWR<EngagementEvent[]>('/api/engagement/events', fetcher);
    const { data: rawPolls, mutate: mutatePolls } = useSWR<EngagementPoll[]>('/api/engagement/polls', fetcher);
    const { data: rawResources, mutate: mutateResources } = useSWR<EngagementResource[]>('/api/engagement/resources?status=active', fetcher);
    const { data: rawFeedback, mutate: mutateFeedback } = useSWR<EngagementFeedback[]>('/api/engagement/feedback', fetcher);

    const events = useMemo(() => Array.isArray(rawEvents) ? rawEvents : [], [rawEvents]);
    const polls = useMemo(() => Array.isArray(rawPolls) ? rawPolls : [], [rawPolls]);
    const resources = useMemo(() => Array.isArray(rawResources) ? rawResources : [], [rawResources]);
    const feedback = useMemo(() => Array.isArray(rawFeedback) ? rawFeedback : [], [rawFeedback]);

    // Form States
    const [eventForm, setEventForm] = useState({ title: '', date: '', location: '', type: 'Outing', targetLocation: 'ALL', targetDepartment: 'ALL' });
    const [pollForm, setPollForm] = useState({ question: '', options: ['', ''], targetLocation: 'ALL', targetDepartment: 'ALL' });
    const [resourceForm, setResourceForm] = useState({ name: '', category: 'Mandatory Reading', type: 'PDF', url: '', targetLocation: 'ALL', targetDepartment: 'ALL' });
    const [resourceFile, setResourceFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [holidayLocationFilter, setHolidayLocationFilter] = useState<HolidayLocation | 'all'>('all');

    const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([]);
    const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

    // Filter Logic
    const publishedAnnouncements = useMemo(() => {
        return (allAnnouncements || []).filter(a => a.status === 'published');
    }, [allAnnouncements]);

    const activeHolidays = useMemo(() => {
        return (allHolidays || []).filter(h => h.status !== 'deleted');
    }, [allHolidays]);

    const filteredAnnouncements = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return publishedAnnouncements.filter(announcement => {
            const matchesSearch = (announcement.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (announcement.message || '').toLowerCase().includes(searchTerm.toLowerCase());

            let isExpired = false;
            if (announcement.eventDate) {
                const eventDate = new Date(announcement.eventDate);
                isExpired = eventDate < today;
            }

            return matchesSearch && !isExpired;
        }).sort((a, b) => {
            const dateA = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
            const dateB = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [publishedAnnouncements, searchTerm]);

    const filteredHolidays = useMemo(() => {
        return activeHolidays.filter(holiday =>
            (holiday.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
            (holidayLocationFilter === 'all' || holiday.location === holidayLocationFilter)
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [activeHolidays, searchTerm, holidayLocationFilter]);

    const filteredEvents = useMemo(() => {
        return events.filter(event =>
            (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.target_location || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [events, searchTerm]);

    const filteredPolls = useMemo(() => {
        return polls.filter(poll =>
            (poll.question || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (poll.target_location || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [polls, searchTerm]);

    const filteredResources = useMemo(() => {
        return resources.filter(res =>
            (res.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (res.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (res.target_location || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [resources, searchTerm]);

    const filteredFeedbackList = useMemo(() => {
        return feedback.filter(f =>
            (f.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.category || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [feedback, searchTerm]);


    const isEventUpcoming = (eventDate?: string) => {
        if (!eventDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eDate = new Date(eventDate);
        eDate.setTime(eDate.getTime() + eDate.getTimezoneOffset() * 60 * 1000);
        return eDate >= today;
    }

    // Engagement Handlers
    const handleAddEvent = async () => {
        const res = await fetch('/api/engagement/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventForm),
        });
        if (res.ok) {
            mutateEvents();
            toast({ title: "Event added" });
        }
    };

    const handleAddPoll = async () => {
        const res = await fetch('/api/engagement/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...pollForm }),
        });
        if (res.ok) {
            mutatePolls();
            setPollForm({ question: '', options: ['', ''], targetLocation: 'ALL', targetDepartment: 'ALL' });
            toast({ title: "Poll activated" });
        }
    };

    const handleAddResource = async () => {
        setIsUploading(true);
        try {
            let finalUrl = resourceForm.url;

            if (resourceForm.type === 'PDF' && resourceFile) {
                const formData = new FormData();
                formData.append('file', resourceFile);
                formData.append('category', 'Resources');

                const uploadRes = await fetch('/api/documents', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error('File upload failed');

                const uploadData = await uploadRes.json();
                finalUrl = uploadData.url;
            }

            const res = await fetch('/api/engagement/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: resourceForm.name,
                    category: resourceForm.category,
                    type: resourceForm.type,
                    url: finalUrl,
                    size: resourceFile ? `${(resourceFile.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A',
                    target_location: resourceForm.targetLocation,
                    target_department: resourceForm.targetDepartment
                }),
            });

            if (res.ok) {
                mutateResources();
                toast({ title: "Resource added successfully" });
                setResourceForm({ name: '', category: 'Mandatory Reading', type: 'PDF', url: '', targetLocation: 'ALL', targetDepartment: 'ALL' });
                setResourceFile(null);
            } else {
                const errData = await res.json();
                console.error("Server error:", errData);
                throw new Error(errData.error || 'Failed to save resource');
            }
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error adding resource", description: error.message || "Please check your inputs and try again.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };


    const handleDelete = async (type: 'events' | 'polls' | 'resources', id: string) => {
        const res = await fetch(`/api/engagement/${type}?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (type === 'events') mutateEvents();
            if (type === 'polls') mutatePolls();
            if (type === 'resources') mutateResources();
            toast({ title: "Item deleted", variant: "destructive" });
        }
    };

    const handleDeleteFeedback = async (id: string) => {
        const res = await fetch(`/api/engagement/feedback/delete?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            mutateFeedback();
            toast({ title: "Feedback deleted", variant: "destructive" });
        }
    };

    const handleBulkDeleteFeedback = async () => {
        try {
            await Promise.all(selectedFeedbackIds.map(id =>
                fetch(`/api/engagement/feedback/delete?id=${id}`, { method: 'DELETE' })
            ));
            mutateFeedback();
            setSelectedFeedbackIds([]);
            toast({ title: "Selected feedback deleted", variant: "destructive" });
        } catch (error) {
            toast({ title: "Error deleting feedback", variant: "destructive" });
        }
    };

    const handleSelectFeedback = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedFeedbackIds(prev => [...prev, id]);
        } else {
            setSelectedFeedbackIds(prev => prev.filter(fid => fid !== id));
        }
    };

    const handleSelectAllFeedback = (checked: boolean) => {
        if (checked) {
            setSelectedFeedbackIds(filteredFeedbackList.map(f => f.id));
        } else {
            setSelectedFeedbackIds([]);
        }
    };

    const handleSelectResource = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedResourceIds(prev => [...prev, id]);
        } else {
            setSelectedResourceIds(prev => prev.filter(rid => rid !== id));
        }
    };

    const handleSelectAllResources = (checked: boolean) => {
        if (checked) {
            setSelectedResourceIds(filteredResources.map(r => r.id));
        } else {
            setSelectedResourceIds([]);
        }
    };

    const handleBulkDeleteResources = async () => {
        try {
            await Promise.all(selectedResourceIds.map(id =>
                fetch(`/api/engagement/resources?id=${id}`, { method: 'DELETE' })
            ));
            mutateResources();
            setSelectedResourceIds([]);
            toast({ title: "Selected resources moved to trash" });
        } catch (error) {
            toast({ title: "Error deleting resources", variant: "destructive" });
        }
    };

    // Export Functions
    const handleExportEvents = () => {
        const dataToExport = events.map(e => ({
            title: e.title,
            date: e.date,
            location: e.location,
            type: e.type,
            target_location: e.target_location,
            target_department: e.target_department
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportPolls = () => {
        const dataToExport = polls.map(p => ({
            question: p.question,
            options: JSON.stringify(p.options),
            totalVotes: p.totalVotes,
            target_location: p.target_location,
            target_department: p.target_department
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `polls_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportResources = () => {
        const dataToExport = resources.map(r => ({
            name: r.name,
            category: r.category,
            type: r.type,
            url: r.url,
            target_location: r.target_location,
            target_department: r.target_department
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resources_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportFeedback = () => {
        exportFeedbackData(feedback);
    };

    const handleExportSelectedFeedback = () => {
        const selected = feedback.filter(f => selectedFeedbackIds.includes(f.id));
        exportFeedbackData(selected);
    };

    const handleExportSingleFeedback = (f: EngagementFeedback) => {
        exportFeedbackData([f]);
    };

    const exportFeedbackData = (data: EngagementFeedback[]) => {
        const dataToExport = data.map(f => ({
            user_name: f.user_name,
            user_email: f.user_email,
            message: f.message,
            category: f.category,
            is_public: f.is_public,
            votes: f.vote_count || 0,
            created_at: f.created_at
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Announcement Handlers
    const handleAddAnnouncement = (announcement: {
        title: string;
        message: string;
        priority: 'low' | 'medium' | 'high';
        eventDate?: string;
        expiresOn?: string;
        targetDepartments: string[];
    }) => {
        const performAdd = async () => {
            try {
                const res = await fetch('/api/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...announcement,
                        id: `anno-${Date.now()}`,
                        date: new Date().toISOString(),
                        author: 'Admin',
                        status: 'published',
                        event_date: announcement.eventDate,
                        target_departments: announcement.targetDepartments.join(', ')
                    })
                });
                if (!res.ok) throw new Error('Failed to add');
                await mutateAnnouncements();
                toast({ title: 'Announcement Published' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        };
        performAdd();
    };

    const handleEditAnnouncement = (announcement: {
        id: string;
        title: string;
        message: string;
        priority: 'low' | 'medium' | 'high';
        eventDate?: string;
        expiresOn?: string;
        targetDepartments: string[];
    }) => {
        const performEdit = async () => {
            try {
                const res = await fetch('/api/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...announcement,
                        date: new Date().toISOString(),
                        author: 'Admin',
                        status: 'published',
                        event_date: announcement.eventDate,
                        target_departments: announcement.targetDepartments.join(', ')
                    })
                });
                if (!res.ok) throw new Error('Failed to update');
                await mutateAnnouncements();
                toast({ title: 'Announcement Updated' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        };
        performEdit();
    };


    const handleDeleteAnnouncement = async (id: string) => {
        try {
            const res = await fetch(`/api/announcements?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            await mutateAnnouncements();
            toast({ title: 'Announcement Deleted' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };



    const handleExportAnnouncements = () => {
        const dataToExport = publishedAnnouncements.map(a => ({
            title: a.title,
            message: a.message,
            priority: a.priority,
            eventDate: a.eventDate,
            targetDepartments: a.targetDepartments
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `announcements_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleImportAnnouncements = async (importedData: any[]) => {
        try {
            await Promise.all(importedData.map(item =>
                fetch('/api/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...item,
                        id: item.id || `anno-${Date.now()}-${Math.random()}`,
                        date: new Date().toISOString(),
                        author: 'Admin',
                        status: 'published',
                        event_date: item.eventDate,
                        target_departments: item.targetDepartments || ''
                    })
                })
            ));
            await mutateAnnouncements();
            toast({ title: "Import Successful" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Import Failed" });
        }
    };


    // Holiday Handlers
    const handleAddHoliday = (newHoliday: { name: string; date: Date, location: HolidayLocation }) => {
        const performAdd = async () => {
            try {
                const res = await fetch('/api/holidays', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...newHoliday,
                        id: `hol-${Date.now()}`,
                        date: newHoliday.date.toISOString().split('T')[0]
                    })
                });
                if (!res.ok) throw new Error('Failed to add');
                await mutateHolidays();
                toast({ title: 'Holiday Added' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        };
        performAdd();
    };

    const handleEditHoliday = async (holiday: Holiday) => {
        try {
            const res = await fetch('/api/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(holiday)
            });
            if (!res.ok) throw new Error('Failed to update');
            await mutateHolidays();
            toast({ title: 'Holiday Updated' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };


    const handleDeleteHoliday = async (id: string) => {
        try {
            const res = await fetch(`/api/holidays?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            await mutateHolidays();
            toast({ title: 'Holiday Deleted' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };



    const handleExportHolidays = () => {
        const csv = Papa.unparse(activeHolidays.map(({ name, date, location }) => ({ name, date, location })));
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `holidays_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleImportHolidays = async (importedData: any[]) => {
        try {
            await Promise.all(importedData.map(item =>
                fetch('/api/holidays', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...item, id: `hol-${Date.now()}-${Math.random()}` })
                })
            ));
            await mutateHolidays();
            toast({ title: "Import Successful" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Import Failed" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>

                </div>
            </div>

            <Tabs defaultValue="events" className="w-full">
                <div className="overflow-x-auto pb-4">
                    <TabsList className="flex w-max bg-slate-100 dark:bg-muted border border-slate-200 dark:border-white/5 p-1 gap-1 h-auto rounded-xl">
                        <TabsTrigger value="events" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium">
                            <Calendar className="h-4 w-4" /> Events
                        </TabsTrigger>
                        <TabsTrigger value="announcements" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium">
                            <Bell className="h-4 w-4" /> Announcements
                        </TabsTrigger>
                        <TabsTrigger value="holidays" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium">
                            <Calendar className="h-4 w-4" /> Holidays
                        </TabsTrigger>
                        <TabsTrigger value="birthdays" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium">
                            <Cake className="h-4 w-4" /> Birthdays
                        </TabsTrigger>
                        <TabsTrigger value="polls" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium">
                            <BarChart3 className="h-4 w-4" /> Polls
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium">
                            <FileText className="h-4 w-4" /> Resources
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium">
                            <MessageSquare className="h-4 w-4" /> Feedback
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Events Tab */}
                <TabsContent value="events" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportEvents}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" /> Export to CSV
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium px-4"><Plus className="mr-2 h-4 w-4" /> Add Event</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Event</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={eventForm.type} onValueChange={v => setEventForm({ ...eventForm, type: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Outing">Outing</SelectItem>
                                                    <SelectItem value="Webinar">Webinar</SelectItem>
                                                    <SelectItem value="Social">Social</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Target Location</Label>
                                            <Select value={eventForm.targetLocation} onValueChange={v => setEventForm({ ...eventForm, targetLocation: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {LOCATION_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Target Department</Label>
                                            <Select value={eventForm.targetDepartment} onValueChange={v => setEventForm({ ...eventForm, targetDepartment: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['ALL', ...(departments && departments.length > 0 ? departments.map(d => d.name) : defaultDepartments)].map(d => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter><Button onClick={handleAddEvent}>Save Event</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {filteredEvents.length === 0 && <p className="text-center text-muted-foreground py-8">No events found.</p>}
                        {filteredEvents.map((event: EngagementEvent) => (
                            <Card key={event.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-bold">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">{event.date} • {event.target_location} • {event.target_department}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete('events', event.id)}><Trash2 className="h-4 w-4" /></Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-4 pt-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <ImportExportButtons
                                itemName="Announcements"
                                onExport={handleExportAnnouncements}
                                onImport={handleImportAnnouncements}
                                onDownloadSample={() => { }}
                            />
                            <AddAnnouncementDialog
                                onAdd={handleAddAnnouncement}
                                departments={departments && departments.length > 0 ? departments.map(d => d.name) : defaultDepartments}
                            >
                                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium px-4">
                                    <Bell className="mr-2 h-4 w-4" /> Add New
                                </Button>
                            </AddAnnouncementDialog>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event Date</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="hidden md:table-cell">Message</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAnnouncements.length > 0 ? filteredAnnouncements.map(announcement => {
                                        const isUpcoming = isEventUpcoming(announcement.eventDate);
                                        return (
                                            <TableRow key={announcement.id} className={cn(isMounted && isUpcoming && "bg-blue-500/10")}>
                                                <TableCell>
                                                    {announcement.eventDate ? (
                                                        <span className={cn(
                                                            'px-2 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/5',
                                                            isMounted && new Date(announcement.eventDate) > new Date() ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                                        )}>
                                                            {isMounted ? new Date(announcement.eventDate).toLocaleDateString() : null}
                                                        </span>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={announcement.priority === 'high' ? 'destructive' : announcement.priority === 'medium' ? 'default' : 'secondary'}>
                                                        {announcement.priority || 'medium'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{announcement.title}</TableCell>
                                                <TableCell className="hidden md:table-cell max-w-sm truncate">{announcement.message}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <EditAnnouncementDialog
                                                            announcement={announcement}
                                                            onSave={handleEditAnnouncement}
                                                            departments={departments && departments.length > 0 ? departments.map(d => d.name) : defaultDepartments}
                                                        >
                                                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                        </EditAnnouncementDialog>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAnnouncement(announcement.id)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No announcements found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Holidays Tab */}
                <TabsContent value="holidays" className="space-y-4 pt-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Label className="text-sm font-medium">Location</Label>
                            <Select value={holidayLocationFilter} onValueChange={(value) => setHolidayLocationFilter(value as HolidayLocation | 'all')}>
                                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {holidayLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <ImportExportButtons
                                itemName="Holidays"
                                onExport={handleExportHolidays}
                                onImport={handleImportHolidays}
                                onDownloadSample={() => { }}
                            />
                            <AddHolidayDialog onAdd={handleAddHoliday}>
                                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium px-4">
                                    <CalendarPlus className="mr-2 h-4 w-4" /> Add New
                                </Button>
                            </AddHolidayDialog>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHolidays.length > 0 ? filteredHolidays.map(holiday => (
                                        <TableRow key={holiday.id}>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                                                    {isMounted ? new Date(holiday.date).toLocaleDateString() : null}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{holiday.name}</TableCell>
                                            <TableCell><Badge variant="secondary">{holiday.location}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <EditHolidayDialog holiday={holiday} onSave={handleEditHoliday}>
                                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                    </EditHolidayDialog>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteHoliday(holiday.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No holidays found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Birthdays Tab */}
                <TabsContent value="birthdays" className="pt-4">
                    <BirthdayList users={birthdays as User[]} searchQuery={searchTerm} />
                </TabsContent>

                {/* Polls Tab */}
                <TabsContent value="polls" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPolls}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" /> Export to CSV
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium px-4"><Plus className="mr-2 h-4 w-4" /> Create Poll</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Create New Poll</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Question</Label>
                                        <Input value={pollForm.question} onChange={e => setPollForm({ ...pollForm, question: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Options</Label>
                                        {pollForm.options.map((opt, i) => (
                                            <Input key={i} value={opt} onChange={e => {
                                                const newOpts = [...pollForm.options];
                                                newOpts[i] = e.target.value;
                                                setPollForm({ ...pollForm, options: newOpts });
                                            }} placeholder={`Option ${i + 1}`} className="mb-2" />
                                        ))}
                                        <Button variant="ghost" size="sm" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })}>+ Add Option</Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Target Location</Label>
                                            <Select value={pollForm.targetLocation} onValueChange={(v: string) => setPollForm({ ...pollForm, targetLocation: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {LOCATION_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Target Department</Label>
                                            <Select value={pollForm.targetDepartment} onValueChange={(v: string) => setPollForm({ ...pollForm, targetDepartment: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['ALL', ...(departments && departments.length > 0 ? departments.map(d => d.name) : defaultDepartments)].map(d => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter><Button onClick={handleAddPoll}>Activate Poll</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="grid gap-4">
                        {filteredPolls.length === 0 && <p className="text-center text-muted-foreground py-8">No polls found.</p>}
                        {filteredPolls.map((poll: EngagementPoll) => (
                            <Card key={poll.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-bold">{poll.question}</p>
                                        <p className="text-xs text-muted-foreground">{poll.totalVotes} votes • {poll.target_location} • {poll.target_department}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete('polls', poll.id)}><Trash2 className="h-4 w-4" /></Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg border border-border/40">
                        <div></div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportResources}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" /> Export CSV
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium px-4"><Plus className="mr-2 h-4 w-4" /> Add Resource</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Add Company Resource</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input value={resourceForm.name} onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={resourceForm.type} onValueChange={v => setResourceForm({ ...resourceForm, type: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PDF">PDF</SelectItem>
                                                    <SelectItem value="Link">Web Link</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {resourceForm.type === 'PDF' ? (
                                            <div className="space-y-2">
                                                <Label>Upload PDF</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => setResourceFile(e.target.files ? e.target.files[0] : null)}
                                                        className="cursor-pointer"
                                                    />
                                                </div>
                                                {resourceFile && <p className="text-xs text-muted-foreground">Selected: {resourceFile.name}</p>}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>URL / Link</Label>
                                                <Input value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })} placeholder="https://..." />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Target Location</Label>
                                                <Select value={resourceForm.targetLocation} onValueChange={v => setResourceForm({ ...resourceForm, targetLocation: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {LOCATION_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Target Department</Label>
                                                <Select value={resourceForm.targetDepartment} onValueChange={(v: string) => setResourceForm({ ...resourceForm, targetDepartment: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {['ALL', ...(departments && departments.length > 0 ? departments.map(d => d.name) : defaultDepartments)].map(d => (
                                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddResource} disabled={isUploading}>
                                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isUploading ? 'Saving...' : 'Save Resource'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-4 bg-muted/30 p-2 rounded-lg border border-border/40 mt-4">
                        <div className="flex items-center gap-2 px-2">
                            <Checkbox
                                id="select-all-resources"
                                checked={filteredResources.length > 0 && selectedResourceIds.length === filteredResources.length}
                                onCheckedChange={(checked) => handleSelectAllResources(checked as boolean)}
                            />
                            <Label htmlFor="select-all-resources" className="text-sm font-medium cursor-pointer text-muted-foreground">Select All</Label>
                        </div>
                        {selectedResourceIds.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDeleteResources}
                                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Selected ({selectedResourceIds.length})
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredResources.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No resources found.</p>}
                        {filteredResources.map((res: EngagementResource) => (
                            <Card key={res.id} className={cn("relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm group", selectedResourceIds.includes(res.id) && "ring-2 ring-emerald-500 bg-emerald-500/5")}>
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-600")}></div>
                                <CardContent className="p-3 pl-5 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Checkbox
                                                checked={selectedResourceIds.includes(res.id)}
                                                onCheckedChange={(checked) => handleSelectResource(res.id, checked as boolean)}
                                                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 shrink-0"
                                            />
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <h4 className="font-bold text-sm text-foreground truncate" title={res.name}>{res.name}</h4>
                                                <span className="text-xs text-muted-foreground shrink-0">•</span>
                                                <p className="text-xs text-muted-foreground font-mono truncate">{res.type} {res.size && res.size !== 'N/A' ? `(${res.size})` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {res.created_at && (
                                                <span className="text-[10px] text-muted-foreground font-mono opacity-70 hidden sm:inline-block">
                                                    {new Date(res.created_at).toLocaleDateString()}
                                                </span>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all hover:scale-110 active:scale-95 rounded-full"
                                                onClick={() => handleDelete('resources', res.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="text-sm text-foreground/90 bg-muted/30 p-2 rounded border border-border/50 ml-7 truncate">
                                        {res.url ? (
                                            <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                                                {res.type === 'PDF' ? <FileText className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                                                {res.url}
                                            </a>
                                        ) : (
                                            <span className="italic text-muted-foreground">No URL provided</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 ml-7 flex-wrap">
                                        <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30 border px-1.5 py-0">
                                            {res.category}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground/70 border px-1.5 rounded-sm bg-background">
                                            {res.target_location === 'ALL' ? 'Global' : res.target_location}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/70 border px-1.5 rounded-sm bg-background">
                                            {res.target_department === 'ALL' ? 'All Depts' : res.target_department}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center mb-4 bg-muted/30 p-2 rounded-lg border border-border/40">
                        <div className="flex items-center gap-2 px-2">
                            <Checkbox
                                id="select-all-feedback"
                                checked={filteredFeedbackList.length > 0 && selectedFeedbackIds.length === filteredFeedbackList.length}
                                onCheckedChange={(checked) => handleSelectAllFeedback(checked as boolean)}
                            />
                            <Label htmlFor="select-all-feedback" className="text-sm font-medium cursor-pointer text-muted-foreground">Select All</Label>
                        </div>
                        <div className="flex gap-2">
                            {selectedFeedbackIds.length > 0 && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBulkDeleteFeedback}
                                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Selected ({selectedFeedbackIds.length})
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleExportSelectedFeedback}
                                    >
                                        <Download className="h-4 w-4 mr-2" /> Export Selected ({selectedFeedbackIds.length})
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportFeedback}
                                className="gap-2"
                                disabled={selectedFeedbackIds.length > 0}
                            >
                                <Download className="h-4 w-4" /> Export All
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredFeedbackList.length === 0 && <p className="text-center text-muted-foreground py-12">No feedback found.</p>}
                        {filteredFeedbackList.map((f: EngagementFeedback) => (
                            <Card key={f.id} className={cn("relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm group", selectedFeedbackIds.includes(f.id) && "ring-2 ring-primary bg-primary/5")}>
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-rose-600"></div>

                                <CardContent className="p-3 pl-5 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedFeedbackIds.includes(f.id)}
                                                onCheckedChange={(checked) => handleSelectFeedback(f.id, checked as boolean)}
                                            />
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-foreground">{f.user_name}</h4>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <p className="text-xs text-muted-foreground font-mono">{f.user_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground font-mono opacity-70">
                                                {f.created_at ? new Date(f.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                            </span>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-full"
                                                onClick={() => handleExportSingleFeedback(f)}
                                                title="Export Feedback"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110 active:scale-95 rounded-full"
                                                onClick={() => handleDeleteFeedback(f.id)}
                                                title="Delete Feedback"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground/90 leading-snug bg-muted/30 p-2 rounded border border-border/50 ml-7">
                                        {f.message}
                                    </p>

                                    <div className="flex items-center gap-2 mt-1 ml-7">
                                        <Badge variant="secondary" className="text-[10px] font-medium bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30 border px-1.5 py-0">
                                            {f.category}
                                        </Badge>
                                        {f.is_public && (
                                            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30 border flex gap-1 items-center px-1.5 py-0">
                                                <span>Public</span>
                                                <span className="w-px h-2.5 bg-emerald-200 dark:bg-emerald-800"></span>
                                                <ThumbsUp className="h-2.5 w-2.5" /> {f.vote_count || 0}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
