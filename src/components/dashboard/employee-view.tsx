
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmployeeFileExplorer } from './employee-file-explorer'
import { BirthdayList } from './birthday-list'
import { UploadDialog } from './upload-dialog'
import { PhotoAdjustmentDialog } from './photo-adjustment-dialog'
import { EventCalendar } from './engagement/event-calendar'
import { PollsSurveys } from './engagement/polls-surveys'
import { CompanyResources } from './engagement/company-resources'
import { FeedbackBox } from './engagement/feedback-box'
import { useData } from '@/hooks/use-data'

import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { documentTypesList, holidayLocations } from '@/lib/constants'
import type { Document, HolidayLocation, Announcement, User } from '@/lib/types'
import { Button } from '../ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Calendar, Bell, MailOpen, Mail, AlertTriangle, LayoutDashboard, Shield } from 'lucide-react'
import Link from 'next/link'

// Simulate a logged-in employee user
type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function EmployeeView() {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    const { documents: serverDocuments, holidays: serverHolidays, announcements: serverAnnouncements, users: serverUsers, birthdays, mutateDocuments } = useData();

    // Find current user object to pass to dialog
    const currentUser = Array.isArray(serverUsers) ? (serverUsers as User[]).find(u => u.id === currentUserId) : null;

    // Local state for documents (though we could just use serverDocuments directly if we filtered them there)
    // The API /api/documents returns filtered list for employees.
    // So 'serverDocuments' IS 'userDocuments'.



    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [holidayLocationFilter, setHolidayLocationFilter] = useState<HolidayLocation | 'all'>('all');
    const [activeTab, setActiveTab] = useState('documents');
    const [birthdaySearchQuery, setBirthdaySearchQuery] = useState<string>('');
    const searchParams = useSearchParams();

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Annoucements read status is local only for now unless we add an API for it (we have /api/announcement-reads table in schema? Yes)
    // For now, let's simple-map it.
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        if (serverAnnouncements) {
            setAnnouncements(serverAnnouncements.map((a: Announcement) => ({
                ...a,
                isRead: false, // Default unread from server unless we fetch read status
                // TODO: fetch status
                status: a.status || 'published'
            } as Announcement)));
        }
    }, [serverAnnouncements]);

    const hasUnreadAnnouncements = useMemo(() => announcements.some(a => !a.isRead), [announcements]);

    useEffect(() => {
        const handleViewAnnouncements = () => {
            setActiveTab('announcements');
        };
        window.addEventListener('view-announcements', handleViewAnnouncements);
        return () => {
            window.removeEventListener('view-announcements', handleViewAnnouncements);
        };
    }, []);

    const handleUploadComplete = useCallback(() => {
        mutateDocuments();
    }, [mutateDocuments])



    const { holidayYears, holidayMonths } = useMemo(() => {
        const years = new Set<string>();
        const months = new Set<number>();

        (serverHolidays as any[]).forEach(holiday => {
            const date = new Date(holiday.date);
            years.add(date.getFullYear().toString());
            if (selectedYear === 'all' || date.getFullYear().toString() === selectedYear) {
                months.add(date.getMonth());
            }
        });
        return {
            holidayYears: Array.from(years).sort((a, b) => Number(b) - Number(a)),
            holidayMonths: Array.from(months).sort((a, b) => a - b)
        };
    }, [serverHolidays, selectedYear]);

    const filteredHolidays = useMemo(() => {
        return [...(serverHolidays as any[])]
            .filter(holiday => {
                const date = new Date(holiday.date);
                const locationMatch = holidayLocationFilter === 'all' || holiday.location === 'ALL' || holiday.location === holidayLocationFilter;
                const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
                const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
                return locationMatch && yearMatch && monthMatch;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [serverHolidays, holidayLocationFilter, selectedYear, selectedMonth]);

    const { announcementYears, announcementMonths } = useMemo(() => {
        const years = new Set<string>();
        const months = new Set<number>();
        announcements.forEach(announcement => {
            const date = new Date(announcement.date);
            years.add(date.getFullYear().toString());
            if (selectedYear === 'all' || date.getFullYear().toString() === selectedYear) {
                months.add(date.getMonth());
            }
        });
        return {
            announcementYears: Array.from(years).sort((a, b) => Number(b) - Number(a)),
            announcementMonths: Array.from(months).sort((a, b) => a - b)
        };
    }, [announcements, selectedYear]);

    const filteredAnnouncements = useMemo(() => {
        return [...announcements]
            .filter(announcement => announcement.status === 'published')
            .filter(announcement => {
                const date = new Date(announcement.date);
                const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
                const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
                return yearMatch && monthMatch;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [announcements, selectedYear, selectedMonth]);

    const onTabChange = useCallback((value: string) => {
        setActiveTab(value);
        setSelectedYear('all');
        setSelectedMonth('all');
        if (value === 'announcements') {
            setTimeout(() => {
                setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
                localStorage.setItem('announcements_all_read', 'true');
                window.dispatchEvent(new Event('storage'));
            }, 200);
        }
    }, []);

    const toggleAnnouncementRead = useCallback((id: string) => {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: !a.isRead } : a));
    }, []);

    const isEventUpcoming = (eventDate?: string) => {
        if (!eventDate) return false;
        if (typeof window === 'undefined') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eDate = new Date(eventDate);
        eDate.setTime(eDate.getTime() + eDate.getTimezoneOffset() * 60 * 1000); // Adjust for timezone
        return eDate >= today;
    }

    return (
        <>

            <div className="flex items-center justify-between">
                <div className="grid gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
                    <p className="text-muted-foreground">Access and manage your personal and company documents.</p>
                </div>
                <div className="flex gap-2">
                    {currentUser && <PhotoAdjustmentDialog user={currentUser} />}
                    <UploadDialog onUploadComplete={handleUploadComplete} />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="pt-4">
                <TabsList className="bg-[#12141c] border border-white/5 p-1 gap-1 h-auto flex-wrap rounded-xl">
                    <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-[#1a1c24] data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-400">My Documents</TabsTrigger>
                    <TabsTrigger value="holidays" className="rounded-lg data-[state=active]:bg-[#1a1c24] data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-400">Holiday List</TabsTrigger>
                    <TabsTrigger value="announcements" className="rounded-lg data-[state=active]:bg-[#1a1c24] data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all relative font-medium text-slate-400">
                        Announcements
                        {hasUnreadAnnouncements && <span className="relative flex h-3 w-3 ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>}
                    </TabsTrigger>
                    <TabsTrigger value="birthdays" className="rounded-lg data-[state=active]:bg-[#1a1c24] data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-400">Birthdays</TabsTrigger>
                    <TabsTrigger value="engagement" className="rounded-lg data-[state=active]:bg-[#1a1c24] data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-400">Engagement Hub</TabsTrigger>
                </TabsList>
                <TabsContent value="documents">
                    <EmployeeFileExplorer documents={serverDocuments as Document[]} currentUser={currentUser as User} />
                </TabsContent>
                <TabsContent value="holidays">
                    <Card>
                        <CardHeader>
                            <CardTitle>Holiday List</CardTitle>
                            <CardDescription>Upcoming company holidays for the year.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="flex-grow">
                                    <Label className="text-sm font-medium">Filter by Location</Label>
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <Button
                                            variant={holidayLocationFilter === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setHolidayLocationFilter('all')}
                                            className={cn(
                                                "rounded-xl transition-all font-medium",
                                                holidayLocationFilter === 'all'
                                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-0"
                                                    : "hover:bg-accent border-transparent"
                                            )}
                                        >
                                            All
                                        </Button>
                                        {holidayLocations.filter(l => l !== 'ALL').map(loc => (
                                            <Button
                                                key={loc}
                                                variant={holidayLocationFilter === loc ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setHolidayLocationFilter(loc)}
                                                className={cn(
                                                    "rounded-xl transition-all font-medium",
                                                    holidayLocationFilter === loc
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-0"
                                                        : "hover:bg-accent border-transparent"
                                                )}
                                            >
                                                {loc}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-end gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-medium">Year</Label>
                                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Years</SelectItem>
                                                {holidayYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-medium">Month</Label>
                                        <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Months</SelectItem>
                                                {holidayMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Holiday Name</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHolidays.length > 0 ? filteredHolidays.map(holiday => (
                                        <TableRow key={holiday.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                                </div>
                                            </TableCell>
                                            <TableCell>{holiday.name}</TableCell>
                                            <TableCell>
                                                <span className={cn('px-2 py-1 rounded-lg text-xs font-medium',
                                                    holiday.location === 'ALL' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' :
                                                        'bg-secondary text-secondary-foreground'
                                                )}>
                                                    {holiday.location}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">No holidays found for selected filters.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="announcements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Announcements</CardTitle>
                            <CardDescription>Stay up to date with the latest news and updates.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium">Year</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Years</SelectItem>
                                            {announcementYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium">Month</Label>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Months</SelectItem>
                                            {announcementMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {filteredAnnouncements.length > 0 ? filteredAnnouncements.map(announcement => {
                                    const isUpcoming = isEventUpcoming(announcement.eventDate);
                                    return (
                                        <div key={announcement.id} className={cn(
                                            "p-4 border rounded-lg relative overflow-hidden",
                                            !announcement.isRead && "bg-secondary",
                                            isUpcoming && "bg-blue-500/10 animate-pulse ring-2 ring-destructive"
                                        )}>
                                            <div className="absolute top-2 right-2">
                                                <Button variant="ghost" size="sm" onClick={() => toggleAnnouncementRead(announcement.id)}>
                                                    {announcement.isRead ? (
                                                        <>
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Mark as Unread
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MailOpen className="mr-2 h-4 w-4" />
                                                            Mark as Read
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Bell className="h-5 w-5 text-primary" />
                                                {announcement.title}
                                            </h3>
                                            {announcement.eventDate && (
                                                <div className={cn("mt-1 flex items-center gap-2 text-sm", isUpcoming ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Event Date: {new Date(announcement.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                                    {isUpcoming && <span className="text-xs font-bold">(UPCOMING)</span>}
                                                </div>
                                            )}
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Posted on {new Date(announcement.date).toLocaleString()} by {announcement.author}
                                            </p>
                                            <p className="mt-2 text-sm pr-32">{announcement.message}</p>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p>No announcements found for the selected period.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="birthdays">
                    <BirthdayList users={birthdays as User[]} searchQuery={birthdaySearchQuery} />
                </TabsContent>
                <TabsContent value="engagement">
                    <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <EventCalendar />
                                <CompanyResources />
                            </div>
                            <div className="space-y-6">
                                <PollsSurveys />
                            </div>
                        </div>
                        <FeedbackBox />
                    </div>
                </TabsContent>

            </Tabs>
        </>
    )
}
