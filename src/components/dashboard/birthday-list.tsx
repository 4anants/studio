'use client';

import { User } from '@/lib/types';
import Image from 'next/image';
import { getAvatarSrc } from '@/lib/utils';
import { Calendar, Cake, PartyPopper, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BirthdayListProps {
    users: User[];
    searchQuery?: string;
}

export function BirthdayList({ users, searchQuery }: BirthdayListProps) {
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    if (!users || users.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Birthdays</CardTitle>
                    <CardDescription>No upcoming birthdays found.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Optimized birthday calculation with useMemo
    const upcomingBirthdays = useMemo(() => {
        return users
            .filter(u => u.dateOfBirth && u.status === 'active')
            .map(u => {
                const dob = new Date(u.dateOfBirth!);
                const currentYear = today.getFullYear();
                let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate());

                // If birthday passed this year, use next year
                const todayNormalized = new Date(today);
                todayNormalized.setHours(0, 0, 0, 0);

                if (nextBday < todayNormalized) {
                    nextBday.setFullYear(currentYear + 1);
                }

                const diffTime = nextBday.getTime() - todayNormalized.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Calculate age they'll turn
                const turningAge = nextBday.getFullYear() - dob.getFullYear();

                return {
                    ...u,
                    nextBirthday: nextBday,
                    daysUntil: diffDays,
                    isToday: diffDays === 0,
                    turningAge,
                    birthMonth: dob.getMonth()
                };
            })
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .filter(u => u.daysUntil <= 365) // Show next 365 days (full year)
            .filter(u => {
                // Month filter
                if (selectedMonth !== 'all' && u.birthMonth !== selectedMonth) return false;

                // Search filter
                if (!searchQuery || searchQuery.trim() === '') return true;
                const query = searchQuery.toLowerCase();
                return (
                    u.name?.toLowerCase().includes(query) ||
                    u.department?.toLowerCase().includes(query) ||
                    u.designation?.toLowerCase().includes(query)
                );
            });
    }, [users, searchQuery, selectedMonth, today]);

    const thisWeek = upcomingBirthdays.filter(u => u.daysUntil <= 7);
    const thisMonth = upcomingBirthdays.filter(u => u.daysUntil > 7 && u.daysUntil <= 30);
    const later = upcomingBirthdays.filter(u => u.daysUntil > 30);

    const BirthdayCard = ({ user }: { user: typeof upcomingBirthdays[0] }) => (
        <div
            className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01]",
                user.isToday
                    ? "bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 border-pink-200 shadow-md"
                    : "bg-card border-border hover:bg-accent/50"
            )}
        >
            <div className="relative shrink-0">
                <div className="rounded-full p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                    <Image
                        src={getAvatarSrc(user)}
                        alt={user.name}
                        width={56}
                        height={56}
                        className="rounded-full object-cover border-2 border-white aspect-square h-14 w-14"
                    />
                </div>
                {user.isToday && (
                    <span className="absolute -top-2 -right-2 text-xl animate-pulse">👑</span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className={cn("font-bold text-lg truncate pr-2", user.isToday ? "text-pink-700 dark:text-pink-300" : "text-foreground")}>
                        {user.name}
                    </h4>
                    {user.isToday && <PartyPopper className="h-5 w-5 text-pink-500 animate-bounce" />}
                </div>

                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={user.isToday ? "default" : "secondary"} className={cn(user.isToday ? "bg-pink-500 hover:bg-pink-600" : "")}>
                        {user.isToday ? "🎉 Today!" : (
                            user.daysUntil === 1 ? "Tomorrow" : `In ${user.daysUntil} days`
                        )}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {user.nextBirthday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.designation || 'Employee'} • {user.department || 'General'}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Month Filter */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Cake className="h-5 w-5 text-pink-500" />
                                Upcoming Birthdays
                            </CardTitle>
                            <CardDescription>
                                {upcomingBirthdays.length} {upcomingBirthdays.length === 1 ? 'birthday' : 'birthdays'} in the next year
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={selectedMonth === 'all' ? 'default' : 'outline'}
                                    onClick={() => setSelectedMonth('all')}
                                    className={cn(
                                        "rounded-full transition-all",
                                        selectedMonth === 'all'
                                            ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0"
                                            : "hover:bg-accent"
                                    )}
                                >
                                    All Months
                                </Button>
                                {monthNames.map((month, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={selectedMonth === index ? 'default' : 'outline'}
                                        onClick={() => setSelectedMonth(index)}
                                        className={cn(
                                            "rounded-full transition-all",
                                            selectedMonth === index
                                                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0"
                                                : "hover:bg-accent"
                                        )}
                                    >
                                        {month.slice(0, 3)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card className="border-pink-100 dark:border-pink-900 overflow-hidden">
                <CardHeader className="bg-pink-50/50 dark:bg-pink-950/20 pb-4">
                    <div className="flex items-center gap-2">
                        <PartyPopper className="h-6 w-6 text-pink-500" />
                        <CardTitle>This Week's Celebrations</CardTitle>
                    </div>
                    <CardDescription>Don't miss the chance to wish your colleagues!</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 p-6 pt-4">
                    {thisWeek.length > 0 ? (
                        thisWeek.map(user => <BirthdayCard key={user.id} user={user} />)
                    ) : (
                        <div className="text-center py-8 text-muted-foreground italic">
                            No birthdays coming up this week.
                        </div>
                    )}
                </CardContent>
            </Card>

            {thisMonth.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Later This Month
                        </CardTitle>
                        <CardDescription>Birthdays in the next 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        {thisMonth.map(user => <BirthdayCard key={user.id} user={user} />)}
                    </CardContent>
                </Card>
            )}

            {later.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Cake className="h-5 w-5 text-purple-500" />
                            Later This Year
                        </CardTitle>
                        <CardDescription>Upcoming birthdays beyond this month</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        {later.map(user => <BirthdayCard key={user.id} user={user} />)}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
