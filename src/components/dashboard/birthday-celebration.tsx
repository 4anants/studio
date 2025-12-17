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
import { PartyPopper } from 'lucide-react';

// Simple confetti CSS
// You can replace this with 'canvas-confetti' library for better effects
const confettiStyles = `
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  background-color: #ffd700;
  animation: confetti-fall 4s linear infinite;
  z-index: 60;
}
`;

function ConfettiEffect() {
    const [pieces, setPieces] = useState<any[]>([]);

    useEffect(() => {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const p = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            animationDelay: Math.random() * 2 + 's',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        }));
        setPieces(p);
    }, []);

    return (
        <>
            <style>{confettiStyles}</style>
            {pieces.map((p) => (
                <div
                    key={p.id}
                    className="confetti"
                    style={{
                        left: p.left,
                        animationDelay: p.animationDelay,
                        backgroundColor: p.backgroundColor,
                    }}
                />
            ))}
        </>
    );
}

interface BirthdayCelebrationProps {
    user: User;
}

export function BirthdayCelebration({ user }: BirthdayCelebrationProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user || !user.dateOfBirth) return;

        const checkBirthday = () => {
            const today = new Date();
            const birthDate = new Date(user.dateOfBirth!);

            // Check if month and day match
            if (
                today.getMonth() === birthDate.getMonth() &&
                today.getDate() === birthDate.getDate()
            ) {
                // Check if we already showed it this year
                const storageKey = `birthday_shown_${user.id}_${today.getFullYear()}`;
                const hasShown = localStorage.getItem(storageKey);

                if (!hasShown) {
                    setIsOpen(true);
                    localStorage.setItem(storageKey, 'true');
                }
            }
        };

        checkBirthday();
    }, [user]);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {isOpen && <ConfettiEffect />}
            <DialogContent className="sm:max-w-md text-center border-4 border-yellow-400">
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-yellow-100 p-4">
                            <PartyPopper className="h-10 w-10 text-yellow-600 animate-bounce" />
                        </div>
                    </div>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text">
                        Happy Birthday, {user.name.split(' ')[0]}!
                    </DialogTitle>
                    <DialogDescription className="text-lg pt-2">
                        Wishing you a fantastic day filled with joy and laughter!
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center py-6 relative">
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 blur opacity-75 animate-pulse"></div>
                        <Image
                            src={getAvatarSrc(user)}
                            alt="Birthday User"
                            width={150}
                            height={150}
                            className="rounded-full border-4 border-white relative z-10 object-cover"
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        className="w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0 font-bold"
                        onClick={handleClose}
                    >
                        Thank You! 🎉
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
