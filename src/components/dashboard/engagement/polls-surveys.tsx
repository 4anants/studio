'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, Trash2, Users, Plus, X, Sparkles } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { EngagementPoll, User, Department } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { locations, holidayLocations } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function PollsSurveys() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const { data: currentUser } = useSWR<User>(session?.user ? `/api/users?email=${session.user.email}` : null, fetcher);
    const { departments } = useData();

    // Create Poll State
    const [newPoll, setNewPoll] = useState({
        question: '',
        options: ['', ''],
        target_department: 'ALL' as string,
        target_location: 'ALL' as string,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch polls based on user's location and department
    const queryParams = currentUser
        ? `?location=${currentUser.location || 'ALL'}&department=${currentUser.department || 'ALL'}`
        : '';

    const { data: rawPolls, mutate } = useSWR<EngagementPoll[]>(`/api/engagement/polls${queryParams}`, fetcher);
    const polls = React.useMemo(() => Array.isArray(rawPolls) ? rawPolls : [], [rawPolls]);
    const [votingId, setVotingId] = useState<string | null>(null);

    const handleVote = async (pollId: string, optionId: string) => {
        setVotingId(optionId);
        try {
            const res = await fetch('/api/engagement/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId, optionId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to vote');
            }
            mutate();
            toast({ title: "Vote Registered", description: "Your feedback matters!" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setVotingId(null);
        }
    };

    const deletePoll = async (id: string) => {
        try {
            const res = await fetch(`/api/engagement/polls?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            mutate();
            toast({ title: "Poll Deleted", variant: "destructive" });
        } catch (e) {
            toast({ title: "Error deleting poll", variant: "destructive" });
        }
    };

    const handleCreateOption = () => {
        setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    };

    const handleRemoveOption = (index: number) => {
        if (newPoll.options.length <= 2) return;
        const newOptions = newPoll.options.filter((_, i) => i !== index);
        setNewPoll({ ...newPoll, options: newOptions });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...newPoll.options];
        newOptions[index] = value;
        setNewPoll({ ...newPoll, options: newOptions });
    };

    const handleCreate = async () => {
        if (!newPoll.question || newPoll.options.some(o => !o.trim())) {
            toast({ title: "Validation Error", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/engagement/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: newPoll.question,
                    options: newPoll.options,
                    target_location: newPoll.target_location,
                    target_department: newPoll.target_department
                }),
            });
            if (!res.ok) throw new Error();
            mutate();
            setNewPoll({ question: '', options: ['', ''], target_department: 'ALL', target_location: 'ALL' });
            toast({ title: "Poll Created", description: "Poll is now live." });
        } catch (e) {
            toast({ title: "Error creating poll", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAdmin = session?.user?.role === 'admin';
    const activePolls = polls.filter(p => p.is_active);

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left: Create Form */}
            <div className="w-full lg:w-[420px] flex-shrink-0">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                    <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm flex flex-col">
                        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600"></div>

                        <CardHeader className="pb-4 px-7 pt-7 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                                    <div className="relative bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl shadow-lg">
                                        <BarChart3 className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                        Create Poll
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        Gather team feedback
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-7 pb-7 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question</Label>
                                    <Input
                                        placeholder="e.g. Next team outing?"
                                        value={newPoll.question}
                                        onChange={e => setNewPoll({ ...newPoll, question: e.target.value })}
                                        className="bg-muted/40"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</Label>
                                    {newPoll.options.map((option, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input
                                                value={option}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                placeholder={`Option ${index + 1}`}
                                                className="bg-muted/40"
                                            />
                                            {newPoll.options.length > 2 && (
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)} className="hover:bg-destructive/10 hover:text-destructive">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={handleCreateOption} className="w-full text-xs border-dashed gap-1 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200">
                                        <Plus className="h-3 w-3" /> Add Option
                                    </Button>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Audience</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select value={newPoll.target_department} onValueChange={(v) => setNewPoll({ ...newPoll, target_department: v })}>
                                            <SelectTrigger className="bg-muted/40 text-xs h-9">
                                                <SelectValue placeholder="Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Depts</SelectItem>
                                                {departments?.map((dept: Department) => (
                                                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={newPoll.target_location} onValueChange={(v) => setNewPoll({ ...newPoll, target_location: v })}>
                                            <SelectTrigger className="bg-muted/40 text-xs h-9">
                                                <SelectValue placeholder="Location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {holidayLocations.map(loc => (
                                                    <SelectItem key={loc} value={loc}>{loc === 'ALL' ? 'All Locs' : loc}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                                onClick={handleCreate}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Launching...' : 'Launch Poll'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right: Active Polls */}
            <div className="flex-1 w-full">
                <div className="relative group h-full flex flex-col">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                    <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm h-full flex flex-col">
                        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600"></div>

                        <CardHeader className="pb-4 px-7 pt-7">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                                        <div className="relative bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl shadow-lg">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                            Active Polls
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-0.5">
                                            {activePolls.length} active question{activePolls.length !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 border border-orange-500/30 uppercase tracking-wider text-[10px] font-semibold px-3 py-1 rounded-full">
                                    Live
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="px-7 pb-7">
                            {activePolls.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                    {activePolls.map((poll, index) => (
                                        <div
                                            key={poll.id}
                                            className="group/item relative"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="absolute -inset-[2px] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-xl opacity-40 group-hover/item:opacity-70 blur-sm animate-gradient-xy transition-opacity duration-500"></div>

                                            <div className="relative bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm p-5 rounded-xl border-2 border-orange-500/20 group-hover/item:border-amber-500/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4 h-full">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-lg leading-tight flex-1">{poll.question}</h4>
                                                    {isAdmin && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deletePoll(poll.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="space-y-3 flex-1">
                                                    {poll.options.map((option) => {
                                                        const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                                                        const hasVoted = poll.userVotedOptionId !== null;
                                                        const isUserChoice = poll.userVotedOptionId === option.id;

                                                        return (
                                                            <div key={option.id} className="space-y-1.5">
                                                                <div className="flex justify-between text-[11px] mb-1">
                                                                    <span className="font-semibold flex items-center gap-1">
                                                                        {option.text}
                                                                        {isUserChoice && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                                                    </span>
                                                                    <span className="text-muted-foreground font-mono">{percentage}%</span>
                                                                </div>
                                                                {hasVoted ? (
                                                                    <Progress value={percentage} className={`h-2 ${isUserChoice ? 'bg-orange-100' : 'bg-muted'} [&>div]:bg-orange-500`} />
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full justify-start font-normal text-xs h-8 hover:border-orange-500 hover:bg-orange-50 transition-all border-dashed"
                                                                        disabled={votingId !== null}
                                                                        onClick={() => handleVote(poll.id, option.id)}
                                                                    >
                                                                        {votingId === option.id ? "Voting..." : "Vote"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="pt-3 border-t border-border/50 text-[10px] text-muted-foreground flex items-center justify-between">
                                                    <span className="flex items-center gap-1 italic">
                                                        <Users className="h-3 w-3" /> {poll.totalVotes} responses
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-muted animate-in fade-in zoom-in-50 duration-500">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground font-medium">No active polls found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
