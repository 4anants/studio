'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { IdCard } from './id-card';
import { User } from '@/lib/types';
import { Crop, RotateCcw, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';

interface PhotoAdjustmentDialogProps {
    user: User;
    company?: any;
    onUpdate?: () => void;
}

export function PhotoAdjustmentDialog({ user, company, onUpdate }: PhotoAdjustmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [scale, setScale] = useState(user.photo_scale || 1);
    const [xOffset, setXOffset] = useState(user.photo_x_offset || 0);
    const [yOffset, setYOffset] = useState(user.photo_y_offset || 0);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const { mutateUsers } = useData();

    // Create a temporary user object with the live adjustments for preview
    const previewUser: User = {
        ...user,
        photo_scale: scale,
        photo_x_offset: xOffset,
        photo_y_offset: yOffset
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photo_x_offset: xOffset,
                    photo_y_offset: yOffset,
                    photo_scale: scale
                })
            });

            if (!res.ok) throw new Error('Failed to update settings');

            toast({ title: "Success", description: "Photo settings saved." });
            setOpen(false);
            if (onUpdate) onUpdate();
            mutateUsers(); // Refresh data to propagate changes

        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not save photo settings." });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setScale(1);
        setXOffset(0);
        setYOffset(0);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Crop className="w-4 h-4 mr-2" />
                    Adjust Photo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Adjust Profile Photo</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="p-4 bg-muted/20 rounded-lg space-y-4 border">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Zoom</Label>
                                    <span className="text-xs text-muted-foreground">{(scale * 100).toFixed(0)}%</span>
                                </div>
                                <Slider
                                    value={[scale]}
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                    onValueChange={([val]) => setScale(val)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Horizontal Position (X)</Label>
                                    <span className="text-xs text-muted-foreground">{xOffset}px</span>
                                </div>
                                <Slider
                                    value={[xOffset]}
                                    min={-100}
                                    max={100}
                                    step={1}
                                    onValueChange={([val]) => setXOffset(val)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Vertical Position (Y)</Label>
                                    <span className="text-xs text-muted-foreground">{yOffset}px</span>
                                </div>
                                <Slider
                                    value={[yOffset]}
                                    min={-100}
                                    max={100}
                                    step={1}
                                    onValueChange={([val]) => setYOffset(val)}
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button size="sm" variant="ghost" onClick={handleReset}>
                                    <RotateCcw className="w-3 h-3 mr-2" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Use these controls to position your face clearly within the ID card frame.
                        </p>
                    </div>

                    {/* Preview */}
                    <div className="flex justify-center bg-gray-50 p-4 rounded-lg border">
                        {/* Pass null for customConfig to use saved defaults or classes, but ensure user settings apply */}
                        {/* @ts-ignore */}
                        <div className="scale-90 origin-top">
                            <IdCard employee={previewUser} company={company} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
