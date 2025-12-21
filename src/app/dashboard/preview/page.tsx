'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, LayoutDashboard } from 'lucide-react';
import { EventCalendarPreview } from '@/components/dashboard/preview/event-calendar';
import { PollsPreview } from '@/components/dashboard/preview/polls-surveys';
import { FeedbackBoxPreview } from '@/components/dashboard/preview/feedback-box';
import { CompanyResourcesPreview } from '@/components/dashboard/preview/company-resources';
import { FeatureManager } from '@/components/dashboard/preview/feature-manager';

export default function FeaturePreviewPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/40 pb-12">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" className="rounded-full shadow-sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-500 fill-purple-200" />
                                Engagement Hub Preview
                            </h1>
                            <p className="text-[10px] text-muted-foreground italic font-semibold uppercase tracking-wider">Experimental Feature Showcase</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container px-4 md:px-8 pt-8">
                {/* Intro Banner */}
                <section className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 backdrop-blur-sm relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tighter">Ready to boost Engagement? 🚀</h2>
                            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                                We've designed these new features to make your team more connected and productive.
                                <span className="text-primary font-bold"> This is a preview area</span> - all data here is currently for demonstration only and won't affect your project files.
                            </p>
                        </div>
                        <Button className="rounded-full px-8 bg-black text-white hover:bg-black/90 shadow-xl transition-all transform hover:scale-105 active:scale-95">
                            Ready to Merge?
                        </Button>
                    </div>
                    {/* Abstract background blobs */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-400/20 blur-[80px] rounded-full" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-pink-400/20 blur-[80px] rounded-full" />
                </section>

                <div className="mb-8">
                    <FeatureManager />
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    {/* Left Column: Calendar & Company Docs */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EventCalendarPreview />
                            <CompanyResourcesPreview />
                        </div>

                        <Card className="bg-white/50 border-dashed border-2 flex flex-col items-center justify-center py-12 text-center overflow-hidden">
                            <CardContent className="flex flex-col items-center">
                                <div className="p-4 rounded-full bg-muted/50 mb-4 animate-bounce">
                                    <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-bold text-muted-foreground">Activity Feed Placeholder</h3>
                                <p className="text-xs text-muted-foreground/60 w-3/4 mx-auto mt-2 italic">
                                    Your team's latest interactions, event check-ins, and survey completions will appear here in a beautiful scrolling timeline.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Polls & Feedback */}
                    <div className="lg:col-span-4 space-y-6">
                        <PollsPreview />
                        <FeedbackBoxPreview />
                    </div>
                </div>
            </main>
        </div>
    );
}
