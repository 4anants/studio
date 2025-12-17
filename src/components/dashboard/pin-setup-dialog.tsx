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
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PinSetupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    isChanging?: boolean; // true if changing existing PIN
}

export function PinSetupDialog({ open, onOpenChange, onSuccess, isChanging = false }: PinSetupDialogProps) {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setError('');
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!/^\d{4}$/.test(newPin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        if (newPin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        if (isChanging && !currentPin) {
            setError('Please enter your current PIN');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/document-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: newPin,
                    currentPin: isChanging ? currentPin : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to set PIN');
                return;
            }

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
                        <DialogTitle>
                            {isChanging ? 'Change Document PIN' : 'Set Document PIN'}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {isChanging
                            ? 'Enter your current PIN and choose a new 4-digit PIN to secure your documents.'
                            : 'Set a 4-digit PIN to secure access to your documents. You\'ll need this PIN to view or download documents.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isChanging && (
                        <div className="space-y-2">
                            <Label htmlFor="current-pin">Current PIN</Label>
                            <Input
                                id="current-pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={currentPin}
                                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                                className="text-center text-2xl tracking-widest"
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="new-pin">
                            {isChanging ? 'New PIN' : 'PIN'}
                        </Label>
                        <Input
                            id="new-pin"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="text-center text-2xl tracking-widest"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter a 4-digit number
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-pin">Confirm PIN</Label>
                        <Input
                            id="confirm-pin"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="text-center text-2xl tracking-widest"
                            required
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-full px-8 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                            {loading ? 'Setting PIN...' : (isChanging ? 'Change PIN' : 'Set PIN')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
