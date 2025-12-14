'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Bell, Calendar, LayoutDashboard, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'
import type { Document, Announcement, Holiday } from '@/lib/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function AdminDashboard() {
    const { data: documents = [] } = useSWR<Document[]>('/api/documents', fetcher)
    const { data: announcements = [] } = useSWR<Announcement[]>('/api/announcements', fetcher)
    const { data: holidays = [] } = useSWR<Holiday[]>('/api/holidays', fetcher)

    const activeAnnouncements = announcements
        .filter((a: Announcement) => {
            // Auto-hide passed events
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (a.eventDate) {
                return new Date(a.eventDate) >= today;
            }
            return true;
        })
        .sort((a, b) => {
            const dateA = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
            const dateB = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
            return dateA - dateB;
        })
        .slice(0, 5)

    const upcomingHolidays = holidays
        .filter((h: Holiday) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Append T00:00:00 to ensure local midnight interpretation
            const hDate = new Date(`${h.date}T00:00:00`);
            return hDate >= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)

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
            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b pb-4">
                <Button variant="default" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </Button>
                <Button variant="outline" asChild className="flex items-center gap-2">
                    <Link href="/dashboard?role=admin&view=panel">
                        <Shield className="h-4 w-4" />
                        Admin Panel
                    </Link>
                </Button>
            </div>

            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, Super Admin!
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here's what's happening today
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* My Documents */}
                <Link href="/dashboard?role=admin&view=panel&tab=file-explorer">
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
                            <FileText className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{documents.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Total documents in system
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Announcements */}
                <Link href="/dashboard?role=admin&view=panel&tab=announcements">
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-l-4 border-l-green-600">
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
                <Link href="/dashboard?role=admin&view=panel&tab=holidays">
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-l-4 border-l-purple-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{upcomingHolidays.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Holidays remaining
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Content Sections */}
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
                        {documents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No documents found
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {documents.slice(0, 5).map(doc => (
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
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-medium">{announcement.title}</h4>
                                            {announcement.priority && (
                                                <Badge variant="secondary" className={cn(
                                                    announcement.priority === 'high' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                                                    announcement.priority === 'medium' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                                                    announcement.priority === 'low' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                )}>
                                                    {announcement.priority}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {announcement.message}
                                        </p>
                                        {announcement.eventDate && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Event: {new Date(announcement.eventDate).toLocaleDateString()}
                                            </p>
                                        )}
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
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Christmas celebration
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
