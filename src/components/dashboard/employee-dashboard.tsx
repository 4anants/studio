'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Bell, Calendar } from 'lucide-react'
import useSWR from 'swr'
import type { Document, Announcement, Holiday, User } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EmployeeDashboard() {
    const router = useRouter();
    const { data: session } = useSession();
    const { data: documents = [] } = useSWR<Document[]>('/api/documents', fetcher)
    const { data: announcements = [] } = useSWR<Announcement[]>('/api/announcements', fetcher)
    const { data: holidays = [] } = useSWR<Holiday[]>('/api/holidays', fetcher)
    const { data: users = [] } = useSWR<User[]>('/api/users', fetcher)

    const currentUserId = session?.user?.id;
    const currentUser = users.find(u => u.id === currentUserId)

    // Filter user's documents - use employee_id from database
    const myDocuments = useMemo(() => {
        if (!currentUserId) return [];
        return documents.filter(doc =>
            doc.employee_id === currentUserId ||
            doc.ownerId === currentUserId
        );
    }, [documents, currentUserId])

    // Filter active announcements
    const activeAnnouncements = useMemo(() =>
        announcements
            .filter(a => a.status === 'published')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5),
        [announcements]
    )

    // Filter upcoming holidays
    const upcomingHolidays = useMemo(() => {
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

    const handleNavigate = (path: string) => {
        console.log('Navigating to:', path);
        router.push(path);
    };

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
                <Card
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-l-4 border-l-blue-600"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNavigate('/dashboard?view=panel&tab=documents');
                    }}
                >
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

                {/* Announcements */}
                <Card
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-l-4 border-l-green-600"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNavigate('/dashboard?view=panel&tab=announcements');
                    }}
                >
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


                {/* Upcoming Holidays */}
                <Card
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-l-4 border-l-purple-600"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNavigate('/dashboard?view=panel&tab=holidays');
                    }}
                >
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
                                        <div className="text-sm text-muted-foreground ml-4">
                                            {doc.uploadDate}
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
                    <CardContent>
                        {activeAnnouncements.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No announcements
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeAnnouncements.map(announcement => (
                                    <div key={announcement.id} className="p-3 rounded-lg border bg-card">
                                        <h4 className="font-medium">{announcement.title}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {announcement.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {new Date(announcement.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
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
                <CardContent>
                    {upcomingHolidays.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No upcoming holidays
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingHolidays.map(holiday => (
                                <div key={holiday.id} className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                                    <h4 className="font-medium mb-1">{holiday.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(holiday.date)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
