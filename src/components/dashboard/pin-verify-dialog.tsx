'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle, Clock } from 'lucide-react';

interface PinVerifyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    documentName?: string;
    action?: 'view' | 'download';
}

export function PinVerifyDialog({
    open,
    onOpenChange,
    onSuccess,
    documentName,
    action = 'view'
}: PinVerifyDialogProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimeLeft, setLockTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!open) {
            setPin('');
            setError('');
            setAttemptsLeft(null);
            setIsLocked(false);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            checkLockStatus();
        }
    }, [open]);

    const checkLockStatus = async () => {
        try {
            const response = await fetch('/api/document-pin');
            const data = await response.json();

            if (data.isLocked) {
                setIsLocked(true);
                updateLockTimer(data.lockedUntil);
            }
        } catch (error) {
            console.error('Error checking lock status:', error);
        }
    };

    const updateLockTimer = (lockedUntil: string) => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const lockEnd = new Date(lockedUntil).getTime();
            const diff = lockEnd - now;

            if (diff <= 0) {
                setIsLocked(false);
                setLockTimeLeft('');
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setLockTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);

            setTimeout(updateTimer, 1000);
        };

        updateTimer();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!/^\d{4}$/.test(pin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/document-pin', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.locked) {
                    setIsLocked(true);
                    if (data.lockedUntil) {
                        updateLockTimer(data.lockedUntil);
                    }
                }

                if (data.attemptsLeft !== undefined) {
                    setAttemptsLeft(data.attemptsLeft);
                }

                setError(data.error || 'Incorrect PIN');
                setPin('');
                return;
            }

            // PIN verified successfully
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        <DialogTitle>Enter Document PIN</DialogTitle>
                    </div>
                    <DialogDescription>
                        {documentName
                            ? `Enter your 4-digit PIN to ${action} "${documentName}"`
                            : `Enter your 4-digit PIN to ${action} this document`}
                    </DialogDescription>
                </DialogHeader>

                {isLocked ? (
                    <div className="py-6">
                        <Alert>
                            <Clock className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-semibold">Account Temporarily Locked</p>
                                    <p>Too many failed PIN attempts. Please try again in:</p>
                                    <p className="text-2xl font-mono font-bold text-center py-2">
                                        {lockTimeLeft}
                                    </p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pin">PIN</Label>
                            <Input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                                className="text-center text-3xl tracking-widest"
                                autoFocus
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Enter your 4-digit document PIN
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-1">
                                        <p>{error}</p>
                                        {attemptsLeft !== null && attemptsLeft > 0 && (
                                            <p className="text-sm">
                                                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                                            </p>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="w-full sm:w-auto rounded-full px-8 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || pin.length !== 4}
                                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0"
                            >
                                {loading ? 'Verifying...' : 'Verify PIN'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {!isLocked && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                        Forgot your PIN? Contact your administrator to reset it.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
