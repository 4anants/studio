'use client';
import React, { useState, useMemo } from 'react';
import { useData } from '@/hooks/use-data';
import { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
    Search,
    Grid,
    List,
    ArrowLeft,
    Home,
    ChevronRight,
    Building2,
    MapPin,
    Printer,
    CheckCircle2,
    Check,
    Folder
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
import { Card, CardContent } from '@/components/ui/card';
import { cn, getAvatarSrc } from '@/lib/utils';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkIdCardPrintDialog } from '@/components/dashboard/bulk-id-card-print-dialog';
import { IdCardDesignerDialog } from '@/components/dashboard/id-card-designer';

// --- Types & Constants ---
type ViewMode = 'grid' | 'list';
type PathType = 'root' | 'department' | 'location';
interface PathItem {
    id: string;
    name: string;
    type: PathType;
}

export default function PrintCardsExplorerPage() {
    const router = useRouter();
    const {
        users: serverUsers,
        companies,
        departments
    } = useData();

    // -- State --
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentPath, setCurrentPath] = useState<PathItem[]>([
        { id: 'root', name: 'Departments', type: 'root' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Derived Data
    const users = (serverUsers || []) as User[];

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

    // -- Selection Handlers --
    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAllInView = (visibleUsers: User[]) => {
        const visibleIds = visibleUsers.map(u => u.id);
        const allSelected = visibleIds.every(id => selectedUserIds.includes(id));

        if (allSelected) {
            // Deselect all visible
            setSelectedUserIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            // Select all visible
            const newIds = new Set([...selectedUserIds, ...visibleIds]);
            setSelectedUserIds(Array.from(newIds));
        }
    };

    // -- Content Logic --

    const activeLevel = currentPath[currentPath.length - 1];

    const { content, isEmpty } = useMemo(() => {
        // 1. Search Mode
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            // Global search if at root
            if (activeLevel.type === 'root') {
                const matchedUsers = users.filter(u =>
                    u.name.toLowerCase().includes(lowerQ) ||
                    u.email.toLowerCase().includes(lowerQ)
                );
                return { content: { type: 'users', data: matchedUsers }, isEmpty: matchedUsers.length === 0 };
            }
            // Scoped search
            let currentScopeUsers = users;
            if (activeLevel.type === 'department') {
                currentScopeUsers = users.filter(u => (u.department || 'Unassigned') === activeLevel.id);
            } else if (activeLevel.type === 'location') {
                const deptId = currentPath[1].id;
                currentScopeUsers = users.filter(u => (u.department || 'Unassigned') === deptId && (u.location || 'Unknown Location') === activeLevel.id);
            }
            const matchedUsers = currentScopeUsers.filter(u =>
                u.name.toLowerCase().includes(lowerQ) ||
                u.email.toLowerCase().includes(lowerQ)
            );
            return { content: { type: 'users', data: matchedUsers }, isEmpty: matchedUsers.length === 0 };
        }

        // 2. Browser Mode

        // Level 0: Root -> Show Departments
        if (activeLevel.type === 'root') {
            const deptNames = Array.from(new Set(users.map(u => u.department || 'Unassigned'))).sort();
            return { content: { type: 'folders', data: deptNames, nextType: 'department', icon: 'department' }, isEmpty: deptNames.length === 0 };
        }

        // Level 1: Department -> Show Locations
        if (activeLevel.type === 'department') {
            const deptName = activeLevel.id;
            const deptUsers = users.filter(u => (u.department || 'Unassigned') === deptName);
            const locations = Array.from(new Set(deptUsers.map(u => u.location || 'Unknown Location'))).sort();
            return { content: { type: 'folders', data: locations, nextType: 'location', icon: 'map-pin' }, isEmpty: locations.length === 0 };
        }

        // Level 2: Location -> Show Users
        if (activeLevel.type === 'location') {
            const deptName = currentPath[1].id;
            const locName = activeLevel.id;
            const locUsers = users.filter(u =>
                (u.department || 'Unassigned') === deptName &&
                (u.location || 'Unknown Location') === locName
            ).sort((a, b) => a.name.localeCompare(b.name));
            return { content: { type: 'users', data: locUsers }, isEmpty: locUsers.length === 0 };
        }

        return { content: { type: 'error', message: 'Unknown path' }, isEmpty: true };

    }, [currentPath, users, searchQuery, activeLevel]);

    const usersToPrint = users.filter(u => selectedUserIds.includes(u.id));

    // -- Render --

    return (
        <div className="flex h-full min-h-[80vh] w-full flex-col bg-muted/10">
            {/* Same Gradient as Files */}
            <svg width="0" height="0" className="absolute block w-0 h-0 overflow-hidden" aria-hidden="true">
                <defs>
                    <linearGradient id="folder-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4 flex-1">


                    <div className="flex items-center gap-1 text-sm overflow-hidden whitespace-nowrap mask-linear-fade">
                        {currentPath.map((item, idx) => (
                            <React.Fragment key={item.id + idx}>
                                {idx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-auto py-1 px-2 font-normal hover:bg-muted", idx === currentPath.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground")}
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
                    {/* ID Card Designer */}
                    {users.length > 0 && (
                        <IdCardDesignerDialog
                            sampleUser={users[0]}
                            company={companies.find(c => c.name === users[0].company) || companies[0]}
                        />
                    )}

                    {/* Print Button */}
                    <BulkIdCardPrintDialog users={usersToPrint} companies={companies}>
                        <Button
                            disabled={selectedUserIds.length === 0}
                            className={cn(
                                "rounded-full transition-all transform hover:scale-105 border-0 h-9",
                                selectedUserIds.length > 0
                                    ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md animate-gradient-xy bg-[length:200%_200%]"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            {selectedUserIds.length > 0 ? `Print (${selectedUserIds.length})` : 'Select Users'}
                        </Button>
                    </BulkIdCardPrintDialog>

                    <div className="relative w-full max-w-sm hidden sm:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            className="pl-9 rounded-full bg-muted/40 border-0 focus-visible:bg-background h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center bg-muted/40 rounded-lg p-1 h-9">
                        <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded-md" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded-md" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-auto p-6">
                {isEmpty && !searchQuery && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Folder className="h-16 w-16 mb-4 opacity-20" />
                        <p>No items found.</p>
                    </div>
                )}

                {/* View: Folders */}
                {(content as any).type === 'folders' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in zoom-in-95 duration-300">
                        {(content as any).data.map((folderName: string) => (
                            <Card
                                key={folderName}
                                className="cursor-pointer hover:border-purple-500 hover:shadow-lg hover:bg-purple-50/10 transition-all border-muted shadow-sm bg-card group relative overflow-hidden"
                                onClick={() => enterFolder(folderName, folderName, (content as any).nextType)}
                            >
                                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                                    <div className="group-hover:-translate-y-1 transition-transform duration-300">
                                        {(content as any).icon === 'department'
                                            ? <Building2 className="h-16 w-16 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} style={{ stroke: 'url(#folder-gradient)' }} />
                                            : <MapPin className="h-16 w-16 text-red-500 fill-red-500/20 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                                        }
                                    </div>
                                    <span className="font-medium text-center truncate w-full group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{folderName}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* View: Users (Selectable) */}
                {(content as any).type === 'users' && (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {(content as any).data.length} employees found
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleSelectAllInView((content as any).data)}>
                                {(content as any).data.every((u: User) => selectedUserIds.includes(u.id)) ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300">
                                {(content as any).data.map((u: User) => {
                                    const isSelected = selectedUserIds.includes(u.id);
                                    return (
                                        <Card
                                            key={u.id}
                                            className={cn(
                                                "group transition-all border-muted cursor-pointer relative",
                                                isSelected ? "border-purple-500 bg-purple-50/10 shadow-md" : "hover:shadow-lg"
                                            )}
                                            onClick={() => toggleUserSelection(u.id)}
                                        >
                                            <div className="absolute top-3 right-3 z-10 p-1 opacity-100 transition-opacity">
                                                <Checkbox checked={isSelected} />
                                            </div>
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <Image src={getAvatarSrc(u)} width={56} height={56} className="rounded-full object-cover border-2 border-muted" alt="" />
                                                    <div>
                                                        <p className="font-semibold text-lg">{u.name}</p>
                                                        <p className="text-sm text-muted-foreground">{u.role}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-sm text-muted-foreground flex flex-col gap-1">
                                                    <span className="truncate">{u.email}</span>
                                                    <span>{u.department}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-md border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={(content as any).data.length > 0 && (content as any).data.every((u: User) => selectedUserIds.includes(u.id))}
                                                    onCheckedChange={() => handleSelectAllInView((content as any).data)}
                                                />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(content as any).data.map((u: User) => (
                                            <TableRow
                                                key={u.id}
                                                className={cn("cursor-pointer", selectedUserIds.includes(u.id) && "bg-muted/50")}
                                                onClick={() => toggleUserSelection(u.id)}
                                            >
                                                <TableCell>
                                                    <Checkbox checked={selectedUserIds.includes(u.id)} />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Image src={getAvatarSrc(u)} width={32} height={32} className="rounded-full" alt="" />
                                                        {u.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>{u.department}</TableCell>
                                                <TableCell className="capitalize">{u.role}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
