
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
    User as UserIcon,
    Clock,
    Star,
    MoreVertical,
    Download,
    Eye,
    Trash2,
    FileIcon,
    ChevronRight,
    Filter,
    ArrowUpDown,
    Calendar,
    Building,
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
import { Card, CardContent } from '@/components/ui/card';
import { cn, getAvatarSrc } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, getYear, getMonth } from 'date-fns';

// --- Types & Constants ---
type ViewMode = 'grid' | 'list';
type PathType = 'root' | 'department' | 'location' | 'user' | 'category' | 'year' | 'month';
interface PathItem {
    id: string;
    name: string;
    type: PathType;
}

const PRIORITY_FOLDERS = ['Salary Slip', 'Personal', 'Medical Report', 'Appraisal Letter'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function FileIconComponent({ type }: { type: string }) {
    if (type === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
    if (type === 'doc' || type === 'docx') return <FileText className="h-8 w-8 text-blue-500" />;
    if (type === 'jpg' || type === 'png' || type === 'jpeg') return <FileIcon className="h-8 w-8 text-green-500" />;
    return <FileText className="h-8 w-8 text-gray-400" />;
}

export default function FileExplorerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const {
        users: serverUsers,
        documents: serverDocs,
        documentTypes: serverDocTypes,
        mutateDocuments
    } = useData();

    // -- State --
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentPath, setCurrentPath] = useState<PathItem[]>([
        { id: 'root', name: 'Departments', type: 'root' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    // Default filters to Current Date
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = MONTHS[new Date().getMonth()];
    const [filterYear, setFilterYear] = useState<string>(currentYear);
    const [filterMonth, setFilterMonth] = useState<string>(currentMonth);

    // Derived Data
    const users = (serverUsers || []) as User[];
    const docs = (serverDocs || []) as Document[];

    // Auto-update path when filters change while deep in navigation
    useEffect(() => {
        if (filterYear === 'all' || filterMonth === 'all') return;

        // Check if we are currently viewing files (meaning we are deep enough to have a category)
        const categoryIndex = currentPath.findIndex(p => p.type === 'category');

        if (categoryIndex !== -1) {
            // We have a category. Ensure path uses the selected filters.
            const newPath = currentPath.slice(0, categoryIndex + 1); // Keep up to Category
            newPath.push({ id: filterYear, name: filterYear, type: 'year' });
            newPath.push({ id: filterMonth, name: filterMonth, type: 'month' });

            // Detection: Check if actual path is different from calculated path
            const currentYearItem = currentPath.find(p => p.type === 'year');
            const currentMonthItem = currentPath.find(p => p.type === 'month');

            if (currentYearItem?.id !== filterYear || currentMonthItem?.id !== filterMonth) {
                setCurrentPath(newPath);
                setSearchQuery(''); // Reset search on filter change
            }
        }
    }, [filterYear, filterMonth, currentPath]);

    // Auto-navigate if query param present (only once)
    useEffect(() => {
        const userId = searchParams.get('userId');
        if (userId && currentPath.length === 1 && users.length > 0) {
            const user = users.find(u => u.id === userId);
            if (user) {
                // Reconstruct full path for this user: Root -> Dept -> Location -> User
                const dept = user.department || 'Unassigned';
                const loc = user.location || 'Unknown Location';

                setCurrentPath([
                    { id: 'root', name: 'Departments', type: 'root' },
                    { id: dept, name: dept, type: 'department' },
                    { id: loc, name: loc, type: 'location' },
                    { id: user.id, name: user.name, type: 'user' }
                ]);
            }
        }
    }, [searchParams, users]);

    // -- Navigation Handlers --

    const handleNavigate = (index: number) => {
        setCurrentPath(currentPath.slice(0, index + 1));
        setSearchQuery('');
    };

    const goBack = () => {
        // Smart Back: If filters are set and we are deeper than User level (viewing files/months), 
        // jump straight back to User level to allow easy folder switching.
        if (filterYear !== 'all' && filterMonth !== 'all') {
            const userIdx = currentPath.findIndex(p => p.type === 'user');
            if (userIdx !== -1 && currentPath.length > userIdx + 1) {
                setCurrentPath(currentPath.slice(0, userIdx + 1));
                setSearchQuery('');
                return;
            }
        }

        if (currentPath.length > 1) {
            setCurrentPath(currentPath.slice(0, currentPath.length - 1));
            setSearchQuery('');
        } else {
            router.push('/dashboard/admin');
        }
    };

    const enterUser = (user: User) => {
        setCurrentPath([...currentPath, { id: user.id, name: user.name, type: 'user' }]);
        setSearchQuery('');
    };

    const enterFolder = (id: string, name: string, type: PathType) => {
        // Smart Jump: If filtering by Year & Month AND we are entering a Category, jump straight to files
        if (type === 'category' && filterYear !== 'all' && filterMonth !== 'all') {
            setCurrentPath([
                ...currentPath,
                { id, name, type }, // Category
                { id: filterYear, name: filterYear, type: 'year' },
                { id: filterMonth, name: filterMonth, type: 'month' }
            ]);
            setSearchQuery('');
            return;
        }

        setCurrentPath([...currentPath, { id, name, type }]);
        setSearchQuery('');
    };

    // Permission Logic
    const checkPermission = (doc: Document, action: 'delete' | 'view' | 'download') => {
        if (action === 'delete') return true;
        return doc.type === 'Personal';
    };

    // -- Content Filtering Logic (The Core) --

    const activeLevel = currentPath[currentPath.length - 1];

    const { content, isEmpty } = useMemo(() => {
        // 1. Search Mode
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            if (activeLevel.type === 'root') {
                // Global search for users if at root (Departments) level
                const matchedUsers = users.filter(u => u.name.toLowerCase().includes(lowerQ));
                return { content: { type: 'users', data: matchedUsers }, isEmpty: matchedUsers.length === 0 };
            }
            // Allow user search within department/location levels as well?
            if (activeLevel.type === 'department' || activeLevel.type === 'location') {
                // Filter users within this scope
                let currentScopeUsers = users;
                if (activeLevel.type === 'department') {
                    currentScopeUsers = users.filter(u => (u.department || 'Unassigned') === activeLevel.id);
                } else if (activeLevel.type === 'location') {
                    const deptId = currentPath[1].id;
                    currentScopeUsers = users.filter(u => (u.department || 'Unassigned') === deptId && (u.location || 'Unknown Location') === activeLevel.id);
                }
                const matchedUsers = currentScopeUsers.filter(u => u.name.toLowerCase().includes(lowerQ));
                return { content: { type: 'users', data: matchedUsers }, isEmpty: matchedUsers.length === 0 };
            }
        }

        // 2. Browser Mode

        // Level 0: Root -> Show Departments
        if (activeLevel.type === 'root') {
            const departments = Array.from(new Set(users.map(u => u.department || 'Unassigned'))).sort();
            return { content: { type: 'folders', data: departments, nextType: 'department', icon: 'department' }, isEmpty: departments.length === 0 };
        }

        // Level 1: Department Selected -> Show Locations
        if (activeLevel.type === 'department') {
            const deptName = activeLevel.id;
            const deptUsers = users.filter(u => (u.department || 'Unassigned') === deptName);
            const locations = Array.from(new Set(deptUsers.map(u => u.location || 'Unknown Location'))).sort();
            return { content: { type: 'folders', data: locations, nextType: 'location', icon: 'map-pin' }, isEmpty: locations.length === 0 }; // Using map-pin icon (handled in render)
        }

        // Level 2: Location Selected -> Show Users
        if (activeLevel.type === 'location') {
            const deptName = currentPath[1].id;
            const locName = activeLevel.id;

            const locUsers = users.filter(u =>
                (u.department || 'Unassigned') === deptName &&
                (u.location || 'Unknown Location') === locName
            );

            // Sorting users by name
            locUsers.sort((a, b) => a.name.localeCompare(b.name));

            return { content: { type: 'users', data: locUsers }, isEmpty: locUsers.length === 0 };
        }

        // Context: We are inside a User.
        // Identify the user from path. With new hierarchy, User is at index 3 (Root=0, Dept=1, Loc=2, User=3)
        // BUT logic should be robust. Find 'user' type item in path?
        const userItem = currentPath.find(p => p.type === 'user');
        if (!userItem) return { content: { type: 'error', message: 'User context lost' }, isEmpty: true };

        const userId = userItem.id;
        let userDocs = docs.filter(d => d.ownerId === userId);

        // Level 3: User Selected -> Show Categories (Doc Types)
        // (This logic remains largely the same, just checking activeLevel types)
        if (activeLevel.type === 'user') {
            const userDocTypes = new Set(userDocs.map(d => d.type));
            const allTypes = new Set([...PRIORITY_FOLDERS, ...userDocTypes]);
            const sortedFolders = Array.from(allTypes).sort((a, b) => {
                const idxA = PRIORITY_FOLDERS.indexOf(a);
                const idxB = PRIORITY_FOLDERS.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });

            if (searchQuery) {
                userDocs = userDocs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
                return { content: { type: 'files', data: userDocs }, isEmpty: userDocs.length === 0 };
            }

            return { content: { type: 'folders', data: sortedFolders, nextType: 'category' }, isEmpty: sortedFolders.length === 0 };
        }

        // Level 4: Category Selected -> Show Years
        if (activeLevel.type === 'category') {
            const category = activeLevel.id;
            const catDocs = userDocs.filter(d => d.type === category);
            const years = new Set(catDocs.map(d => getYear(new Date(d.uploadDate)).toString()));
            const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));

            if (searchQuery) {
                const searchDocs = catDocs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
                return { content: { type: 'files', data: searchDocs }, isEmpty: searchDocs.length === 0 };
            }

            if (sortedYears.length === 0) return { content: { type: 'empty', message: 'No documents in this folder' }, isEmpty: true };
            return { content: { type: 'folders', data: sortedYears, nextType: 'year', icon: 'calendar' }, isEmpty: false };
        }

        // Level 5: Year Selected -> Show Months
        if (activeLevel.type === 'year') {
            // Need robust way to get category.
            // Hierarchy: [Root, Dept, Loc, User, Category, Year]
            // Category is activeLevel - 1 (index - 1) ? 
            // currentPath: [ ..., Category, Year ]
            const categoryItem = currentPath[currentPath.length - 2];
            const category = categoryItem.id;
            const year = parseInt(activeLevel.id);

            const yearDocs = userDocs.filter(d => d.type === category && getYear(new Date(d.uploadDate)) === year);
            const activeMonthsIndices = new Set(yearDocs.map(d => getMonth(new Date(d.uploadDate))));
            const sortedMonths = Array.from(activeMonthsIndices).sort((a, b) => a - b).map(idx => MONTHS[idx]);

            if (searchQuery) {
                const searchDocs = yearDocs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
                return { content: { type: 'files', data: searchDocs }, isEmpty: searchDocs.length === 0 };
            }

            return { content: { type: 'folders', data: sortedMonths, nextType: 'month', icon: 'clock' }, isEmpty: sortedMonths.length === 0 };
        }

        // Level 6: Month Selected -> Show Files
        if (activeLevel.type === 'month') {
            // [ ..., Category, Year, Month ]
            const categoryItem = currentPath[currentPath.length - 3];
            const yearItem = currentPath[currentPath.length - 2];

            const category = categoryItem.id;
            const year = parseInt(yearItem.id);
            const monthIdx = MONTHS.indexOf(activeLevel.id);

            const monthDocs = userDocs.filter(d =>
                d.type === category &&
                getYear(new Date(d.uploadDate)) === year &&
                getMonth(new Date(d.uploadDate)) === monthIdx
            );

            if (searchQuery) {
                const searchDocs = monthDocs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
                return { content: { type: 'files', data: searchDocs }, isEmpty: searchDocs.length === 0 };
            }

            return { content: { type: 'files', data: monthDocs }, isEmpty: monthDocs.length === 0 };
        }

        return { content: { type: 'error', message: 'Unknown path' }, isEmpty: true };

    }, [currentPath, users, docs, searchQuery, activeLevel]);

    // Auto-switch view mode based on content type
    useEffect(() => {
        const type = (content as any).type;
        if (type === 'files') {
            setViewMode('list');
        } else {
            setViewMode('grid');
        }
    }, [(content as any).type]);


    // Action Handlers
    const handleDelete = async (docId: string) => {
        if (!confirm('Permanently delete this document?')) return;
        try {
            await fetch(`/ api / documents ? id = ${docId} `, { method: 'DELETE' });
            await mutateDocuments();
            toast({ title: 'Document deleted' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error deleting document' });
        }
    };

    const handleView = (doc: Document) => {
        if (!checkPermission(doc, 'view')) {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'Restricted: Only Personal documents generally viewable.' });
            return;
        }
        if (doc.url) window.open(doc.url, '_blank');
    };

    const handleDownload = (doc: Document) => {
        if (!checkPermission(doc, 'download')) {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'Restricted.' });
            return;
        }
        if (doc.url) window.open(doc.url, '_blank');
    };

    // -- Sub views --

    return (
        <div className="flex h-full min-h-[80vh] w-full flex-col bg-muted/10">
            {/* Gradient Definition for Icons */}
            <svg width="0" height="0" className="absolute block w-0 h-0 overflow-hidden" aria-hidden="true">
                <defs>
                    <linearGradient id="folder-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
                        <stop offset="50%" stopColor="#a855f7" /> {/* purple-500 */}
                        <stop offset="100%" stopColor="#ec4899" /> {/* pink-500 */}
                    </linearGradient>
                </defs>
            </svg>

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4 flex-1">


                    <div className="flex items-center gap-1 text-sm overflow-hidden whitespace-nowrap mask-linear-fade">
                        {currentPath
                            .map((item, idx) => ({ ...item, originalIdx: idx }))
                            .filter(item => {
                                // Smart Hide: If filters are active, hide the explicit filter path items
                                if (filterYear !== 'all' && filterMonth !== 'all') {
                                    return item.type !== 'year' && item.type !== 'month';
                                }
                                return true;
                            })
                            .map((item, displayIdx, arr) => (
                                <React.Fragment key={item.id + item.originalIdx}>
                                    {displayIdx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-auto py-1 px-2 font-normal hover:bg-muted",
                                            displayIdx === arr.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"
                                        )}
                                        onClick={() => handleNavigate(item.originalIdx)}
                                    >
                                        {item.type === 'root' && <Home className="h-4 w-4 mr-1" />}
                                        {item.name}
                                    </Button>
                                </React.Fragment>
                            ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-end">
                    {/* Year/Month Filters (Visible when User is selected) */}
                    {currentPath.some(p => p.type === 'user') && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger className="w-[100px] h-9 rounded-full bg-muted/40 border-0 focus:ring-0">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {/* Extract unique years from current user's docs */}
                                    {Array.from(new Set(
                                        docs.filter(d => d.ownerId === currentPath.find(p => p.type === 'user')?.id)
                                            .map(d => getYear(new Date(d.uploadDate)).toString())
                                    )).sort((a, b) => b.localeCompare(a)).map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger className="w-[110px] h-9 rounded-full bg-muted/40 border-0 focus:ring-0">
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
                    )}

                    {/* Search logic changes based on depth, but we keep simple text filter */}
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={activeLevel.type === 'root' ? "Search 300+ users..." : "Filter items..."}
                            className="pl-9 rounded-full bg-muted/40 border-0 focus-visible:bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {((content as any).type === 'files' || (content as any).type === 'users') && (
                        <div className="flex items-center bg-muted/40 rounded-lg p-1">
                            <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-md" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
                            <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-md" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto p-6">
                {isEmpty && !searchQuery && (activeLevel.type !== 'root') && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Folder className="h-16 w-16 mb-4 opacity-20" />
                        <p>No items found in this location.</p>
                    </div>
                )}

                {/* View: Users */}
                {(content as any).type === 'users' && (
                    <div className={cn("grid gap-4 animate-in fade-in zoom-in-95 duration-300", viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1")}>
                        {viewMode === 'list' ? (
                            <Card><Table><TableBody>
                                {(content as any).data.map((u: User) => (
                                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => enterUser(u)}>
                                        <TableCell className="w-12"><Image src={getAvatarSrc(u)} width={32} height={32} className="rounded-full" alt="" /></TableCell>
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                        <TableCell className="text-right"><Button size="sm" variant="ghost"><ChevronRight className="h-4 w-4" /></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody></Table></Card>
                        ) : (
                            (content as any).data.map((u: User) => (
                                <Card key={u.id} className="cursor-pointer hover:border-purple-500 hover:shadow-lg hover:bg-purple-50/10 transition-all group border-muted" onClick={() => enterUser(u)}>
                                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                                        <div className="p-1 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 group-hover:scale-105 transition-transform duration-300">
                                            <Image src={getAvatarSrc(u)} width={64} height={64} className="rounded-full object-cover border-2 border-background" alt="" />
                                        </div>
                                        <p className="font-medium text-center truncate w-full group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{u.name}</p>
                                        <p className="text-xs text-muted-foreground">{u.department || 'No Dept'}</p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* View: Folders (Categories, Years, Months) */}
                {(content as any).type === 'folders' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in zoom-in-95 duration-300">
                        {(content as any).data.map((folderName: string) => {
                            let icon = <Folder className="h-16 w-16 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} style={{ stroke: 'url(#folder-gradient)' }} />;
                            if ((content as any).icon === 'calendar') icon = <Calendar className="h-16 w-16 text-orange-500 fill-orange-500/20 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />;
                            if ((content as any).icon === 'clock') icon = <Clock className="h-16 w-16 text-emerald-500 fill-emerald-500/20 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />;
                            if ((content as any).icon === 'department') icon = <Building2 className="h-16 w-16 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} style={{ stroke: 'url(#folder-gradient)' }} />;
                            if ((content as any).icon === 'map-pin') icon = <MapPin className="h-16 w-16 text-red-500 fill-red-500/20 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />;

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
                )}

                {/* View: Files */}
                {(content as any).type === 'files' && (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                                                    {checkPermission(doc, 'view') && <DropdownMenuItem onClick={() => handleView(doc)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>}
                                                    {checkPermission(doc, 'download') && <DropdownMenuItem onClick={() => handleDownload(doc)}><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(doc.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
                        <FileTable docs={(content as any).data} users={users} checkPermission={checkPermission} onDelete={handleDelete} onView={handleView} onDownload={handleDownload} />
                    )
                )}
            </main>
        </div>
    );
}

function FileTable({ docs, users, checkPermission, onDelete, onView, onDownload }: any) {
    if (docs.length === 0) return <div className="text-center p-8 text-muted-foreground">No files</div>;
    return (
        <div className="rounded-lg border bg-card/50">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[30%] cursor-pointer hover:text-foreground transition-colors group">
                            <span className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100" /></span>
                        </TableHead>
                        <TableHead className="w-[20%] cursor-pointer hover:text-foreground transition-colors group">
                            <span className="flex items-center gap-1">Type <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100" /></span>
                        </TableHead>
                        <TableHead className="w-[10%]">Size</TableHead>
                        <TableHead className="w-[20%] cursor-pointer hover:text-foreground transition-colors group">
                            <span className="flex items-center gap-1">Uploaded <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100" /></span>
                        </TableHead>
                        <TableHead className="w-[20%] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {docs.map((doc: Document) => (
                        <TableRow key={doc.id} className="group hover:bg-muted/50 border-b border-border/50 transition-colors">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                                        {doc.fileType === 'pdf' ? <FileText className="h-5 w-5 text-red-500" /> : <FileIcon className="h-5 w-5 text-blue-500" />}
                                    </div>
                                    <span className="truncate">{doc.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
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
                                    {(checkPermission(doc, 'view') || checkPermission(doc, 'download')) && (
                                        <div className="flex gap-2">
                                            {checkPermission(doc, 'view') && (
                                                <Button size="sm" onClick={() => onView(doc)} className="h-8 px-3 rounded-md bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                                                    <Eye className="mr-2 h-3 w-3" /> View
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <Button variant="destructive" size="sm" className="h-8 px-3 shadow-sm" onClick={() => onDelete(doc.id)}>
                                        <Trash2 className="mr-2 h-3 w-3" /> Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
