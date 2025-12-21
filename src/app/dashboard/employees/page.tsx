'use client';
import React, { useState, useMemo, useEffect } from 'react';
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
    MoreVertical,
    Download,
    Upload,
    Edit,
    Trash2,
    KeyRound,
    FileLock2,
    Mail,
    Phone,
    UserPlus,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, getAvatarSrc } from '@/lib/utils';
import Image from 'next/image';
import { EmployeeManagementDialog } from '@/components/dashboard/employee-management-dialog';
import { DeleteEmployeeDialog } from '@/components/dashboard/delete-employee-dialog';
import { BulkUserImportDialog } from '@/components/dashboard/bulk-user-import-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

// --- Types & Constants ---
type ViewMode = 'grid' | 'list';
type PathType = 'root' | 'department' | 'location' | 'user_profile';
interface PathItem {
    id: string;
    name: string;
    type: PathType;
}

export default function EmployeeExplorerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const {
        users: serverUsers,
        companies,
        departments,
        mutateUsers
    } = useData();

    // -- State --
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentPath, setCurrentPath] = useState<PathItem[]>([
        { id: 'root', name: 'Departments', type: 'root' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');


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

    // -- Handlers --

    const handleEmployeeSave = async (data: any) => {
        try {
            const isEdit = !!data.id;
            const method = isEdit ? 'PATCH' : 'POST';
            const res = await fetch('/api/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save user');
            await mutateUsers();
            toast({ title: isEdit ? "Employee Updated" : "Employee Added" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error saving employee" });
        }
    };

    const handleEmployeeDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            await mutateUsers();
            toast({ title: "Employee Deleted" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error deleting employee" });
        }
    };

    const handleResetPassword = async (id: string) => {
        if (!confirm('Reset password to "12345678"?')) return;
        try {
            const res = await fetch(`/api/users?id=${id}&action=reset-password`, { method: 'PATCH' });
            if (!res.ok) throw new Error('Failed');
            toast({ title: "Password Reset Successful", description: "Temporary password: 12345678" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error resetting password" });
        }
    };

    const handleResetPin = async (id: string) => {
        if (!confirm('Reset PIN to "1234"?')) return;
        try {
            const res = await fetch(`/api/users?id=${id}&action=reset-pin`, { method: 'PATCH' });
            if (!res.ok) throw new Error('Failed');
            toast({ title: "PIN Reset Successful", description: "Temporary PIN: 1234" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error resetting PIN" });
        }
    };

    const handleExportUsers = () => {
        const csv = Papa.unparse(users.map(u => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Department: u.department,
            Location: u.location,
            Company: u.company,
            Status: u.status,
            Mobile: u.mobile
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkUserImport = async (data: any[]) => {
        try {
            const res = await fetch('/api/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: data }),
            });
            if (!res.ok) throw new Error('Failed');
            await mutateUsers();
            toast({ title: "Import Successful" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Import Failed" });
        }
    };

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
                    {/* Add Employee Button */}
                    <EmployeeManagementDialog departments={departments} companies={companies} onSave={handleEmployeeSave}>
                        <Button className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0 h-9">
                            <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                        </Button>
                    </EmployeeManagementDialog>

                    {/* Bulk Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportUsers}>
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </DropdownMenuItem>
                            <BulkUserImportDialog onImport={handleBulkUserImport}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Upload className="mr-2 h-4 w-4" /> Import CSV
                                </DropdownMenuItem>
                            </BulkUserImportDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>

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

                {/* View: Users */}
                {(content as any).type === 'users' && (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300">
                            {(content as any).data.map((u: User) => (
                                <Card key={u.id} className="group hover:shadow-lg transition-all border-muted">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <Image src={getAvatarSrc(u)} width={56} height={56} className="rounded-full object-cover border-2 border-muted" alt="" />
                                                <div>
                                                    <p className="font-semibold text-lg">{u.name}</p>
                                                    <p className="text-sm text-muted-foreground">{u.role}</p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <EmployeeManagementDialog employee={u} departments={departments} companies={companies} onSave={handleEmployeeSave}>
                                                        <DropdownMenuItem onSelect={e => e.preventDefault()}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                    </EmployeeManagementDialog>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleResetPassword(u.id)}><KeyRound className="mr-2 h-4 w-4" /> Reset Password</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleResetPin(u.id)}><FileLock2 className="mr-2 h-4 w-4" /> Reset PIN</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DeleteEmployeeDialog employee={u} onDelete={() => handleEmployeeDelete(u.id)}>
                                                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DeleteEmployeeDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> <span className="truncate">{u.email}</span></div>
                                            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> <span>{u.mobile || 'N/A'}</span></div>
                                            <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> <span>{u.department}</span></div>
                                            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>{u.location}</span></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(content as any).data.map((u: User) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Image src={getAvatarSrc(u)} width={32} height={32} className="rounded-full" alt="" />
                                                    {u.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.department}</TableCell>
                                            <TableCell className="capitalize">{u.role}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <EmployeeManagementDialog employee={u} departments={departments} companies={companies} onSave={handleEmployeeSave}>
                                                        <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                            <Edit className="mr-2 h-3 w-3" /> Edit
                                                        </Button>
                                                    </EmployeeManagementDialog>
                                                    <DeleteEmployeeDialog employee={u} onDelete={() => handleEmployeeDelete(u.id)}>
                                                        <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                            <Trash2 className="mr-2 h-3 w-3" /> Delete
                                                        </Button>
                                                    </DeleteEmployeeDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )
                )}
            </main>
        </div>
    );
}
