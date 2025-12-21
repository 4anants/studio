'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Sparkles, ThumbsUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useSWR from 'swr';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function FeedbackBox() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const { data: feedbackList, mutate } = useSWR('/api/engagement/feedback', fetcher);



    const handleSubmit = async () => {
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/engagement/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, category: 'General', is_public: isPublic, is_anonymous: isAnonymous }),
            });

            if (!res.ok) throw new Error();

            setMessage('');
            setIsPublic(false);
            setIsAnonymous(false);
            mutate();
            toast({
                title: "Feedback Sent!",
                description: isPublic ? "Your suggestion has been posted to the community board." : "Thank you for helping us improve.",
            });
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to send feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (feedbackId: string) => {
        try {
            const res = await fetch('/api/engagement/feedback/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackId }),
            });
            if (!res.ok) throw new Error();
            mutate();
        } catch (e) {
            toast({ title: "Error voting", variant: "destructive" });
        }
    };

    const publicFeedback = Array.isArray(feedbackList) ? feedbackList.filter((f: any) => f.is_public) : [];

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Feedback Submission Form */}
            <div className="w-full lg:w-[420px] flex-shrink-0">
                <div className="relative group">
                    {/* Animated gradient border */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                    <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm flex flex-col">
                        {/* Top accent gradient */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600"></div>

                        <CardHeader className="pb-4 px-7 pt-7 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full"></div>
                                        <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 p-2.5 rounded-xl shadow-lg">
                                            <MessageSquare className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                            Share Feedback
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-0.5">
                                            Your voice matters
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "uppercase tracking-wider text-[10px] font-semibold px-3 py-1 rounded-full transition-all duration-300",
                                        isPublic
                                            ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                                            : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                                    )}
                                >
                                    {isPublic ? '🌐 Public' : '🔒 Private'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="px-7 pb-7 space-y-5 flex flex-col">
                            {/* Message Input */}
                            <div className="relative min-h-[200px]">
                                <Textarea
                                    placeholder="Share your thoughts, ideas, or suggestions..."
                                    className="min-h-[200px] resize-none bg-muted/40 border-2 border-muted focus-visible:border-rose-500/50 focus-visible:ring-4 focus-visible:ring-rose-500/10 rounded-2xl p-5 text-sm leading-relaxed placeholder:text-muted-foreground/50 transition-all duration-300"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                {message.length > 0 && (
                                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium">{message.length} chars</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    </div>
                                )}
                            </div>


                            {/* Toggle Buttons Row */}
                            <div className="flex gap-3">
                                {/* Public Toggle Button */}
                                <Button
                                    type="button"
                                    variant={isPublic ? "default" : "outline"}
                                    onClick={() => setIsPublic(!isPublic)}
                                    className={`flex-1 h-11 transition-all duration-300 ${isPublic
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
                                            : 'hover:border-emerald-500/50 hover:bg-emerald-500/10'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {isPublic && <Sparkles className="h-4 w-4" />}
                                        Community
                                    </span>
                                </Button>

                                {/* Anonymous Toggle Button */}
                                <Button
                                    type="button"
                                    variant={isAnonymous ? "default" : "outline"}
                                    onClick={() => setIsAnonymous(!isAnonymous)}
                                    className={`flex-1 h-11 transition-all duration-300 ${isAnonymous
                                            ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500'
                                            : 'hover:border-purple-500/50 hover:bg-purple-500/10'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {isAnonymous && <span>🔒</span>}
                                        Anonymous
                                    </span>
                                </Button>
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="w-full h-12 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                onClick={handleSubmit}
                                disabled={!message.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Submit Feedback</span>
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>



            {/* Community Suggestions Preview */}
            {publicFeedback.length > 0 && (
                <div className="flex-1 w-full">
                    <div className="relative group h-full flex flex-col">
                        {/* Animated gradient border */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                        <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm h-full flex flex-col">
                            {/* Top accent gradient */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>

                            <CardHeader className="pb-4 px-7 pt-7">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                                            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg">
                                                <MessageSquare className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                                Community Ideas
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                {publicFeedback.length} suggestion{publicFeedback.length !== 1 ? 's' : ''} from your team
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 uppercase tracking-wider text-[10px] font-semibold px-3 py-1 rounded-full">
                                        Live Feed
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="px-7 pb-7 max-h-[600px] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {publicFeedback.map((item: any, index: number) => (
                                        <div
                                            key={item.id}
                                            className="group/item relative"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            {/* Animated gradient outline */}
                                            <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-xl opacity-40 group-hover/item:opacity-70 blur-sm animate-gradient-xy transition-opacity duration-500"></div>

                                            <div className="relative bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm p-5 rounded-xl border-2 border-purple-500/20 group-hover/item:border-pink-500/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4 h-full">
                                                {/* Message Content */}
                                                <div className="flex-1 space-y-3">
                                                    <p className="text-sm font-medium leading-relaxed text-foreground/90">
                                                        {item.message}
                                                    </p>

                                                    {/* Metadata */}
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-full border border-border/50">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                            <span className="font-medium">Anonymous</span>
                                                        </div>
                                                        <span className="opacity-50">•</span>
                                                        <span className="opacity-70">
                                                            {new Date(item.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Vote Section */}
                                                <div className="pt-3 border-t border-border/50">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "w-full h-10 rounded-lg gap-2.5 font-semibold text-sm transition-all duration-300",
                                                            item.has_voted
                                                                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-2 border-emerald-500/30 shadow-sm"
                                                                : "hover:bg-muted text-muted-foreground hover:text-foreground border-2 border-transparent hover:border-muted-foreground/20"
                                                        )}
                                                        onClick={() => handleVote(item.id)}
                                                    >
                                                        <ThumbsUp className={cn(
                                                            "h-4 w-4 transition-all duration-300",
                                                            item.has_voted && "fill-current scale-110"
                                                        )} />
                                                        <span className="flex-1 text-left">
                                                            {item.has_voted ? 'You upvoted this' : 'Upvote'}
                                                        </span>
                                                        <div className={cn(
                                                            "px-2.5 py-0.5 rounded-full text-xs font-bold transition-all duration-300",
                                                            item.has_voted
                                                                ? "bg-emerald-500/20 text-emerald-600"
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {item.vote_count || 0}
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
