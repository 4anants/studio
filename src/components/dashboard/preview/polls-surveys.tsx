'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, CheckCircle2, Download, Trash2, MapPin, Building2, Eye, EyeOff } from 'lucide-react';
import { previewStore, INITIAL_POLLS } from './preview-store';
import { useToast } from "@/hooks/use-toast";

export function PollsPreview() {
    const { toast } = useToast();
    const [polls, setPolls] = useState(() => previewStore.get('polls', INITIAL_POLLS));
    const [role, setRole] = useState(() => previewStore.getRole());
    const [userMeta, setUserMeta] = useState(() => previewStore.getMeta());
    const [votedId, setVotedId] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState('');

    useEffect(() => {
        const handleUpdate = (e: any) => {
            if (e.detail?.key === 'polls') setPolls(previewStore.get('polls', INITIAL_POLLS));
        };
        const handleRole = (e: any) => setRole(e.detail.role);
        const handleMeta = (e: any) => setUserMeta(e.detail);

        window.addEventListener('preview_data_updated', handleUpdate);
        window.addEventListener('preview_role_updated', handleRole);
        window.addEventListener('preview_meta_updated', handleMeta);

        return () => {
            window.removeEventListener('preview_data_updated', handleUpdate);
            window.removeEventListener('preview_role_updated', handleRole);
            window.removeEventListener('preview_meta_updated', handleMeta);
        };
    }, []);

    const deletePoll = (id: string) => {
        const filtered = polls.filter((p: any) => p.id !== id);
        previewStore.set('polls', filtered);
        toast({ title: "Poll Deleted", variant: "destructive" });
    };

    const exportResults = (poll: any) => {
        const total = poll.options.reduce((acc: number, opt: any) => acc + opt.votes, 0);
        const csv = [
            ["Option", "Votes", "Percentage"],
            ...poll.options.map((opt: any) => [
                opt.text,
                opt.votes,
                total > 0 ? `${Math.round((opt.votes / total) * 100)}%` : "0%"
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poll_results_${poll.id}.csv`;
        a.click();
        toast({ title: "Results Exported", description: "CSV file download started." });
    };

    const handleVote = (pollId: string) => {
        if (!selectedOption) return;
        const updatedPolls = polls.map((p: any) => {
            if (p.id === pollId) {
                return {
                    ...p,
                    options: p.options.map((opt: any) =>
                        opt.id === selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
                    )
                };
            }
            return p;
        });
        previewStore.set('polls', updatedPolls);
        setVotedId(pollId);
        setSelectedOption('');
        toast({ title: "Vote Registered!" });
    };

    // Filter polls based on visibility if not admin
    // If admin, show everything but highlight targeting
    const visiblePolls = role === 'admin'
        ? polls
        : polls.filter((p: any) =>
            (p.targetLocation === 'ALL' || p.targetLocation === userMeta.location) &&
            (p.targetDepartment === 'ALL' || p.targetDepartment === userMeta.department)
        );

    if (visiblePolls.length === 0) return (
        <Card className="opacity-60 bg-muted/20">
            <CardHeader><CardTitle className="text-sm">No Active Polls for your team</CardTitle></CardHeader>
        </Card>
    );

    const activePoll = visiblePolls[0]; // For preview, we show the latest relevant one
    const totalVotes = activePoll.options.reduce((acc: number, opt: any) => acc + opt.votes, 0);
    const isVoted = votedId === activePoll.id;

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
            {role === 'admin' && (
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => exportResults(activePoll)}>
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deletePoll(activePoll.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1 pr-16">
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] text-blue-500 border border-blue-200 bg-blue-50">Active Poll</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {totalVotes} votes
                    </span>
                </div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Polls & Surveys
                </CardTitle>
                <CardDescription className="text-sm font-medium mt-2">{activePoll.question}</CardDescription>

                {role === 'admin' && (
                    <div className="flex gap-4 mt-2 border-t pt-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                            <MapPin className="h-3 w-3" /> {activePoll.targetLocation}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                            <Building2 className="h-3 w-3" /> {activePoll.targetDepartment}
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                {!isVoted ? (
                    <div className="space-y-4">
                        <RadioGroup onValueChange={setSelectedOption} value={selectedOption} className="gap-3">
                            {activePoll.options.map((option: any) => (
                                <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <RadioGroupItem value={option.id} id={option.id} />
                                    <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer w-full">{option.text}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                        <Button
                            className="w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:scale-[1.02] transition-transform duration-200"
                            disabled={!selectedOption}
                            onClick={() => handleVote(activePoll.id)}
                        >
                            Submit Vote
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {activePoll.options.map((option: any) => {
                            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                            return (
                                <div key={option.id} className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="flex items-center gap-2">
                                            {option.text}
                                            {selectedOption === option.id && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                        </span>
                                        <span>{percentage}%</span>
                                    </div>
                                    <Progress value={percentage} className={`h-2 ${selectedOption === option.id ? 'bg-primary/20' : ''}`} />
                                </div>
                            );
                        })}
                        <div className="pt-4 flex justify-between items-center">
                            <p className="text-[10px] text-muted-foreground italic">
                                Thanks for your vote!
                            </p>
                            <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setVotedId(null)}>Change Vote</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
