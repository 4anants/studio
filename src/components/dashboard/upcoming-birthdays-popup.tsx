'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';
import Image from 'next/image';
import { getAvatarSrc } from '@/lib/utils';
import { PartyPopper, Calendar, Cake } from 'lucide-react';
import { cn } from '@/lib/utils';

// Multi-color confetti effect
const confettiStyles = `
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed;
  width: 10px;
  height: 10px;
  animation: confetti-fall 4s linear infinite;
  z-index: 60;
}
`;

function MultiColorConfetti() {
    const [pieces, setPieces] = useState<any[]>([]);

    useEffect(() => {
        // Vibrant multi-color palette
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'];
        const p = Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            animationDelay: Math.random() * 3 + 's',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360 + 'deg',
        }));
        setPieces(p);
    }, []);

    return (
        <>
            <style>{confettiStyles}</style>
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
                {pieces.map((p) => (
                    <div
                        key={p.id}
                        className="confetti-piece"
                        style={{
                            left: p.left,
                            top: '-20px',
                            animationDelay: p.animationDelay,
                            backgroundColor: p.backgroundColor,
                            transform: `rotate(${p.rotation})`
                        }}
                    />
                ))}
            </div>
        </>
    );
}

interface UpcomingBirthdaysPopupProps {
    users: User[];
    currentUserId: string;
}

export function UpcomingBirthdaysPopup({ users, currentUserId }: UpcomingBirthdaysPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [celebrants, setCelebrants] = useState<any[]>([]);

    useEffect(() => {
        if (!users || users.length === 0) return;

        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth(); // 0-11

        const upcoming = users.filter(u => {
            // Skip undefined DOB, inactive users, and the current user (optional: usually you want to see others)
            if (!u.dateOfBirth || u.status !== 'active' || u.id === currentUserId) return false;

            const dob = new Date(u.dateOfBirth);
            const dobDay = dob.getDate();
            const dobMonth = dob.getMonth();

            // Check for Today
            if (dobDay === currentDay && dobMonth === currentMonth) {
                return true;
            }

            // Check for Upcoming (next 5 days)
            // Simple logic: create a date object for this year's birthday
            const thisYearBday = new Date(today.getFullYear(), dobMonth, dobDay);
            if (thisYearBday < today) {
                // Already passed this year, check next year? No, strictly upcoming.
                // But what if today is Dec 31 and birthday is Jan 1?
                // Basic check:
                thisYearBday.setFullYear(today.getFullYear() + 1);
            }

            // Reset generic years to compare timestamps properly if needed, but simplest is:
            // Compare "day of year" or standard difference. 
            // Let's use time diff for "Next 7 days"

            const bdayThisYear = new Date(today.getFullYear(), dobMonth, dobDay);
            // If bday has passed this year, ignore (unless we handle year wrapping which is complex for simple snippets, sticking to simple forward check)
            // Actually strictly:
            let targetBday = new Date(today.getFullYear(), dobMonth, dobDay);
            if (targetBday < today) {
                // passed already
                return false;
            }

            const diffTime = targetBday.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Include if within next 7 days
            return diffDays <= 7 && diffDays > 0;
        }).map(u => {
            const dob = new Date(u.dateOfBirth!);
            const isToday = dob.getDate() === currentDay && dob.getMonth() === currentMonth;
            return { ...u, isToday };
        });

        if (upcoming.length > 0) {
            setCelebrants(upcoming.sort((a, b) => (a.isToday === b.isToday) ? 0 : a.isToday ? -1 : 1));

            // Check LocalStorage to show only once per day
            const todayStr = today.toDateString();
            const lastSeen = localStorage.getItem('upcoming_birthdays_seen_date');

            if (lastSeen !== todayStr) {
                setIsOpen(true);
            }
        }
    }, [users, currentUserId]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('upcoming_birthdays_seen_date', new Date().toDateString());
    };

    if (celebrants.length === 0) return null;

    const hasToday = celebrants.some(c => c.isToday);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {isOpen && hasToday && <MultiColorConfetti />}
            <DialogContent className="sm:max-w-lg border-t-8 border-t-pink-500 overflow-hidden">
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <Cake className="h-8 w-8 text-pink-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        {hasToday ? "Birthdays & Celebrations! 🎉" : "Upcoming Birthdays 📅"}
                    </DialogTitle>
                    <DialogDescription>
                        Don't forget to send your best wishes!
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {celebrants.map((user) => (
                        <div
                            key={user.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02]",
                                user.isToday
                                    ? "bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 border-pink-200 shadow-md"
                                    : "bg-card border-border hover:bg-accent/50"
                            )}
                        >
                            <div className="relative">
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

                            <div className="flex-1">
                                <h4 className={cn("font-bold text-lg leading-none", user.isToday ? "text-pink-700 dark:text-pink-300" : "text-foreground")}>
                                    {user.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                                        user.isToday
                                            ? "bg-pink-100 text-pink-700"
                                            : "bg-blue-100 text-blue-700"
                                    )}>
                                        {user.isToday ? "🎂 TODAY!" : "🎈 Upcoming"}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {new Date(user.dateOfBirth!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">{user.designation || 'Employee'} • {user.department || 'General'}</p>
                            </div>

                            {user.isToday && (
                                <Button size="icon" variant="ghost" className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-full h-10 w-10 shrink-0">
                                    <PartyPopper className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <DialogFooter className="sm:justify-center pt-2">
                    <Button onClick={handleClose} className="w-full sm:w-auto rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-pink-200 dark:shadow-none">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
