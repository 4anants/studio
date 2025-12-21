
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { Document, User } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Folder,
    FileText,
    Search,
    Grid,
    List,
    ArrowLeft,
    Home,
    Clock,
    MoreVertical,
    Download,
    Eye,
    Trash2,
    FileIcon,
    ChevronRight,
    ArrowUpDown,
    Calendar,
    Building2,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from '@/components/ui/card';
import { cn, getAvatarSrc } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { format, getYear, getMonth } from 'date-fns';
import { documentTypesList } from '@/lib/constants';
import { PinVerifyDialog } from './pin-verify-dialog';

// --- Types & Constants ---
type ViewMode = 'grid' | 'list';
type PathType = 'root' | 'category' | 'year' | 'month';
interface PathItem {
    id: string;
    name: string;
    type: PathType;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function FileIconComponent({ type }: { type: string }) {
    if (type === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
    if (type === 'doc' || type === 'docx') return <FileText className="h-8 w-8 text-blue-500" />;
    if (type === 'jpg' || type === 'png' || type === 'jpeg') return <FileIcon className="h-8 w-8 text-green-500" />;
    return <FileText className="h-8 w-8 text-gray-400" />;
}

interface EmployeeFileExplorerProps {
    documents: Document[];
    currentUser?: User;
    checkPermission?: (doc: Document, action: 'delete' | 'view' | 'download') => boolean;
}

export function EmployeeFileExplorer({ documents, currentUser, checkPermission: customCheckPermission }: EmployeeFileExplorerProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { mutateDocuments } = useData();

    // -- State --
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentPath, setCurrentPath] = useState<PathItem[]>([
        { id: 'root', name: 'Home', type: 'root' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    // PIN Verification State
    const [pinVerifyOpen, setPinVerifyOpen] = useState(false);
    const [pendingDoc, setPendingDoc] = useState<Document | null>(null);
    const [pendingAction, setPendingAction] = useState<'view' | 'download'>('view');

    // Default filters to Current Date for dropdowns
    const currentYearStr = new Date().getFullYear().toString();
    const currentMonthStr = MONTHS[new Date().getMonth()];

    const [filterYear, setFilterYear] = useState<string>(currentYearStr);
    const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);

    const availableYears = useMemo(() => {
        const years = new Set(documents.map(d => getYear(new Date(d.uploadDate)).toString()));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [documents]);

    // -- Navigation Handlers --

    const handleNavigate = (index: number) => {
        setCurrentPath(currentPath.slice(0, index + 1));
        setSearchQuery('');
    };

    const goBack = () => {
        if (currentPath.length > 1) {
            setCurrentPath(currentPath.slice(0, currentPath.length - 1));
            setSearchQuery('');
        }
    };

    const enterFolder = (id: string, name: string, type: PathType) => {
        setCurrentPath([...currentPath, { id, name, type }]);
        setSearchQuery('');
    };

    // Permission Logic
    const checkPermission = (doc: Document, action: 'delete' | 'view' | 'download') => {
        if (customCheckPermission) return customCheckPermission(doc, action);

        if (action === 'view' || action === 'download') return true; // Employee can view/download all their docs
        if (action === 'delete') return doc.type === 'Personal'; // Only delete Personal docs
        return false;
    };

    // -- Content Filtering Logic --

    const activeLevel = currentPath[currentPath.length - 1];

    const { content, isEmpty } = useMemo(() => {
        // 1. Search Mode
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            const matchedDocs = documents.filter(d => d.name.toLowerCase().includes(lowerQ));
            return { content: { type: 'files', data: matchedDocs }, isEmpty: matchedDocs.length === 0 };
        }

        // Helper to check if a doc matches current filters
        const matchesFilters = (d: Document) => {
            const dDate = new Date(d.uploadDate);
            const yMatch = filterYear === 'all' || getYear(dDate).toString() === filterYear;
            const mMatch = filterMonth === 'all' || MONTHS[getMonth(dDate)] === filterMonth;
            return yMatch && mMatch;
        };

        // 2. Browser Mode with Filter Integration

        // Level 0: Root -> Show Categories (Folders)
        if (activeLevel.type === 'root') {
            // Only consider documents that match the current date filters to populate categories
            const filteredDocs = documents.filter(matchesFilters);

            const userDocTypes = new Set(filteredDocs.map(d => d.type));
            const allTypes = new Set([...documentTypesList, ...Array.from(userDocTypes)]);

            // Filter to only show types that actually have content for the selected date?
            // User requested to "found documents folder". It's safer to show categories that exist even if empty, 
            // OR strictly follow the filter. Let's filter strict to avoid "empty" confusion, 
            // but ensuring key types are visible if they are standard.
            // Actually, showing empty folders is better for "finding the folder" even if 2025 has no docs yet.
            // But let's prioritize types with docs + standard list.

            const sortedFolders = Array.from(allTypes).sort((a, b) => {
                const idxA = documentTypesList.indexOf(a);
                const idxB = documentTypesList.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });

            return { content: { type: 'folders', data: sortedFolders, nextType: 'category' as PathType }, isEmpty: sortedFolders.length === 0 };
        }

        // Level 1: Category Selected
        if (activeLevel.type === 'category') {
            const category = activeLevel.id;

            // If Year AND Month are set, show FILES directly
            if (filterYear !== 'all' && filterMonth !== 'all') {
                const catDocs = documents.filter(d =>
                    d.type === category && matchesFilters(d)
                );
                return { content: { type: 'files', data: catDocs }, isEmpty: catDocs.length === 0 };
            }

            // If only Year is set, show MONTHS directly (skip Year folder)
            if (filterYear !== 'all') {
                const catDocs = documents.filter(d => d.type === category && matchesFilters(d));
                const activeMonthsIndices = new Set(catDocs.map(d => getMonth(new Date(d.uploadDate))));
                // Show all months or just active? Let's show active to be helpful.
                const sortedMonths = Array.from(activeMonthsIndices).sort((a, b) => a - b).map(idx => MONTHS[idx]);
                return { content: { type: 'folders', data: sortedMonths, nextType: 'month' as PathType, icon: 'clock' }, isEmpty: sortedMonths.length === 0 };
            }

            // Otherwise (No filters), show YEARS
            const catDocs = documents.filter(d => d.type === category);
            const years = new Set(catDocs.map(d => getYear(new Date(d.uploadDate)).toString()));
            const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
            return { content: { type: 'folders', data: sortedYears, nextType: 'year' as PathType, icon: 'calendar' }, isEmpty: sortedYears.length === 0 };
        }

        // Level 2: Year Selected (Only reached if filterYear was 'all')
        if (activeLevel.type === 'year') {
            const categoryItem = currentPath[currentPath.length - 2];
            const category = categoryItem.id;
            const year = parseInt(activeLevel.id);

            // If Month is set globally, show FILES directly
            if (filterMonth !== 'all') {
                const catDocs = documents.filter(d =>
                    d.type === category &&
                    getYear(new Date(d.uploadDate)) === year &&
                    MONTHS[getMonth(new Date(d.uploadDate))] === filterMonth
                );
                return { content: { type: 'files', data: catDocs }, isEmpty: catDocs.length === 0 };
            }

            const yearDocs = documents.filter(d => d.type === category && getYear(new Date(d.uploadDate)) === year);
            const activeMonthsIndices = new Set(yearDocs.map(d => getMonth(new Date(d.uploadDate))));
            const sortedMonths = Array.from(activeMonthsIndices).sort((a, b) => a - b).map(idx => MONTHS[idx]);

            return { content: { type: 'folders', data: sortedMonths, nextType: 'month' as PathType, icon: 'clock' }, isEmpty: sortedMonths.length === 0 };
        }

        // Level 3: Month Selected (or implicitly reached)
        if (activeLevel.type === 'month') {
            // Determine context. Path could be: Root > Category > Month (if Year filtered) OR Root > Category > Year > Month
            // We need to robustly find Category and Year.

            let category = '';
            let year = 0;

            if (filterYear !== 'all') {
                // Path: Root(0) > Category(1) > Month(2)
                category = currentPath[currentPath.length - 2].id;
                year = parseInt(filterYear);
            } else {
                // Path: Root(0) > Category(1) > Year(2) > Month(3)
                category = currentPath[currentPath.length - 3].id;
                year = parseInt(currentPath[currentPath.length - 2].id);
            }

            const monthIdx = MONTHS.indexOf(activeLevel.id);

            const monthDocs = documents.filter(d =>
                d.type === category &&
                getYear(new Date(d.uploadDate)) === year &&
                getMonth(new Date(d.uploadDate)) === monthIdx
            );

            return { content: { type: 'files', data: monthDocs }, isEmpty: monthDocs.length === 0 };
        }

        return { content: { type: 'error', message: 'Unknown path' }, isEmpty: true };

    }, [currentPath, documents, searchQuery, activeLevel, filterYear, filterMonth]);

    // Auto-switch view mode
    useEffect(() => {
        const type = (content as any).type;
        if (type === 'files') {
            setViewMode('list');
        } else {
            setViewMode('grid');
        }
    }, [(content as any).type]);

    // Action Handlers with PIN Verification
    const handleView = (doc: Document) => {
        setPendingDoc(doc);
        setPendingAction('view');
        setPinVerifyOpen(true);
    };

    const handleDownload = (doc: Document) => {
        setPendingDoc(doc);
        setPendingAction('download');
        setPinVerifyOpen(true);
    };

    const handlePinSuccess = () => {
        if (pendingDoc) {
            if (pendingDoc.url) {
                window.open(pendingDoc.url, '_blank');
            }
        }
        setPendingDoc(null);
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Permanently delete this document?')) return;
        try {
            await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
            await mutateDocuments();
            toast({ title: 'Document deleted' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error deleting document' });
        }
    };

    return (
        <div className="flex h-full min-h-[500px] w-full flex-col bg-muted/10 rounded-lg border">
            {/* Gradient Definition for Icons */}
            <svg width="0" height="0" className="absolute block w-0 h-0 overflow-hidden" aria-hidden="true">
                <defs>
                    <linearGradient id="folder-gradient-emp" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Title Header */}
            <div className="px-6 pt-6 pb-2">
                <h2 className="text-xl font-bold tracking-tight">Your Files</h2>
                <p className="text-sm text-muted-foreground">Here are all documents associated with your account.</p>
            </div>

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-y bg-background/50 sticky top-0 z-10 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-1 text-sm overflow-hidden whitespace-nowrap mask-linear-fade">
                        {currentPath.map((item, idx) => (
                            <React.Fragment key={item.id + idx}>
                                {idx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-auto py-1 px-2 font-normal hover:bg-muted",
                                        idx === currentPath.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"
                                    )}
                                    onClick={() => handleNavigate(idx)}
                                >
                                    {item.type === 'root' && <Home className="h-4 w-4 mr-1" />}
                                    {item.name}
                                </Button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-end">
                    {/* Global Filters */}
                    <div className="flex items-center gap-2">
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="w-[100px] h-9 bg-muted/40 border-0 focus:ring-0">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {availableYears.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                            <SelectTrigger className="w-[120px] h-9 bg-muted/40 border-0 focus:ring-0">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {MONTHS.map(month => (
                                    <SelectItem key={month} value={month}>{month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative w-full max-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter items..."
                            className="pl-9 rounded-full bg-muted/40 border-0 focus-visible:bg-background h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {((content as any).type === 'files' || (content as any).type === 'users') && (
                        <div className="flex items-center bg-muted/40 rounded-lg p-1 h-9">
                            <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded-md" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
                            <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded-md" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto p-6">
                {isEmpty && !searchQuery && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[300px]">
                        <Folder className="h-16 w-16 mb-4 opacity-20" />
                        <p>No items found.</p>
                    </div>
                )
                }

                {/* View: Folders */}
                {
                    (content as any).type === 'folders' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in zoom-in-95 duration-300">
                            {(content as any).data.map((folderName: string) => {
                                let icon = <Folder className="h-16 w-16 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} style={{ stroke: 'url(#folder-gradient-emp)' }} />;
                                if ((content as any).icon === 'calendar') icon = <Calendar className="h-16 w-16 text-orange-500 fill-orange-500/20 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />;
                                if ((content as any).icon === 'clock') icon = <Clock className="h-16 w-16 text-emerald-500 fill-emerald-500/20 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />;

                                return (
                                    <Card
                                        key={folderName}
                                        className="cursor-pointer hover:border-purple-500 hover:shadow-lg hover:bg-purple-50/10 transition-all border-muted shadow-sm bg-card group relative overflow-hidden"
                                        onClick={() => enterFolder(folderName, folderName, (content as any).nextType)}
                                    >
                                        <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                                            <div className="group-hover:-translate-y-1 transition-transform duration-300">
                                                {icon}
                                            </div>
                                            <span className="font-medium text-center truncate w-full group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{folderName}</span>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )
                }

                {/* View: Files */}
                {
                    (content as any).type === 'files' && !isEmpty && (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {(content as any).data.map((doc: Document) => (
                                    <Card key={doc.id} className="group hover:shadow-lg transition-all cursor-pointer border-0 bg-card shadow-sm">
                                        <div className="aspect-square flex items-center justify-center bg-muted/20 relative group-hover:bg-muted/30 transition-colors rounded-t-lg">
                                            <FileIconComponent type={doc.fileType} />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleView(doc)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownload(doc)}><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                                                        {checkPermission(doc, 'delete') && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(doc.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <CardContent className="p-3">
                                            <p className="font-medium truncate text-sm" title={doc.name}>{doc.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(doc.uploadDate), 'MMM d, yyyy')}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border bg-card/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[40%]">Name</TableHead>
                                            <TableHead className="w-[20%]">Type</TableHead>
                                            <TableHead className="w-[10%]">Size</TableHead>
                                            <TableHead className="w-[20%]">Uploaded</TableHead>
                                            <TableHead className="w-[10%] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(content as any).data.map((doc: Document) => (
                                            <TableRow key={doc.id} className="group hover:bg-muted/50 border-b border-border/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                                                            {doc.fileType === 'pdf' ? <FileText className="h-5 w-5 text-red-500" /> : <FileIcon className="h-5 w-5 text-blue-500" />}
                                                        </div>
                                                        <span className="truncate font-semibold text-foreground">{doc.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                                                        {doc.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-mono">
                                                    {doc.size || '357 KB'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {format(new Date(doc.uploadDate), 'yyyy-MM-dd')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleView(doc)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {checkPermission(doc, 'delete') && (
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(doc.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    )
                }
            </main >

            <PinVerifyDialog
                open={pinVerifyOpen}
                onOpenChange={setPinVerifyOpen}
                onSuccess={handlePinSuccess}
                documentName={pendingDoc?.name}
                action={pendingAction}
            />
        </div >
    );
}
