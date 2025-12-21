'use client'

import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    FileText, Bell, Calendar, Eye, Cake,
    LayoutDashboard, Shield, FileIcon,
    MessageSquare, BarChart, BookOpen, Clock,
    ListIcon, GiftIcon, InfoIcon
} from 'lucide-react'



import useSWR from 'swr'
import type { Document, Announcement, Holiday, User } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { PinVerifyDialog } from './pin-verify-dialog'
import { UploadDialog } from './upload-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { EventCalendar } from './engagement/event-calendar'
import { PollsSurveys } from './engagement/polls-surveys'
import { CompanyResources } from './engagement/company-resources'
import { FeedbackBox } from './engagement/feedback-box'
import { EmployeeDocumentExplorer } from './employee-document-explorer';



const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EmployeeDashboard() {
    const { toast } = useToast()
    const { data: session } = useSession();
    const { data: rawDocuments, mutate: mutateDocuments } = useSWR<Document[]>('/api/documents', fetcher)
    const { data: rawAnnouncements } = useSWR<Announcement[]>('/api/announcements', fetcher)
    const { data: rawHolidays } = useSWR<Holiday[]>('/api/holidays', fetcher)
    const { data: rawUsers } = useSWR<User[]>('/api/users', fetcher)
    const { data: rawBirthdayUsers } = useSWR<User[]>('/api/birthdays', fetcher)
    const { data: rawEvents } = useSWR('/api/engagement/events', fetcher)
    const { data: wishes, mutate: mutateWishes } = useSWR<any[]>('/api/wishes', fetcher)
    const { data: rawPolls } = useSWR('/api/engagement/polls', fetcher)
    const { data: rawResources } = useSWR('/api/engagement/resources', fetcher)

    const documents = useMemo(() => Array.isArray(rawDocuments) ? rawDocuments : [], [rawDocuments]);
    const announcements = useMemo(() => Array.isArray(rawAnnouncements) ? rawAnnouncements : [], [rawAnnouncements]);
    const holidays = useMemo(() => Array.isArray(rawHolidays) ? rawHolidays : [], [rawHolidays]);
    const users = useMemo(() => Array.isArray(rawUsers) ? rawUsers : [], [rawUsers]);
    const birthdayUsers = useMemo(() => Array.isArray(rawBirthdayUsers) ? rawBirthdayUsers : [], [rawBirthdayUsers]);
    const events = useMemo(() => Array.isArray(rawEvents) ? rawEvents : [], [rawEvents]);
    const polls = useMemo(() => Array.isArray(rawPolls) ? rawPolls : [], [rawPolls]);
    const resources = useMemo(() => Array.isArray(rawResources) ? rawResources : [], [rawResources]);


    // Current active tab state
    const [activeTab, setActiveTab] = useState('documents');


    // PIN Verification State
    const [pinVerifyOpen, setPinVerifyOpen] = useState(false);

    const [pendingDoc, setPendingDoc] = useState<Document | null>(null);

    const handleView = (doc: Document) => {
        setPendingDoc(doc);
        setPinVerifyOpen(true);
    };

    const handlePinSuccess = () => {
        if (pendingDoc && pendingDoc.url) {
            window.open(pendingDoc.url, '_blank');
        }
        setPendingDoc(null);
    };

    const currentUserId = session?.user?.id;
    const currentUser = users.find(u => u.id === currentUserId)

    // Filter user's documents - use ownerId from API response
    const myDocuments = useMemo(() => {
        if (!currentUserId || !Array.isArray(documents)) return [];
        return documents.filter(doc => doc.ownerId === currentUserId);
    }, [documents, currentUserId])

    // Filter active announcements
    const activeAnnouncements = useMemo(() => {
        if (!Array.isArray(announcements)) return [];
        return announcements
            .filter(a => a.status === 'published')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
    }, [announcements])

    // Filter upcoming holidays
    const upcomingHolidays = useMemo(() => {
        if (!Array.isArray(holidays)) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return holidays
            .filter(h => {
                // Format is YYYY-MM-DD string assuming dateStrings: true
                const hDate = new Date(`${h.date}T00:00:00`);
                return hDate >= today;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
    }, [holidays])

    const upcomingBirthdaysCount = useMemo(() => {
        if (!Array.isArray(birthdayUsers)) return 0;
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        return birthdayUsers.filter(u => {
            if (!u.dateOfBirth || u.status !== 'active') return false;
            const dob = new Date(u.dateOfBirth);
            const currentYear = today.getFullYear();
            let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate());

            if (nextBday < new Date(today.setHours(0, 0, 0, 0))) {
                nextBday.setFullYear(currentYear + 1);
            }
            return nextBday <= sevenDaysFromNow;
        }).length;
    }, [birthdayUsers]);

    const upcomingEventsCount = useMemo(() => {
        if (!Array.isArray(events)) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return events.filter((e: any) => new Date(e.date) >= today).length;
    }, [events]);


    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }



    const handleWish = async (user: User) => {
        try {
            const res = await fetch('/api/wishes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: user.id })
            });

            if (res.ok) {
                toast({
                    title: `✨ Wished ${user.name}!`,
                    description: "Your best wishes have been sent.",
                });
                mutateWishes();
            } else {
                toast({
                    variant: "destructive",
                    title: "Already Sent",
                    description: "You have already wished them this year!",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send wish.",
            });
        }
    }

    const hasWished = (userId: string) => {
        if (!wishes || !session?.user) return false;
        const currentYear = new Date().getFullYear();
        return wishes.some(w => w.senderId === session.user.id && w.receiverId === userId && w.year === currentYear);
    };

    const myReceivedWishes = useMemo(() => {
        if (!wishes || !session?.user) return [];
        const currentYear = new Date().getFullYear();
        return wishes.filter(w => w.receiverId === session.user.id && w.year === currentYear);
    }, [wishes, session]);

    return (
        <div className="space-y-8">

            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Welcome back, {currentUser?.name || 'User'}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here's what's happening today
                    </p>
                </div>
                <div>
                    <UploadDialog onUploadComplete={() => mutateDocuments()} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* My Documents */}
                <div
                    onClick={() => setActiveTab('documents')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'documents' ? 'p-[2px] bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">My Documents</CardTitle>
                                <FileText className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{myDocuments.length}</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Assigned to you</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Announcements */}
                <div
                    onClick={() => setActiveTab('announcements')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'announcements' ? 'p-[2px] bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Announcements</CardTitle>
                                <Bell className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{activeAnnouncements.length}</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Latest updates</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Holidays */}
                <div
                    onClick={() => setActiveTab('holidays')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'holidays' ? 'p-[2px] bg-gradient-to-br from-pink-400 to-pink-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Holidays</CardTitle>
                                <Calendar className="h-4 w-4 text-pink-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{upcomingHolidays.length}</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Upcoming breaks</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Birthdays */}
                <div
                    onClick={() => setActiveTab('birthdays')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'birthdays' ? 'p-[2px] bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Birthdays</CardTitle>
                                <Cake className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{upcomingBirthdaysCount}</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Celebrate team</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Events */}
                <div
                    onClick={() => setActiveTab('events')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'events' ? 'p-[2px] bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Events</CardTitle>
                                <Clock className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{upcomingEventsCount}</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Live sessions</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Polls & Surveys */}
                <div
                    onClick={() => setActiveTab('polls')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'polls' ? 'p-[2px] bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Polls & Surveys</CardTitle>
                                <BarChart className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{polls.length}</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Your voice</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Feedback Box */}
                <div
                    onClick={() => setActiveTab('feedback')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'feedback' ? 'p-[2px] bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Feedback Box</CardTitle>
                                <MessageSquare className="h-4 w-4 text-rose-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">Share</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Open channel</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Resources */}
                <div
                    onClick={() => setActiveTab('resources')}
                    className={`cursor-pointer transition-all duration-300 rounded-[15px] hover:scale-105 hover:-translate-y-1 ${activeTab === 'resources' ? 'p-[2px] bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg animate-gradient-xy' : 'p-[2px] bg-transparent'}`}
                >
                    <div className="p-[1px] rounded-[13px] bg-white dark:bg-white/10 h-full">
                        <Card className="h-full border-0 bg-white dark:bg-[#0c0d12] hover:bg-slate-50 dark:hover:bg-[#111218] transition-colors rounded-[12px] overflow-hidden shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                                <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Resources</CardTitle>
                                <BookOpen className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{resources.length}</div>
                                <p className="text-[10px] text-slate-500 font-medium font-mono lowercase">Documents</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>


            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">


                <TabsContent value="documents" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <EmployeeDocumentExplorer
                        documents={myDocuments}
                        onView={handleView}
                        onDownload={handleView}
                        onDelete={() => { }}
                    />
                </TabsContent>

                <TabsContent value="holidays" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingHolidays.map((holiday) => (
                            <Card key={holiday.id} className="overflow-hidden border-none shadow-lg group hover:scale-[1.02] transition-transform duration-300">
                                <div className="h-2 w-full bg-gradient-to-r from-pink-500 to-rose-500" />
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 border-0">
                                            Official Holiday
                                        </Badge>
                                        <Calendar className="h-5 w-5 text-pink-500/50" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">{holiday.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="flex items-center text-muted-foreground gap-2 font-medium">
                                        <Calendar className="h-4 w-4 text-pink-500" />

                                        {formatDate(holiday.date)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {upcomingHolidays.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-muted/10 rounded-3xl border-2 border-dashed">
                                <p className="text-muted-foreground">No upcoming holidays scheduled</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="announcements" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeAnnouncements.map((ann) => (
                            <Card key={ann.id} className="overflow-hidden border-none shadow-lg group hover:scale-[1.02] transition-transform duration-300 flex flex-col">
                                <div className={`h-2 w-full bg-gradient-to-r ${ann.priority === 'high' ? 'from-red-500 to-orange-500' : 'from-purple-500 to-indigo-500'}`} />
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className={`${ann.priority === 'high' ? 'bg-red-500/10 text-red-600' : 'bg-purple-500/10 text-purple-600'} border-0 uppercase tracking-wider text-[10px]`}>
                                            {ann.priority} Priority
                                        </Badge>
                                        <Bell className={`h-5 w-5 ${ann.priority === 'high' ? 'text-red-500/50' : 'text-purple-500/50'}`} />
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-2 leading-tight">{ann.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-between">
                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{ann.message}</p>
                                    <div className="flex items-center text-muted-foreground gap-2 font-medium">
                                        <Calendar className={`h-4 w-4 ${ann.priority === 'high' ? 'text-red-500' : 'text-purple-500'}`} />
                                        {new Date(ann.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {activeAnnouncements.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <h3 className="text-xl font-bold text-muted-foreground">All caught up!</h3>
                                <p className="text-muted-foreground">No new announcements at this time.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="birthdays" className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* My Wishes Section */}
                    {myReceivedWishes.length > 0 && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <GiftIcon className="h-5 w-5" />
                                People who wished you
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {myReceivedWishes.map(wish => (
                                    <Badge key={wish.id} variant="secondary" className="bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 px-3 py-1 text-sm border-indigo-200 dark:border-indigo-800">
                                        {wish.senderName}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {birthdayUsers.map((user) => (
                            <Card key={user.id} className="overflow-hidden border-none shadow-lg group hover:scale-[1.02] transition-transform duration-300">
                                <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-blue-500" />
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-0">
                                            {user.department || 'Employee'}
                                        </Badge>
                                        <Cake className="h-5 w-5 text-indigo-500/50" />
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                                            {user.name?.[0]}
                                        </div>
                                        <CardTitle className="text-xl font-bold line-clamp-1">{user.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center text-muted-foreground gap-2 font-medium">
                                            <GiftIcon className="h-4 w-4 text-indigo-500" />
                                            {new Date(user.dateOfBirth!).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                        </div>
                                        {hasWished(user.id) ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 cursor-default">
                                                <span className="mr-1">✓</span> Wished
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-indigo-500 hover:bg-indigo-600 cursor-pointer transition-colors" onClick={() => handleWish(user)}>Wish</Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {birthdayUsers.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-muted/5 rounded-3xl border-2 border-dashed">
                                <Cake className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground font-medium">No birthdays in the next 7 days</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="events" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <EventCalendar />
                </TabsContent>

                <TabsContent value="polls" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PollsSurveys />
                </TabsContent>

                <TabsContent value="feedback" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FeedbackBox />
                </TabsContent>

                <TabsContent value="resources" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CompanyResources />
                </TabsContent>

            </Tabs>



            <PinVerifyDialog
                open={pinVerifyOpen}
                onOpenChange={setPinVerifyOpen}
                onSuccess={handlePinSuccess}
                documentName={pendingDoc?.name}
                action="view"
            />
        </div >
    )
}
