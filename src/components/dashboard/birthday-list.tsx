'use client';

import { User } from '@/lib/types';
import Image from 'next/image';
import { getAvatarSrc } from '@/lib/utils';
import { Calendar, Cake, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BirthdayListProps {
    users: User[];
}

export function BirthdayList({ users }: BirthdayListProps) {
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

    // Sort and filter users by upcoming birthday
    const upcomingBirthdays = users
        .filter(u => u.dateOfBirth && u.status === 'active')
        .map(u => {
            const dob = new Date(u.dateOfBirth!);
            const currentYear = today.getFullYear();
            let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate());

            // If birthday passed this year, it's next year
            if (nextBday < new Date(today.setHours(0, 0, 0, 0))) {
                nextBday.setFullYear(currentYear + 1);
            }

            const diffTime = nextBday.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                ...u,
                nextBirthday: nextBday,
                daysUntil: diffDays,
                isToday: diffDays === 0
            };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil)
        // Filter to show commonly relevant ones (e.g. next 30-60 days) or just all sorted
        // User asked for "upcoming weekly", so let's highlight this week but show more context (e.g. month)
        // Let's show next 30 days to fill the tab
        .filter(u => u.daysUntil <= 30);

    const thisWeek = upcomingBirthdays.filter(u => u.daysUntil <= 7);
    const later = upcomingBirthdays.filter(u => u.daysUntil > 7);

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
                <div className={cn("rounded-full p-1", user.isToday && "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500")}>
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
                        {user.isToday ? "Today!" : (
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
            <Card className="border-pink-100 dark:border-pink-900 overflow-hidden">
                <CardHeader className="bg-pink-50/50 dark:bg-pink-950/20 pb-4">
                    <div className="flex items-center gap-2">
                        <Cake className="h-6 w-6 text-pink-500" />
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

            {later.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Coming Up Later this Month</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        {later.map(user => <BirthdayCard key={user.id} user={user} />)}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
