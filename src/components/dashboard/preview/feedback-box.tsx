'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquareText, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export function FeedbackBoxPreview() {
    const [anonymous, setAnonymous] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setSubmitted(true);
            toast({
                title: "Feedback Submitted!",
                description: anonymous ? "Your anonymous suggestion has been sent." : "Thanks for your feedback! We'll look into it.",
            });
        }, 1200);
    };

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-pink-500">
                    <MessageSquareText className="h-5 w-5" />
                    Feedback & Suggestions
                </CardTitle>
                <CardDescription>Tell us what's on your mind. We value your voice!</CardDescription>
            </CardHeader>
            <CardContent>
                {submitted ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-bold text-center">Thank you!</h3>
                        <p className="text-sm text-muted-foreground text-center px-4">
                            Your contribution helps us build a better workspace. You can submit more feedback anytime.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setSubmitted(false)} className="rounded-full">
                            Send another
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Category</Label>
                            <Input placeholder="e.g., Office Environment, Management, IT Support" className="bg-muted/30 border-none focus-visible:ring-primary" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Your Suggestion</Label>
                            <Textarea
                                placeholder="Describe your idea or feedback in detail..."
                                className="min-h-[100px] bg-muted/30 border-none resize-none focus-visible:ring-primary"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">Post Anonymously</Label>
                                <p className="text-[10px] text-muted-foreground italic">Your identity will be completely hidden</p>
                            </div>
                            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
                        </div>
                        <Button
                            className="w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:scale-[1.02] transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending..." : (
                                <span className="flex items-center gap-2">
                                    Submit Feedback <Send className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
