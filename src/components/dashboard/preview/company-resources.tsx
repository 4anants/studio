'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Link as LinkIcon, Download, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { previewStore, INITIAL_RESOURCES } from './preview-store';

export function CompanyResourcesPreview() {
    const [resources, setResources] = useState(() => previewStore.get('resources', INITIAL_RESOURCES));

    useEffect(() => {
        const handleUpdate = (e: any) => {
            if (e.detail?.key === 'resources') {
                setResources(previewStore.get('resources', INITIAL_RESOURCES));
            }
        };
        window.addEventListener('preview_data_updated', handleUpdate);
        return () => window.removeEventListener('preview_data_updated', handleUpdate);
    }, []);

    // Group resources by category
    const grouped = resources.reduce((acc: any, item: any) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-blue-600">
                    <FileText className="h-5 w-5" />
                    Company Resources
                </CardTitle>
                <CardDescription>Essential documents and important links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.keys(grouped).length === 0 && (
                    <div className="py-6 text-center text-muted-foreground text-xs italic">
                        No resources available.
                    </div>
                )}
                {Object.entries(grouped).map(([category, items]: [string, any], idx) => (
                    <div key={idx} className="space-y-3">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 px-1">
                            {category}
                        </h4>
                        <div className="grid gap-2">
                            {items.map((item: any, i: number) => {
                                const Icon = item.type === 'PDF' ? FileText : LinkIcon;
                                const color = item.type === 'PDF' ? 'text-red-500' : 'text-blue-500';

                                return (
                                    <div key={i} className="group flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-muted group-hover:bg-background transition-colors ${color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    {item.type === "PDF" ? `Format: ${item.type} • Size: ${item.size || 'N/A'}` : "Web Application Link"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.type === "PDF" ? (
                                                <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            ) : (
                                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
