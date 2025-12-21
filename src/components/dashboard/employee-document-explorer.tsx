'use client';
import React, { useState, useMemo } from 'react';
import { Document } from '@/lib/types';
import {
    Folder,
    FileText,
    ArrowLeft,
    Home,
    Clock,
    Calendar,
    Grid,
    List,
    ChevronRight,
    Search,
    Download,
    Eye,
    MoreVertical,
    FileIcon,
    Trash2,
    ArrowUpDown,
    Filter,
    Stethoscope, // Medical
    Banknote,    // Salary
    User,        // Personal
    Award,       // Appraisal
    // New Dynamic Icons
    Scale,
    FileSignature,
    Briefcase,
    GraduationCap,
    Shield,
    Image as ImageIcon,
    Film,
    Music,
    Cpu,
    Database,
    Plane,
    Receipt,
    Calculator,
    Users,
    BriefcaseBusiness,
    Palette,
    Landmark,
    MapPin,
    Building2,
    Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
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
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, getYear, getMonth } from 'date-fns';

const PRIORITY_FOLDERS = ['Salary Slip', 'Medical Report', 'Appraisal Letter', 'Personal'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
    documents: Document[];
    onView: (doc: Document) => void;
    onDownload: (doc: Document) => void;
    onDelete: (docId: string) => void;
}

type PathType = 'root' | 'category';
interface PathItem {
    id: string;
    name: string;
    type: PathType;
}

function FileIconComponent({ type }: { type: string }) {
    if (type === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
    if (type === 'doc' || type === 'docx') return <FileText className="h-8 w-8 text-blue-500" />;
    if (type === 'jpg' || type === 'png' || type === 'jpeg') return <FileIcon className="h-8 w-8 text-green-500" />;
    return <FileText className="h-8 w-8 text-gray-400" />;
}

// Helper: Semantic Icon Matching
const getSmartIcon = (name: string) => {
    const n = name.toLowerCase();

    // Finance
    if (n.includes('salary') || n.includes('pay') || n.includes('payroll')) return Banknote;
    if (n.includes('tax') || n.includes('invoice') || n.includes('bill') || n.includes('receipt')) return Receipt;
    if (n.includes('budget') || n.includes('finance') || n.includes('account') || n.includes('bank')) return Landmark;

    // Legal & Contracts
    if (n.includes('contract') || n.includes('agreement') || n.includes('nda') || n.includes('offer') || n.includes('policy')) return FileSignature;
    if (n.includes('legal') || n.includes('law') || n.includes('compliance') || n.includes('court')) return Scale;

    // HR & Personal
    if (n.includes('personal') || n.includes('profile') || n.includes('identity') || n.includes('me')) return User;
    if (n.includes('team') || n.includes('group') || n.includes('hr') || n.includes('people') || n.includes('staff')) return Users;
    if (n.includes('job') || n.includes('career') || n.includes('work') || n.includes('employ')) return BriefcaseBusiness;
    if (n.includes('education') || n.includes('degree') || n.includes('certif') || n.includes('training') || n.includes('learn')) return GraduationCap;

    // Health
    if (n.includes('health') || n.includes('medical') || n.includes('doctor') || n.includes('insur') || n.includes('medi')) return Stethoscope;

    // Assets & Media
    if (n.includes('image') || n.includes('photo') || n.includes('pic') || n.includes('gallery') || n.includes('asset')) return ImageIcon;
    if (n.includes('video') || n.includes('movie') || n.includes('record')) return Film;
    if (n.includes('design') || n.includes('art') || n.includes('ux') || n.includes('ui') || n.includes('creat')) return Palette;
    if (n.includes('audio') || n.includes('sound') || n.includes('music')) return Music;

    // Tech
    if (n.includes('tech') || n.includes('code') || n.includes('dev') || n.includes('software') || n.includes('eng')) return Cpu;
    if (n.includes('data') || n.includes('analytic') || n.includes('report') || n.includes('stat')) return Database;

    // Other
    if (n.includes('project') || n.includes('task') || n.includes('plan') || n.includes('sprint')) return Briefcase;
    if (n.includes('travel') || n.includes('trip') || n.includes('expens') || n.includes('move')) return Plane;
    if (n.includes('secur') || n.includes('pass') || n.includes('audit') || n.includes('auth')) return Shield;
    if (n.includes('appraisal') || n.includes('award') || n.includes('bonus') || n.includes('promot')) return Award;

    // Places
    if (n.includes('location') || n.includes('site') || n.includes('place') || n.includes('map') || n.includes('office') || n.includes('branch')) return MapPin;
    if (n.includes('department') || n.includes('dept') || n.includes('division')) return Building2;

    return Folder; // Fallback
};

export function EmployeeDocumentExplorer({ documents, onView, onDownload, onDelete }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPath, setCurrentPath] = useState<PathItem[]>([
        { id: 'root', name: 'My Documents', type: 'root' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters defaulting to Current Date
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = MONTHS[new Date().getMonth()];

    // Using string 'all' for "All Years/Months" option
    const [filterYear, setFilterYear] = useState<string>(currentYear);
    const [filterMonth, setFilterMonth] = useState<string>(currentMonth);

    // Navigation Handlers
    const handleNavigate = (index: number) => {
        setCurrentPath(currentPath.slice(0, index + 1));
        setSearchQuery('');
    };

    const enterFolder = (id: string, name: string, type: PathType) => {
        setCurrentPath([...currentPath, { id, name, type }]);
        setSearchQuery('');
    };

    const activeLevel = currentPath[currentPath.length - 1];

    // Get available years for dropdown
    const availableYears = useMemo(() => {
        const years = new Set(documents.map(d => getYear(new Date(d.uploadDate)).toString()));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [documents]);

    // Content Logic
    const { content, isEmpty } = useMemo(() => {
        // Search takes priority
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            const matchedDocs = documents.filter(d => d.name.toLowerCase().includes(lowerQ));
            return { content: { type: 'files', data: matchedDocs }, isEmpty: matchedDocs.length === 0 };
        }

        // Level 0: Root -> Show Categories (Folders)
        if (activeLevel.type === 'root') {
            const docTypes = new Set(documents.map(d => d.type || 'Personal'));
            // Ensure priority folders are always visible
            PRIORITY_FOLDERS.forEach(folder => docTypes.add(folder));
            const allTypes = Array.from(docTypes);

            // Filter out 'Resources' which are restricted from the file explorer
            const sortedFolders = allTypes
                .filter(folder => folder !== 'Resources')
                .sort((a, b) => {
                    const idxA = PRIORITY_FOLDERS.indexOf(a);
                    const idxB = PRIORITY_FOLDERS.indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return a.localeCompare(b);
                });

            return { content: { type: 'folders', data: sortedFolders, nextType: 'category' as PathType, icon: 'folder' }, isEmpty: sortedFolders.length === 0 };
        }

        // Level 1: Category -> Show Files (Filtered by Year/Month)
        if (activeLevel.type === 'category') {
            const category = activeLevel.id;

            let filteredDocs = documents.filter(d => (d.type || 'Personal') === category);

            // Apply Year Filter
            if (filterYear !== 'all') {
                filteredDocs = filteredDocs.filter(d => getYear(new Date(d.uploadDate)).toString() === filterYear);
            }

            // Apply Month Filter
            if (filterMonth !== 'all') {
                const monthIdx = MONTHS.indexOf(filterMonth);
                filteredDocs = filteredDocs.filter(d => getMonth(new Date(d.uploadDate)) === monthIdx);
            }

            // Sort by date desc
            filteredDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

            return { content: { type: 'files', data: filteredDocs }, isEmpty: filteredDocs.length === 0 };
        }

        return { content: { type: 'empty' }, isEmpty: true };
    }, [currentPath, documents, searchQuery, activeLevel, filterYear, filterMonth]);

    // Auto-switch view
    useMemo(() => {
        if ((content as any).type === 'files') setViewMode('list');
        else setViewMode('grid');
    }, [(content as any).type]);

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header / Breadcrumbs / Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b bg-white dark:bg-slate-900/50 gap-4">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {currentPath.map((item, idx) => (
                        <div key={item.id} className="flex items-center">
                            {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-400 mx-1" />}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNavigate(idx)}
                                className={cn(
                                    "h-8 px-2 text-sm font-medium whitespace-nowrap",
                                    idx === currentPath.length - 1
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                                )}
                            >
                                {item.type === 'root' && <Home className="h-3.5 w-3.5 mr-1.5" />}
                                {item.name}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    {/* Filters: Only show when not searching */}
                    {!searchQuery && (
                        <div className="flex items-center gap-2">
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger className="w-[100px] h-8 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-0 focus:ring-1">
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
                                <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-0 focus:ring-1">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {MONTHS.map(month => (
                                        <SelectItem key={month} value={month}>{month}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                        </div>
                    )}

                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-48 h-8 pl-9 text-xs bg-slate-100 dark:bg-slate-800 border-0 focus-visible:ring-1"
                        />
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 min-h-[400px]">
                {isEmpty && !searchQuery ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Folder className="h-16 w-16 mb-4" />
                        <p>No items found for {filterMonth} {filterYear}</p>
                    </div>
                ) : (
                    <>
                        {/* Folders View */}
                        {(content as any).type === 'folders' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                {(content as any).data.map((folderName: string) => {
                                    // 1. Define Color Palette for Dynamic Generation
                                    const colors = [
                                        { name: 'emerald', text: 'text-emerald-600 dark:text-emerald-400', fill: 'bg-emerald-100 dark:bg-emerald-900/20', border: 'border-emerald-200 hover:border-emerald-500', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10', shadow: 'hover:shadow-emerald-200/50' },
                                        { name: 'blue', text: 'text-blue-600 dark:text-blue-400', fill: 'bg-blue-100 dark:bg-blue-900/20', border: 'border-blue-200 hover:border-blue-500', bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/10', shadow: 'hover:shadow-blue-200/50' },
                                        { name: 'rose', text: 'text-rose-600 dark:text-rose-400', fill: 'bg-rose-100 dark:bg-rose-900/20', border: 'border-rose-200 hover:border-rose-500', bg: 'hover:bg-rose-50 dark:hover:bg-rose-900/10', shadow: 'hover:shadow-rose-200/50' },
                                        { name: 'amber', text: 'text-amber-600 dark:text-amber-400', fill: 'bg-amber-100 dark:bg-amber-900/20', border: 'border-amber-200 hover:border-amber-500', bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/10', shadow: 'hover:shadow-amber-200/50' },
                                        { name: 'purple', text: 'text-purple-600 dark:text-purple-400', fill: 'bg-purple-100 dark:bg-purple-900/20', border: 'border-purple-200 hover:border-purple-500', bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/10', shadow: 'hover:shadow-purple-200/50' },
                                        { name: 'cyan', text: 'text-cyan-600 dark:text-cyan-400', fill: 'bg-cyan-100 dark:bg-cyan-900/20', border: 'border-cyan-200 hover:border-cyan-500', bg: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/10', shadow: 'hover:shadow-cyan-200/50' },
                                        { name: 'indigo', text: 'text-indigo-600 dark:text-indigo-400', fill: 'bg-indigo-100 dark:bg-indigo-900/20', border: 'border-indigo-200 hover:border-indigo-500', bg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/10', shadow: 'hover:shadow-indigo-200/50' },
                                        { name: 'orange', text: 'text-orange-600 dark:text-orange-400', fill: 'bg-orange-100 dark:bg-orange-900/20', border: 'border-orange-200 hover:border-orange-500', bg: 'hover:bg-orange-50 dark:hover:bg-orange-900/10', shadow: 'hover:shadow-orange-200/50' },
                                    ];

                                    // 2. Deterministic Hash for Color Selection
                                    const hash = folderName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                    // Use hash to pick a color index
                                    const theme = colors[hash % colors.length];

                                    // 3. Determine Icon SEMANTICALLY
                                    const Icon = getSmartIcon(folderName);

                                    return (
                                        <Card
                                            key={folderName}
                                            className={cn(
                                                "cursor-pointer group transition-all duration-300 border-2 bg-white dark:bg-slate-900",
                                                "transform hover:-translate-y-1 hover:scale-[1.02]", // Animation
                                                theme.border,
                                                theme.bg,
                                                "hover:shadow-lg dark:hover:shadow-none"
                                            )}
                                            onClick={() => enterFolder(folderName, folderName, (content as any).nextType)}
                                        >
                                            <CardContent className="flex flex-col items-center justify-center p-6 gap-4 min-h-[160px]">
                                                <div className={cn("p-4 rounded-full shadow-sm transition-transform duration-300 group-hover:scale-110", theme.fill)}>
                                                    <Icon className={cn("h-10 w-10 transition-colors", theme.text)} strokeWidth={1.5} />
                                                </div>
                                                <span className={cn("font-semibold text-center text-sm transition-colors group-hover:text-foreground/80", "text-slate-700 dark:text-slate-300")}>
                                                    {folderName}
                                                </span>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {/* Files View */}
                        {(content as any).type === 'files' && (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                    {(content as any).data.map((doc: Document) => (
                                        <Card key={doc.id} className="group hover:shadow-lg transition-all cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                            <div className="aspect-[4/3] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 relative group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                                                <FileIconComponent type={doc.fileType} />
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm"><MoreVertical className="h-3.5 w-3.5" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => onView(doc)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onDownload(doc)}><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            <CardContent className="p-3">
                                                <p className="font-medium truncate text-sm text-slate-700 dark:text-slate-200" title={doc.name}>{doc.name}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] text-slate-400 font-mono uppercase">{doc.fileType}</span>
                                                    <span className="text-[10px] text-slate-400">{format(new Date(doc.uploadDate), 'MMM d')}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(content as any).data.map((doc: Document) => (
                                                <TableRow key={doc.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {doc.fileType === 'pdf' ? <FileText className="h-4 w-4 text-red-500" /> : <FileIcon className="h-4 w-4 text-blue-500" />}
                                                            {doc.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{doc.type}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{format(new Date(doc.uploadDate), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" onClick={() => onView(doc)} className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                <Eye className="mr-2 h-3 w-3" /> View
                                                            </Button>
                                                            <Button size="sm" onClick={() => onDownload(doc)} className="h-8 px-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md hover:from-emerald-600 hover:to-cyan-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                <Download className="mr-2 h-3 w-3" /> Download
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
