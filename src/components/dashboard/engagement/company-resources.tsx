'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Eye, Lock, X, FolderOpen } from 'lucide-react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { EngagementResource, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PinVerifyDialog } from '@/components/dashboard/pin-verify-dialog';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function CompanyResources() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const { data: currentUser } = useSWR<User>(session?.user ? `/api/users?email=${session.user.email}` : null, fetcher);

    // Fetch resources based on user's location and department
    const queryParams = currentUser
        ? `?location=${currentUser.location || 'ALL'}&department=${currentUser.department || 'ALL'}`
        : '';

    const { data: rawResources, mutate } = useSWR<EngagementResource[]>(`/api/engagement/resources${queryParams}`, fetcher);
    const resources = React.useMemo(() => Array.isArray(rawResources) ? rawResources : [], [rawResources]);

    // Secure View State
    const [viewingResource, setViewingResource] = React.useState<EngagementResource | null>(null);
    const [secureUrl, setSecureUrl] = React.useState<string | null>(null);
    const [pinVerifyOpen, setPinVerifyOpen] = React.useState(false);

    const handleViewClick = (resource: EngagementResource) => {
        if (resource.type === 'PDF') {
            setViewingResource(resource);
            setPinVerifyOpen(true);
        } else {
            // Direct redirect for non-PDF (Links)
            if (resource.url) {
                window.open(resource.url, '_blank');
            }
        }
    };

    const handlePinSuccess = async () => {
        if (!viewingResource) return;

        setPinVerifyOpen(false);

        // If it's a PDF/Document, we fetch as blob to hide real URL
        if (viewingResource.type === 'PDF' && viewingResource.url?.startsWith('/api/file')) {
            try {
                const res = await fetch(viewingResource.url);
                if (!res.ok) throw new Error('Failed to load');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setSecureUrl(url);
            } catch (e) {
                toast({ title: "Failed to load document", variant: "destructive" });
            }
        } else {
            // Web Link or External
            setSecureUrl(viewingResource.url || null);
        }
    };


    const closeViewer = () => {
        if (secureUrl && viewingResource?.type === 'PDF') {
            URL.revokeObjectURL(secureUrl);
        }
        setSecureUrl(null);
        setViewingResource(null);
    };

    // Group resources by category
    const categories = Array.from(new Set(resources.map(r => r.category)));

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {resources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden border-none shadow-lg group hover:scale-[1.02] transition-transform duration-300 flex flex-col bg-white dark:bg-card">
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                    <CardHeader className="pb-3 px-6 pt-6">
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 uppercase tracking-wider text-[10px]">
                                {resource.category || 'Resource'}
                            </Badge>
                            {resource.type === 'PDF' ? (
                                <FileText className="h-5 w-5 text-emerald-500/50" />
                            ) : (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">
                                    <ExternalLink className="h-5 w-5 text-emerald-500/50 hover:text-emerald-600" />
                                </a>
                            )}
                        </div>
                        <div className="space-y-1">
                            {resource.type === 'PDF' ? (
                                <CardTitle className="text-xl font-bold line-clamp-2 leading-tight">{resource.name}</CardTitle>
                            ) : (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-emerald-500/50 underline-offset-4">
                                    <CardTitle className="text-xl font-bold line-clamp-2 leading-tight">{resource.name}</CardTitle>
                                </a>
                            )}
                            {resource.type === 'PDF' && resource.size && resource.size !== 'N/A' && (
                                <p className="text-xs text-muted-foreground font-mono">{resource.size}</p>
                            )}
                            {resource.type !== 'PDF' && resource.url && (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 hover:text-blue-700 hover:underline truncate max-w-full font-mono mt-1">
                                    {resource.url}
                                </a>
                            )}
                        </div>
                    </CardHeader>
                    {resource.type === 'PDF' && (
                        <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-end">
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center text-muted-foreground gap-2 font-medium text-sm">
                                    <Lock className="h-4 w-4 text-emerald-500" />
                                    <span className="text-xs">Secure View</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 hover:bg-emerald-50 text-emerald-600 border-emerald-200"
                                    onClick={() => handleViewClick(resource)}
                                >
                                    <Eye className="h-4 w-4" /> View
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>
            ))}
            {resources.length === 0 && (
                <div className="col-span-full py-20 text-center bg-muted/5 rounded-3xl border-2 border-dashed">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">No company resources available</p>
                </div>
            )}

            {/* PIN Dialog */}
            <PinVerifyDialog
                open={pinVerifyOpen}
                onOpenChange={setPinVerifyOpen}
                onSuccess={handlePinSuccess}
                documentName={viewingResource?.name}
                action="view"
                customTitle="Secure Resource Access"
                customDescription="This resource is protected. Enter your PIN to view it."
            />

            {/* Secure Viewer Overlay */}
            {secureUrl && (
                <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
                    <div className="h-14 border-b flex items-center justify-between px-6 bg-card/50">
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold">{viewingResource?.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={closeViewer}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {viewingResource?.type === 'PDF' ? (
                            <iframe
                                src={`${secureUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full border-0"
                                onContextMenu={(e) => e.preventDefault()}
                            />
                        ) : (
                            <iframe
                                src={secureUrl}
                                className="w-full h-full border-0"
                            />
                        )}
                        {/* Overlay to prevent direct right click on iframe content if possible (limited) */}
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-transparent" />
                    </div>
                </div>
            )}
        </div>
    );
}
