'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Bell, Calendar, Eye } from 'lucide-react'
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

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EmployeeDashboard() {
    // ...

    const { data: session } = useSession();
    const { data: documents = [] } = useSWR<Document[]>('/api/documents', fetcher)
    const { data: announcements = [] } = useSWR<Announcement[]>('/api/announcements', fetcher)
    const { data: holidays = [] } = useSWR<Holiday[]>('/api/holidays', fetcher)
    const { data: users = [] } = useSWR<User[]>('/api/users', fetcher)

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

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {currentUser?.name || 'User'}!
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here's what's happening today
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* My Documents */}
                <Link href="/dashboard?role=employee&view=panel&tab=documents" className="block h-full relative z-10">
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
                            <FileText className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{myDocuments.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Total documents assigned to you
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Announcements */}
                <Link href="/dashboard?role=employee&view=panel&tab=announcements" className="block h-full relative z-10">
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full border-l-4 border-l-green-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                            <Bell className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeAnnouncements.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Active announcements
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Upcoming Holidays */}
                <Link href="/dashboard?role=employee&view=panel&tab=holidays" className="block h-full relative z-10">
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full border-l-4 border-l-purple-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{upcomingHolidays.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Holidays this year
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* My Documents Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <CardTitle>My Documents</CardTitle>
                        </div>
                        <CardDescription>Recent documents assigned to you</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {myDocuments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No documents found
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myDocuments.slice(0, 5).map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{doc.name}</p>
                                            <p className="text-sm text-muted-foreground">{doc.type}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm text-muted-foreground">
                                                {doc.uploadDate}
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleView(doc)} title="View Document">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Announcements Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>Announcements</CardTitle>
                        </div>
                        <CardDescription>Latest announcements for you</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {activeAnnouncements.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No announcements
                            </div>
                        ) : (
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                plugins={[
                                    Autoplay({
                                        delay: 5000,
                                    }),
                                ]}
                                className="w-full"
                            >
                                <CarouselContent>
                                    {activeAnnouncements.map((announcement) => (
                                        <CarouselItem key={announcement.id}>
                                            <div className="p-1 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-xy h-full">
                                                <div className="bg-card rounded-md p-4 h-full relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    <h4 className="font-bold text-lg mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                                        {announcement.title}
                                                    </h4>
                                                    <p className="text-sm text-foreground/80 line-clamp-3 mb-4 relative z-10">
                                                        {announcement.message}
                                                    </p>
                                                    <div className="flex items-center text-xs font-medium text-muted-foreground relative z-10">
                                                        <Calendar className="mr-2 h-3 w-3 text-primary" />
                                                        {new Date(announcement.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <div className="absolute -top-12 right-12 flex gap-1">
                                    <CarouselPrevious className="relative h-8 w-8 translate-y-0" />
                                    <CarouselNext className="relative h-8 w-8 translate-y-0" />
                                </div>
                            </Carousel>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Holidays Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <CardTitle>Upcoming Holidays</CardTitle>
                    </div>
                    <CardDescription>Company holidays and observances</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {upcomingHolidays.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No upcoming holidays
                        </div>
                    ) : (
                        <Carousel
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            plugins={[
                                Autoplay({
                                    delay: 4000,
                                }),
                            ]}
                            className="w-full"
                        >
                            <CarouselContent>
                                {upcomingHolidays.map((holiday, index) => {
                                    const gradients = [
                                        "from-green-400 to-emerald-600",
                                        "from-orange-400 to-red-600",
                                        "from-blue-400 to-indigo-600",
                                        "from-pink-400 to-rose-600"
                                    ];
                                    const gradient = gradients[index % gradients.length];

                                    return (
                                        <CarouselItem key={holiday.id} className="md:basis-1/2 lg:basis-1/3">
                                            <div className={`p-1 rounded-lg bg-gradient-to-br ${gradient} animate-float h-full`}>
                                                <div className="bg-card/90 backdrop-blur-sm rounded-md p-4 h-full flex flex-col justify-between hover:bg-card/50 transition-colors">
                                                    <div>
                                                        <h4 className={`font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
                                                            {holiday.name}
                                                        </h4>
                                                        <div className="flex items-center text-sm font-medium">
                                                            <Calendar className="mr-2 h-3 w-3" />
                                                            {formatDate(holiday.date)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    )
                                })}
                            </CarouselContent>
                            <div className="absolute -top-12 right-12 flex gap-1">
                                <CarouselPrevious className="relative h-8 w-8 translate-y-0" />
                                <CarouselNext className="relative h-8 w-8 translate-y-0" />
                            </div>
                        </Carousel>
                    )}
                </CardContent>
            </Card>
            <PinVerifyDialog
                open={pinVerifyOpen}
                onOpenChange={setPinVerifyOpen}
                onSuccess={handlePinSuccess}
                documentName={pendingDoc?.name}
                action="view"
            />
        </div>
    )
}
