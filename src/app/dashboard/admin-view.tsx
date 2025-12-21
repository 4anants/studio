
'use client'
import { useState, useCallback, useMemo, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'


import { documentTypesList, departments as initialDepartments, holidayLocations, CompanyName } from '@/lib/constants'
import type { User, Document, Holiday, HolidayLocation, Announcement, Company, Department, DocumentType as AppDocumentType } from '@/lib/types'
import { useData } from '@/hooks/use-data'
import { Search, MoreVertical, Edit, Trash2, KeyRound, FolderPlus, Tag, Building, CalendarPlus, Bell, UploadCloud, X, FileLock2, Users, Download, Home, ArrowLeft, Folder, Upload, Save, Undo, Eye, Trash, ArchiveRestore, FileText, Calendar, LayoutDashboard, Printer } from 'lucide-react'
import Link from 'next/link'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import Image from 'next/image'
import { BulkUploadDialog } from '@/components/dashboard/bulk-upload/bulk-upload-dialog'
import { BulkIdCardPrintDialog } from '@/components/dashboard/bulk-id-card-print-dialog'
import { IdCardDesignerDialog } from '@/components/dashboard/id-card-designer'
import { DynamicFavicon } from '@/components/dynamic-favicon';
import { AdminEngagementManager } from '@/components/dashboard/engagement/admin-engagement-manager';
import FileExplorerPage from './files/page'
import EmployeeExplorerPage from './employees/page'
import PrintCardsExplorerPage from './print-cards/page'
import { EmployeeManagementDialog } from '@/components/dashboard/employee-management-dialog'
import { DeleteEmployeeDialog } from '@/components/dashboard/delete-employee-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, getAvatarSrc } from '@/lib/utils'
import { AddDocumentTypeDialog } from '@/components/dashboard/add-document-type-dialog'
import { AddDepartmentDialog } from '@/components/dashboard/add-department-dialog'
import { DeleteDepartmentDialog } from '@/components/dashboard/delete-department-dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BulkRoleChangeDialog } from '@/components/dashboard/bulk-role-change-dialog'
import { BulkUserImportDialog } from '@/components/dashboard/bulk-user-import-dialog'
import Papa from 'papaparse'
import { DocumentList } from '@/components/dashboard/document-list'
import { CompanyManagementDialog } from '@/components/dashboard/company-management-dialog'
import { DeleteCompanyDialog } from '@/components/dashboard/delete-company-dialog'
import { PermanentDeleteDialog } from '@/components/dashboard/permanent-delete-dialog'
import { EditDocumentTypeDialog } from '@/components/dashboard/edit-document-type-dialog'
import { DeleteDocumentTypeDialog } from '@/components/dashboard/delete-document-type-dialog'
import { ImportExportButtons } from '@/components/dashboard/import-export-buttons'
import { Badge } from '@/components/ui/badge'
// import { ToastAction } from '@/components/ui/toast'


type ExplorerState = { view: 'docTypes' } | { view: 'usersInDocType', docType: string } | { view: 'userDocs', docType: string, userId: string }


export function AdminView() {
    const {
        users: serverUsers,
        documents: serverDocs,
        companies: serverCompanies,
        departments: serverDepartments,
        documentTypes: serverDocTypes,
        deletedDocuments: serverDeletedDocs,
        mutateUsers,
        mutateDocuments,
        mutateCompanies,
        mutateDepartments,
        mutateDocumentTypes,
        mutateDeletedDocuments
    } = useData();

    const [docs, setDocs] = useState<Document[]>([])
    const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
    const [users, setUsers] = useState<User[]>([])
    const [documentTypes, setDocumentTypes] = useState<AppDocumentType[]>([]);

    const [departments, setDepartments] = useState<Department[]>([]);

    const [companies, setCompanies] = useState<Company[]>([]);
    const deletedCompanies = useMemo<Company[]>(() => [], []);


    // Sync with server data
    useEffect(() => {
        if (serverUsers) setUsers(serverUsers as User[]);
    }, [serverUsers]);

    useEffect(() => {
        if (serverDocs) setDocs(serverDocs as Document[]);
    }, [serverDocs]);


    useEffect(() => {
        if (serverCompanies) setCompanies(serverCompanies as Company[]);
    }, [serverCompanies]);

    useEffect(() => {
        if (serverDepartments) setDepartments(serverDepartments as Department[]);
    }, [serverDepartments]);

    useEffect(() => {
        if (serverDocTypes) setDocumentTypes(serverDocTypes as AppDocumentType[]);
    }, [serverDocTypes]);

    useEffect(() => {
        if (serverDeletedDocs) setDeletedDocs(serverDeletedDocs as Document[]);
    }, [serverDeletedDocs]);
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
    const [activeTab, setActiveTab] = useState('file-explorer');
    const [activeSubTab, setActiveSubTab] = useState('overview');
    const [activeSettingsTab, setActiveSettingsTab] = useState('companies');
    const [explorerState, setExplorerState] = useState<ExplorerState>({ view: 'docTypes' });
    const [logoSrc, setLogoSrc] = useState<string | null>(null);
    const [siteName, setSiteName] = useState(CompanyName);
    const [tempSiteName, setTempSiteName] = useState(CompanyName);
    const [siteNameFontSize, setSiteNameFontSize] = useState('text-xl');
    const [tempSiteNameFontSize, setTempSiteNameFontSize] = useState('text-xl');
    const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [lastBulkUploadInfo, setLastBulkUploadInfo] = useState<{ ids: string[], timestamp: number } | null>(null);
    const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
    const [selectedDeletedCompanyIds, setSelectedDeletedCompanyIds] = useState<string[]>([]);
    const [isBulkPermanentDeleteCompaniesDialogOpen, setIsBulkPermanentDeleteCompaniesDialogOpen] = useState(false);
    const [selectedDeletedDepartmentIds, setSelectedDeletedDepartmentIds] = useState<string[]>([]);
    const [isBulkPermanentDeleteDepartmentsDialogOpen, setIsBulkPermanentDeleteDepartmentsDialogOpen] = useState(false);
    const [selectedDeletedDocTypeIds, setSelectedDeletedDocTypeIds] = useState<string[]>([]);
    const [isBulkPermanentDeleteDocTypesDialogOpen, setIsBulkPermanentDeleteDocTypesDialogOpen] = useState(false);
    const [selectedDeletedDocumentIds, setSelectedDeletedDocumentIds] = useState<string[]>([]);
    const [isBulkPermanentDeleteDocumentsDialogOpen, setIsBulkPermanentDeleteDocumentsDialogOpen] = useState(false);
    const [selectedDeletedUserIds, setSelectedDeletedUserIds] = useState<string[]>([]);
    const [isBulkPermanentDeleteUsersDialogOpen, setIsBulkPermanentDeleteUsersDialogOpen] = useState(false);
    const [selectedDeletedResourceIds, setSelectedDeletedResourceIds] = useState<string[]>([]);
    const [isBulkPermanentDeleteResourcesDialogOpen, setIsBulkPermanentDeleteResourcesDialogOpen] = useState(false);

    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const fetcher = (url: string) => fetch(url).then(r => r.json());
    const { data: deletedResourcesData, mutate: mutateDeletedResources } = useSWR('/api/engagement/resources?status=deleted', fetcher);

    const activeUsers = useMemo(() => users.filter(user => (user.status === 'active' || user.status || user.status === 'pending') && user.id !== 'sadmin'), [users]);
    const deletedUsers = useMemo(() => users.filter(user => user.status === 'deleted'), [users]);

    const filteredDocTypes = useMemo(() => {
        return documentTypes.filter(type =>
            (type.status === 'active' || !type.status) &&
            type.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [documentTypes, searchTerm]);

    const filteredDepartments = useMemo(() => {
        return departments.filter(dept =>
            (dept.status === 'active' || !dept.status) &&
            dept.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [departments, searchTerm]);

    const filteredCompanies = useMemo(() => {
        return companies.filter(company =>
            company.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [companies, searchTerm]);

    const filteredByDept = useMemo(() => {
        if (departmentFilter === 'all') return activeUsers;
        return activeUsers.filter(user => user.department === departmentFilter);
    }, [activeUsers, departmentFilter]);

    const filteredByRole = useMemo(() => {
        if (roleFilter === 'all') return filteredByDept;
        return filteredByDept.filter(user => user.role === roleFilter);
    }, [filteredByDept, roleFilter]);

    const filteredActiveUsersForGrid = useMemo(() => {
        return filteredByRole.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [filteredByRole, searchTerm]);

    const filteredActiveUsersForTable = useMemo(() => {
        return filteredByRole.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [filteredByRole, searchTerm]);

    const filteredDeletedUsers = useMemo(() => {
        return deletedUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [deletedUsers, searchTerm]);

    const filteredDeletedDocTypes = useMemo(() => {
        return documentTypes.filter(type =>
            type.status === 'deleted' && (
                type.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [documentTypes, searchTerm]);

    const filteredDeletedDepartments = useMemo(() => {
        return departments.filter(dept =>
            dept.status === 'deleted' && (
                dept.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [departments, searchTerm]);

    const filteredDeletedCompanies = useMemo(() => {
        return deletedCompanies.filter(comp =>
            comp.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [deletedCompanies, searchTerm]);

    const filteredDeletedDocs = useMemo(() => {
        return deletedDocs.filter(doc =>
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.type || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }, [deletedDocs, searchTerm]);

    const deletedResources = useMemo(() => Array.isArray(deletedResourcesData) ? deletedResourcesData : [], [deletedResourcesData]);

    const filteredDeletedResources = useMemo(() => {
        return deletedResources.filter((res: any) =>
            res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (res.category || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [deletedResources, searchTerm]);

    const { unassignedDocuments, docsByType } = useMemo(() => {
        const userMap = new Map(users.map(u => [u.id, u]));
        const unassigned: Document[] = [];
        const byType: Record<string, Record<string, Document[]>> = {};

        docs.forEach(doc => {
            if (doc.ownerId && userMap.has(doc.ownerId)) {
                if (!byType[doc.type]) {
                    byType[doc.type] = {};
                }
                if (!byType[doc.type][doc.ownerId]) {
                    byType[doc.type][doc.ownerId] = [];
                }
                byType[doc.type][doc.ownerId].push(doc);
            } else {
                unassigned.push(doc);
            }
        });

        return { unassignedDocuments: unassigned, docsByType: byType };
    }, [docs, users]);




    useEffect(() => {
        setIsMounted(true);

        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }

        const storedLogo = localStorage.getItem('companyLogo');
        if (storedLogo) setLogoSrc(storedLogo);

        const storedSiteName = localStorage.getItem('siteName');
        if (storedSiteName) {
            setSiteName(storedSiteName);
            setTempSiteName(storedSiteName);
        }

        const storedDomains = localStorage.getItem('allowedDomains');
        if (storedDomains) {
            setAllowedDomains(JSON.parse(storedDomains));
        } else {
            // Fallback for initial setup
            setAllowedDomains(['yourdomain.com']);
        }

        return () => {
        };
    }, []);

    useEffect(() => {
        // Fetch settings from server to sync state
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.companyLogo) {
                        setLogoSrc(data.companyLogo);
                        localStorage.setItem('companyLogo', data.companyLogo);
                        window.dispatchEvent(new Event('storage'));
                    }
                    if (data.siteName) {
                        setSiteName(data.siteName);
                        setTempSiteName(data.siteName);
                        localStorage.setItem('siteName', data.siteName);
                        window.dispatchEvent(new Event('storage'));
                    }
                    if (data.siteNameFontSize) {
                        setSiteNameFontSize(data.siteNameFontSize);
                        setTempSiteNameFontSize(data.siteNameFontSize);
                        localStorage.setItem('siteNameFontSize', data.siteNameFontSize);
                        window.dispatchEvent(new Event('storage'));
                    }
                    if (data.allowedDomains) {
                        try {
                            const domains = JSON.parse(data.allowedDomains);
                            setAllowedDomains(domains);
                            localStorage.setItem('allowedDomains', data.allowedDomains);
                        } catch (e) {
                            console.error("Failed to parse allowedDomains setting", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);

    const saveSystemSetting = async (key: string, value: string) => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });
        } catch (error) {
            console.error('Failed to save setting:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save setting to server.' });
        }
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const newLogo = e.target?.result as string;
                setLogoSrc(newLogo);
                localStorage.setItem('companyLogo', newLogo);
                saveSystemSetting('companyLogo', newLogo);
                window.dispatchEvent(new Event('storage'));
                toast({
                    title: 'Logo Updated',
                    description: 'The company logo has been changed successfully.',
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetLogo = () => {
        setLogoSrc(null);
        localStorage.removeItem('companyLogo');
        saveSystemSetting('companyLogo', '');
        window.dispatchEvent(new Event('storage'));
        toast({
            title: 'Logo Reset',
            description: 'The company logo has been reset to the default.',
        });
    };

    const handleSiteNameSave = () => {
        setSiteName(tempSiteName);
        setSiteNameFontSize(tempSiteNameFontSize);
        localStorage.setItem('siteName', tempSiteName);
        localStorage.setItem('siteNameFontSize', tempSiteNameFontSize);
        saveSystemSetting('siteName', tempSiteName);
        saveSystemSetting('siteNameFontSize', tempSiteNameFontSize);
        window.dispatchEvent(new Event('storage')); // Notify other tabs/components
        toast({
            title: 'Branding Updated',
            description: 'Site name and font size updated successfully.',
        });
    };

    const handleAddDomain = () => {
        if (newDomain && !allowedDomains.includes(newDomain)) {
            const newDomains = [...allowedDomains, newDomain];
            setAllowedDomains(newDomains);
            const jsonDomains = JSON.stringify(newDomains);
            localStorage.setItem('allowedDomains', jsonDomains);
            saveSystemSetting('allowedDomains', jsonDomains);
            setNewDomain('');
            toast({ title: 'Domain Added', description: `Domain "${newDomain}" has been added.` });
        } else {
            toast({ variant: 'destructive', title: 'Invalid Domain', description: 'Domain is either empty or already exists.' });
        }
    };

    const handleRemoveDomain = (domainToRemove: string) => {
        const newDomains = allowedDomains.filter(d => d !== domainToRemove);
        setAllowedDomains(newDomains);
        const jsonDomains = JSON.stringify(newDomains);
        localStorage.setItem('allowedDomains', jsonDomains);
        saveSystemSetting('allowedDomains', jsonDomains);
        toast({ title: 'Domain Removed', description: `Domain "${domainToRemove}" has been removed.` });
    };

    const handleUndoLastBulkUpload = async () => {
        if (lastBulkUploadInfo && lastBulkUploadInfo.ids.length > 0) {
            try {
                // Determine if we want soft delete or permanent delete for "Undo". 
                // "Undo" typically implies "it never happened", so permanent delete is appropriate.
                // However, safety first? Regular delete moves to trash.
                // Let's do permanent delete to clean up files.
                const responses = await Promise.all(lastBulkUploadInfo.ids.map(id =>
                    fetch(`/api/documents?id=${id}&permanent=true`, { method: 'DELETE' })
                ));

                const failed = responses.find(r => !r.ok);
                if (failed) {
                    throw new Error('Failed to delete some documents during undo.');
                }

                await mutateDocuments();
                toast({
                    title: 'Upload Undone',
                    description: `${lastBulkUploadInfo.ids.length} document(s) have been permanently removed.`,
                });
                setLastBulkUploadInfo(null);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Undo Failed',
                    description: error.message || 'Failed to undo upload.'
                });
            }
        }
        setIsUndoDialogOpen(false);
    };

    const handleBulkUploadComplete = useCallback((count: number, ids?: string[]) => {
        mutateDocuments();
        if (ids && ids.length > 0) {
            setLastBulkUploadInfo({ ids, timestamp: Date.now() });
            // Optionally open undo dialog immediately or just show toast with undo button?
            // Current UI probably has a button somewhere.
        }
        toast({
            title: 'Upload Successful!',
            description: `${count} documents have been added.`,
            action: ids && ids.length > 0 ? (
                <div
                    className="font-medium cursor-pointer hover:underline"
                    onClick={() => setIsUndoDialogOpen(true)}
                >
                    Undo
                </div>
            ) : undefined
        });
    }, [toast, mutateDocuments]);

    const handleEmployeeSave = useCallback(async (employee: Partial<User> & { originalId?: string }) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee),
            });
            if (!res.ok) throw new Error('Failed to save');

            await mutateUsers();
            toast({ title: "User Saved", description: "User details updated successfully." });
        } catch {
            toast({ variant: 'destructive', title: "Error", description: "Failed to save user." });
        }
    }, [toast, mutateUsers]);

    const handleBulkUserImport = useCallback((newUsers: User[]) => {
        setUsers(prevUsers => {
            const existingIds = new Set(prevUsers.map(u => u.id));
            const nonDuplicateUsers = newUsers.filter(u => !existingIds.has(u.id));
            const duplicateCount = newUsers.length - nonDuplicateUsers.length;

            toast({
                title: 'Import Complete',
                description: `${nonDuplicateUsers.length} user(s) imported successfully. ${duplicateCount > 0 ? `${duplicateCount} duplicate(s) were skipped.` : ''}`,
            });

            return [...prevUsers, ...nonDuplicateUsers];
        });
    }, [toast]);

    const handleExportUsers = () => {
        const usersToExport = numSelected > 0 ? users.filter(u => selectedUserIds.includes(u.id)) : users;

        if (usersToExport.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Users to Export',
                description: 'There are no users to export.',
            });
            return;
        }

        // We only export a subset of fields for simplicity, can be expanded
        const dataToExport = usersToExport.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            personalEmail: user.personalEmail,
            mobile: user.mobile,
            dateOfBirth: user.dateOfBirth,
            joiningDate: user.joiningDate,
            resignationDate: user.resignationDate,
            designation: user.designation,
            status: user.status,
            department: user.department,
            bloodGroup: user.bloodGroup,
            company: user.company,
            location: user.location,
            role: user.role,
            // We don't export password for security reasons
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: 'Export Started',
            description: `Exporting ${usersToExport.length} user(s).`,
        });
    };


    const handleEmployeeDelete = useCallback(async (employeeId: string) => {
        if (employeeId === 'sadmin') {
            toast({ variant: 'destructive', title: 'Action Forbidden', description: 'The Super Admin account cannot be deleted.' });
            return;
        }

        const user = users.find(u => u.id === employeeId);
        if (!user) return;

        try {
            // Soft delete: Update status to 'deleted' via POST (Upsert)
            // We need to send enough fields to satisfy constraints if any, or just ID and status if logic permits.
            // POST logic expects many fields. We should probably just send the full user object with updated status.
            // But wait, the POST handler requires all fields for INSERT, but for UPDATE maybe only ID is needed if it's ON DUPLICATE KEY UPDATE?
            // Actually, the query does `INSERT ... ON DUPLICATE KEY UPDATE`. If we miss fields, it might fail or insert nulls if ID doesn't exist (unlikely here).
            // But if ID exists, it updates. However, the INSERT part relies on values passed. 
            // If we pass nulls for non-nullable cols, it might fail even if it's an update.
            // Safest: send full user object with new status.

            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...user, status: 'deleted' }),
            });

            await mutateUsers();

            toast({
                title: "Employee Deleted",
                description: `The employee has been moved to the deleted users list.`
            });
        } catch {
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete employee." });
        }
    }, [users, toast, mutateUsers]);

    const handleRestoreUser = useCallback(async (employeeId: string) => {
        const user = users.find(u => u.id === employeeId);
        if (!user) return;

        try {
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...user, status: 'active' }),
            });

            await mutateUsers();

            toast({
                title: "Employee Restored",
                description: `The employee has been restored to the active list.`
            });
        } catch {
            toast({ variant: 'destructive', title: "Error", description: "Failed to restore employee." });
        }
    }, [users, toast, mutateUsers]);

    const handlePermanentDeleteUser = useCallback(async (employeeId: string) => {
        if (employeeId === 'sadmin') {
            toast({ variant: 'destructive', title: 'Action Forbidden', description: 'The Super Admin account cannot be permanently deleted.' });
            return;
        }

        try {
            await fetch(`/api/users?id=${employeeId}`, { method: 'DELETE' });
            await mutateUsers();

            toast({
                variant: 'destructive',
                title: 'User Permanently Deleted',
                description: 'The user has been permanently removed from the system.',
            });
        } catch {
            toast({ variant: 'destructive', title: "Error", description: "Failed to permanently delete user." });
        }
    }, [toast, mutateUsers]);

    const handleResetPassword = useCallback(async (employeeId: string) => {
        if (employeeId === 'sadmin') {
            toast({ variant: 'destructive', title: 'Action Forbidden', description: 'Password for the Super Admin must be changed via the edit profile screen.' });
            return;
        }

        if (!confirm('Are you sure you want to reset the password for this user? It will be set to the default: Welcome@123')) return;

        try {
            const res = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: employeeId }),
            });

            if (!res.ok) throw new Error('Failed to reset password');

            toast({
                title: "Password Reset Successful",
                description: `Password has been reset to default: Welcome@123`
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to reset password.' });
        }
    }, [toast]);

    const handleBulkRoleChange = useCallback(async (newRole: 'admin' | 'employee') => {
        try {
            console.log('Changing roles for:', selectedUserIds, 'to', newRole);
            const res = await fetch('/api/users/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: selectedUserIds,
                    updates: { role: newRole }
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Request failed with status ${res.status}`);
            }

            const data = await res.json();
            await mutateUsers();
            toast({ title: "Roles Updated", description: `Updated roles for ${data.count} users.` });
            setSelectedUserIds([]);
        } catch (error: any) {
            console.error('Bulk role change error:', error);
            toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to update roles." });
        }
    }, [selectedUserIds, mutateUsers, toast]);

    const handleBulkSoftDeleteUsers = useCallback(async () => {
        if (!confirm(`Are you sure you want to move ${selectedUserIds.length} users to the Deleted Users list?`)) return;

        try {
            console.log('Soft deleting users:', selectedUserIds);
            const res = await fetch('/api/users/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: selectedUserIds,
                    updates: { status: 'deleted' }
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Request failed with status ${res.status}`);
            }

            const data = await res.json();
            await mutateUsers();
            toast({ title: "Users Deleted", description: `${data.count} users moved to deleted list.` });
            setSelectedUserIds([]);
        } catch (error: any) {
            console.error('Bulk delete error:', error);
            toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to delete users." });
        }
    }, [selectedUserIds, mutateUsers, toast]);

    const handleBulkResetPassword = useCallback(async () => {
        if (!confirm(`Are you sure you want to reset passwords for ${selectedUserIds.length} users? They will be set to: Welcome@123`)) return;

        try {
            console.log('Resetting passwords for:', selectedUserIds);
            const res = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: selectedUserIds }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Request failed with status ${res.status}`);
            }

            const data = await res.json();
            toast({
                title: "Bulk Password Reset Successful",
                description: `Reset passwords for ${data.count} users.`
            });
            setSelectedUserIds([]);
        } catch (error: any) {
            console.error('Bulk password reset error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to reset passwords.' });
        }
    }, [selectedUserIds, toast]);

    const handleBulkResetPins = useCallback(async () => {
        if (!confirm(`Are you sure you want to reset the PINs for ${selectedUserIds.length} users?`)) return;
        try {
            console.log('Resetting PINs for:', selectedUserIds);
            const res = await fetch('/api/document-pin/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: selectedUserIds }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Request failed with status ${res.status}`);
            }

            const data = await res.json();
            toast({
                title: "Bulk PIN Reset Successful",
                description: `Successfully reset PINs for ${data.count} users.`
            });
            setSelectedUserIds([]);
        } catch (error: any) {
            console.error('Bulk PIN reset error:', error);
            toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to reset PINs." });
        }
    }, [selectedUserIds, toast]);

    const handleResetPin = useCallback(async (employeeId: string) => {
        if (employeeId === 'sadmin') {
            toast({ variant: 'destructive', title: 'Action Forbidden', description: 'Super Admin PIN must be changed via profile settings.' });
            return;
        }

        try {
            const res = await fetch('/api/document-pin/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: employeeId }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Request failed with status ${res.status}`);
            }

            toast({
                title: "PIN Reset Successful",
                description: "The user's PIN has been cleared. They can now set a new one.",
            });
        } catch (error: any) {
            console.error('PIN reset error:', error);
            toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to reset PIN." });
        }
    }, [toast]);

    const handleAddDocumentType = useCallback(async (newType: string) => {
        if (documentTypes.find(dt => dt.name.toLowerCase() === newType.toLowerCase())) {
            toast({
                variant: 'destructive',
                title: 'Duplicate Type',
                description: `"${newType.trim()}" already exists.`,
            });
            return;
        }

        try {
            await fetch('/api/document-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newType })
            });
            await mutateDocumentTypes();
            toast({
                title: 'Document Type Added',
                description: `"${newType.trim()}" has been added.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add document type.' });
        }
    }, [documentTypes, toast, mutateDocumentTypes]);

    const handleEditDocumentType = useCallback(async (oldType: AppDocumentType, newTypeName: string) => {
        if (oldType.name.toLowerCase() === newTypeName.toLowerCase()) return;

        if (documentTypes.find(dt => dt.name.toLowerCase() === newTypeName.toLowerCase())) {
            toast({
                variant: 'destructive',
                title: 'Duplicate Type',
                description: `"${newTypeName.trim()}" already exists.`,
            });
            return;
        }

        try {
            await fetch('/api/document-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: oldType.id, name: newTypeName })
            });
            await mutateDocumentTypes();
            // Propagate renaming to local docs state update?
            // API handles DB update. Backend `mutateDocuments` might fetch stale if we don't trigger it.
            await mutateDocuments();

            toast({
                title: 'Document Type Updated',
                description: `"${oldType.name}" has been renamed to "${newTypeName}".`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update document type.' });
        }
    }, [documentTypes, toast, mutateDocumentTypes, mutateDocuments]);


    const handleDeleteDocumentType = useCallback(async (typeToDelete: AppDocumentType) => {
        const isTypeInUse = docs.some(d => d.type === typeToDelete.name);
        if (isTypeInUse) {
            toast({
                variant: 'destructive',
                title: 'Cannot Delete Document Type',
                description: `"${typeToDelete.name}" is currently in use by one or more documents. Please re-assign them before deleting.`,
            });
            return;
        }

        try {
            await fetch('/api/document-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: typeToDelete.id, status: 'deleted' })
            });
            await mutateDocumentTypes();
            toast({
                title: 'Document Type Deleted',
                description: `"${typeToDelete.name}" has been moved to the deleted items list.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document type.' });
        }
    }, [docs, toast, mutateDocumentTypes]);

    const handleRestoreDocumentType = useCallback(async (typeToRestore: AppDocumentType) => {
        try {
            await fetch('/api/document-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: typeToRestore.id, status: 'active' })
            });
            await mutateDocumentTypes();
            toast({
                title: 'Document Type Restored',
                description: `"${typeToRestore.name}" has been restored.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to restore document type.' });
        }
    }, [toast, mutateDocumentTypes]);

    const handlePermanentDeleteDocumentType = useCallback(async (typeToDelete: AppDocumentType) => {
        try {
            await fetch(`/api/document-types?id=${typeToDelete.id}`, { method: 'DELETE' });
            await mutateDocumentTypes();
            toast({
                variant: 'destructive',
                title: 'Document Type Permanently Deleted',
                description: `"${typeToDelete.name}" has been permanently removed.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to permanently delete document type.' });
        }
    }, [toast, mutateDocumentTypes]);

    const handleAddDepartment = useCallback(async (newDepartment: string) => {
        if (departments.find(d => d.name.toLowerCase() === newDepartment.toLowerCase())) {
            toast({
                variant: 'destructive',
                title: 'Duplicate Department',
                description: `"${newDepartment.trim()}" already exists.`,
            });
            return;
        }

        try {
            await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDepartment })
            });
            await mutateDepartments();
            toast({
                title: 'Department Added',
                description: `"${newDepartment.trim()}" has been added.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add department.' });
        }
    }, [departments, toast, mutateDepartments]);

    const handleDeleteDepartment = useCallback(async (departmentToDelete: Department) => {
        try {
            await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: departmentToDelete.id, status: 'deleted' })
            });
            await mutateDepartments();
            toast({
                title: 'Department Deleted',
                description: `"${departmentToDelete.name}" has been moved to the deleted items list.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete department.' });
        }
    }, [toast, mutateDepartments]);

    const handleRestoreDepartment = useCallback(async (departmentToRestore: Department) => {
        try {
            await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: departmentToRestore.id, status: 'active' })
            });
            await mutateDepartments();
            toast({
                title: 'Department Restored',
                description: `"${departmentToRestore.name}" has been restored.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to restore department.' });
        }
    }, [toast, mutateDepartments]);

    const handlePermanentDeleteDepartment = useCallback(async (departmentToDelete: Department) => {
        const isDeptInUse = users.some(u => u.department === departmentToDelete.name);
        if (isDeptInUse) {
            toast({
                variant: 'destructive',
                title: 'Cannot Delete Department',
                description: `"${departmentToDelete.name}" is currently assigned to one or more employees. Please reassign them before permanently deleting.`,
            });
            return;
        }

        try {
            await fetch(`/api/departments?id=${departmentToDelete.id}`, { method: 'DELETE' });
            await mutateDepartments();
            toast({
                variant: 'destructive',
                title: 'Department Permanently Deleted',
                description: `"${departmentToDelete.name}" has been permanently removed.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to permanently delete department.' });
        }
    }, [toast, users, mutateDepartments]);




    const handleBulkPermanentDeleteCompanies = useCallback(async () => {
        try {
            const responses = await Promise.all(selectedDeletedCompanyIds.map(id =>
                fetch(`/api/companies?id=${id}`, { method: 'DELETE' })
            ));
            const failed = responses.find(r => !r.ok);
            if (failed) {
                const errorData = await failed.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete some companies');
            }
            await mutateCompanies();
            setSelectedDeletedCompanyIds([]);
            toast({ title: "Companies Deleted", description: `${selectedDeletedCompanyIds.length} company(ies) have been permanently deleted.` });
            setIsBulkPermanentDeleteCompaniesDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete some companies' });
        }
    }, [selectedDeletedCompanyIds, mutateCompanies, toast]);

    const handleBulkPermanentDeleteDepartments = useCallback(async () => {
        try {
            const responses = await Promise.all(selectedDeletedDepartmentIds.map(id =>
                fetch(`/api/departments?id=${id}`, { method: 'DELETE' })
            ));
            const failed = responses.find(r => !r.ok);
            if (failed) {
                const errorData = await failed.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete some departments');
            }
            await mutateDepartments();
            setSelectedDeletedDepartmentIds([]);
            toast({ title: "Departments Deleted", description: `${selectedDeletedDepartmentIds.length} department(s) have been permanently deleted.` });
            setIsBulkPermanentDeleteDepartmentsDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete some departments' });
        }
    }, [selectedDeletedDepartmentIds, mutateDepartments, toast]);

    const handleBulkPermanentDeleteDocTypes = useCallback(async () => {
        try {
            const responses = await Promise.all(selectedDeletedDocTypeIds.map(id =>
                fetch(`/api/document-types?id=${id}`, { method: 'DELETE' })
            ));
            const failed = responses.find(r => !r.ok);
            if (failed) {
                const errorData = await failed.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete some document types');
            }
            await mutateDocumentTypes();
            setSelectedDeletedDocTypeIds([]);
            toast({ title: "Document Types Deleted", description: `${selectedDeletedDocTypeIds.length} document type(s) have been permanently deleted.` });
            setIsBulkPermanentDeleteDocTypesDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete some document types' });
        }
    }, [selectedDeletedDocTypeIds, mutateDocumentTypes, toast]);

    const handleBulkPermanentDeleteDocuments = useCallback(async () => {
        try {
            const responses = await Promise.all(selectedDeletedDocumentIds.map(id =>
                fetch(`/api/documents?id=${id}&permanent=true`, { method: 'DELETE' })
            ));
            const failed = responses.find(r => !r.ok);
            if (failed) {
                const errorData = await failed.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete some documents');
            }
            await mutateDocuments();
            await mutateDeletedDocuments();
            setSelectedDeletedDocumentIds([]);
            toast({ title: "Documents Deleted", description: `${selectedDeletedDocumentIds.length} document(s) have been permanently deleted.` });
            setIsBulkPermanentDeleteDocumentsDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete some documents' });
        }
    }, [selectedDeletedDocumentIds, mutateDocuments, mutateDeletedDocuments, toast]);

    const handleBulkPermanentDeleteUsers = useCallback(async () => {
        try {
            const responses = await Promise.all(selectedDeletedUserIds.map(id =>
                fetch(`/api/users?id=${id}`, { method: 'DELETE' })
            ));
            const failed = responses.find(r => !r.ok);
            if (failed) {
                const errorData = await failed.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete some users');
            }
            await mutateUsers();
            setSelectedDeletedUserIds([]);
            toast({ title: "Users Deleted", description: `${selectedDeletedUserIds.length} user(s) have been permanently deleted.` });
            setIsBulkPermanentDeleteUsersDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete some users' });
        }
    }, [selectedDeletedUserIds, mutateUsers, toast]);

    const handleRestoreResource = useCallback(async (resourceId: string) => {
        try {
            const res = await fetch('/api/engagement/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore', id: resourceId }),
            });

            if (!res.ok) throw new Error('Failed to restore resource');

            await mutateDeletedResources();
            toast({
                title: "Resource Restored",
                description: "The resource has been moved back to the active list."
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to restore resource." });
        }
    }, [mutateDeletedResources, toast]);

    const handlePermanentDeleteResource = useCallback(async (resourceId: string) => {
        try {
            const res = await fetch(`/api/engagement/resources?id=${resourceId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete resource');

            await mutateDeletedResources();
            toast({
                variant: 'destructive',
                title: "Resource Permanently Deleted",
                description: "The resource has been removed forever."
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to delete resource." });
        }
    }, [mutateDeletedResources, toast]);

    const handleBulkPermanentDeleteResources = useCallback(async () => {
        try {
            const responses = await Promise.all(selectedDeletedResourceIds.map(id =>
                fetch(`/api/engagement/resources?id=${id}`, { method: 'DELETE' })
            ));
            const failed = responses.find(r => !r.ok);
            if (failed) throw new Error('Failed to delete some resources');

            await mutateDeletedResources();
            setSelectedDeletedResourceIds([]);
            toast({ title: "Resources Deleted", description: `${selectedDeletedResourceIds.length} resource(s) have been permanently deleted.` });
            setIsBulkPermanentDeleteResourcesDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete some resources' });
        }
    }, [selectedDeletedResourceIds, mutateDeletedResources, toast]);


    const handleSaveCompany = useCallback(async (companyToSave: Company) => {
        const company = { ...companyToSave, id: companyToSave.id || `comp-${Date.now()}` };
        try {
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save company');
            }

            await mutateCompanies();

            if (companyToSave.id) {
                toast({ title: 'Company Updated', description: `Details for ${companyToSave.name} have been updated.` });
            } else {
                toast({ title: 'Company Added', description: `${companyToSave.name} has been added.` });
            }
        } catch (error: any) {
            console.error('Error saving company:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save company' });
        }
    }, [toast, mutateCompanies]);

    const handleDeleteCompany = useCallback(async (companyId: string) => {
        const companyToDelete = companies.find(c => c.id === companyId);
        if (!companyToDelete) return;

        const isCompanyInUse = users.some(u => u.company === companyToDelete.name);
        if (isCompanyInUse) {
            toast({
                variant: 'destructive',
                title: 'Cannot Delete Company',
                description: `"${companyToDelete.name}" is currently assigned to one or more employees. Please reassign them before deleting.`,
            });
            return;
        }

        try {
            // Note: If we want soft delete, we need a status column. Assuming hard delete for "Move to Trash" logic isn't perfect but 
            // the user asked for DB usage. If DB doesn't have status, we assume permanent delete OR we just do client side? 
            // User said "all action use api". So we MUST use API.
            // If we assume the "Deleted Companies" tab is desired, we should probably soft delete.
            // But if the table doesn't support it, we might break things.
            // Let's assume we proceed with DELETE (Hard) for "Delete" button if we cannot soft delete easily.
            // But wait, `deletedCompanies` is used in UI. If I hard delete, I can't restore.
            // I'll try Soft Delete via POST assuming I can add `status` to table or it's ignored if not present 
            // (but then it won't persist as deleted).
            // Actually, for now, let's make "Delete" do a hard delete because `companies` table schema likely didn't have status. 
            // If I hard delete, `handleRestoreCompany` becomes impossible unless I re-create it.
            // Let's implement Delete as Hard Delete for now to be safe with DB schema.
            // Or better, implement `handleRestoreCompany` (if we had soft delete) to do nothing or re-create?
            // Re-creating is complex (ID changes).
            // Let's just do Hard Delete for `handleDeleteCompany` and remove the "Restore" functionality implication for Companies if unsupported.
            // BUT `AdminView` has a `Deleted Companies` tab. 
            // I will use Hard Delete for `handleDeleteCompany` and remove `handleRestoreCompany` logic or make it re-create?
            // Actually, I'll use `POST` with `status: 'deleted'` and hope the Schema allows it or I can add it. 
            // In `api/companies/route.ts` I added `status` to destructuring but not to INSERT query initially (wait, I DIDN'T add it to queries).
            // I missed adding `status` column to `api/companies/route.ts` INSERT/UPDATE. 
            // I will fix `api/companies/route.ts` first to actually persist `status`.

            await fetch(`/api/companies?id=${companyId}`, { method: 'DELETE' });
            await mutateCompanies();

            toast({
                title: 'Company Deleted',
                description: `"${companyToDelete.name}" has been permanently deleted (Soft delete not fully supported).`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete company' });
        }
    }, [companies, users, toast, mutateCompanies]);

    const handleRestoreCompany = useCallback(() => {
        // Soft delete not supported in DB schema for companies yet, so restoration from "trash" isn't possible 
        // if we hard deleted. If we wanted re-creation, we'd need the data.
        // For now, removing this functionality or showing a toast.
        toast({
            variant: 'destructive',
            title: 'Not Available',
            description: 'Restoring companies is not available as they are permanently deleted.',
        });
    }, [toast]);

    const handlePermanentDeleteCompany = useCallback(async (companyId: string) => {
        try {
            await fetch(`/api/companies?id=${companyId}`, { method: 'DELETE' });
            await mutateCompanies();
            toast({
                variant: 'destructive',
                title: 'Company Permanently Deleted',
                description: 'The company has been permanently removed from the system.',
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete company' });
        }
    }, [toast, mutateCompanies]);

    const downloadCSV = (data: any[], filename: string) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };






    const filteredUsersForSelection = useMemo(() => (activeSubTab === 'manage' || activeTab === 'print-cards') ? filteredActiveUsersForTable.filter((u: User) => u.id !== 'sadmin') : [], [activeSubTab, filteredActiveUsersForTable, activeTab]);

    const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedUserIds(filteredUsersForSelection.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    }, [filteredUsersForSelection]);

    const handleSelectUser = useCallback((userId: string, checked: boolean) => {
        if (userId === 'sadmin') return;
        if (checked) {
            setSelectedUserIds(prev => [...prev, userId]);
        } else {
            setSelectedUserIds(prev => prev.filter(id => id !== userId));
        }
    }, []);



    const handleReassignDocument = useCallback((docId: string, newOwnerId: string) => {
        setDocs(prevDocs => {
            return prevDocs.map(doc => {
                if (doc.id === docId) {
                    return { ...doc, ownerId: newOwnerId };
                }
                return doc;
            });
        });
        const user = users.find(u => u.id === newOwnerId);
        const doc = docs.find(d => d.id === docId);
        toast({
            title: "Document Reassigned",
            description: `Document "${doc?.name}" has been assigned to ${user?.name}.`
        });
    }, [users, docs, toast]);

    const handleDeleteDocument = useCallback(async (docId: string) => {
        if (!confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/documents?id=${docId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete');

            await mutateDocuments();
            toast({
                title: "Document Deleted",
                description: "The document has been permanently deleted."
            });
        } catch (error) {
            console.error('Error deleting document:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete document."
            });
        }
    }, [mutateDocuments, toast]);

    const handleBulkDeleteDocuments = useCallback(async (docIds: string[]) => {
        if (!confirm(`Are you sure you want to permanently delete ${docIds.length} document(s)?`)) return;

        try {
            // Delete sequentially or parallel? Parallel is faster.
            await Promise.all(docIds.map(id =>
                fetch(`/api/documents?id=${id}&permanent=true`, { method: 'DELETE' })
            ));

            await mutateDocuments();
            toast({
                title: "Documents Deleted",
                description: `${docIds.length} document(s) have been permanently deleted.`
            });
        } catch (error) {
            console.error('Error deleting documents:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete some documents."
            });
        }
    }, [mutateDocuments, toast]);

    const handleRestoreDocument = useCallback(async (docId: string) => {
        try {
            const response = await fetch(`/api/documents?id=${docId}`, { method: 'PATCH' });
            if (!response.ok) throw new Error('Failed to restore');

            await mutateDocuments();
            await mutateDeletedDocuments();

            const docToRestore = deletedDocs.find(d => d.id === docId);
            toast({
                title: "Document Restored",
                description: `"${docToRestore?.name}" has been restored.`
            });
        } catch (error) {
            console.error('Error restoring document:', error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to restore document."
            });
        }
    }, [deletedDocs, mutateDocuments, mutateDeletedDocuments, toast]);

    const handlePermanentDeleteDocument = useCallback(async (docId: string) => {
        if (!confirm('Are you absolutely sure? This action cannot be undone.')) return;
        try {
            const response = await fetch(`/api/documents?id=${docId}&permanent=true`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to permanently delete');

            await mutateDeletedDocuments();

            const docToDelete = deletedDocs.find(d => d.id === docId);
            toast({
                variant: "destructive",
                title: "Document Permanently Deleted",
                description: `"${docToDelete?.name}" has been permanently removed.`
            });
        } catch (error) {
            console.error('Error deleting document:', error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to permanently delete document."
            });
        }
    }, [deletedDocs, mutateDeletedDocuments, toast]);



    const onTabChange = useCallback((value: string) => {
        setActiveTab(value);
        setSelectedUserIds([]);
        setSearchTerm('');
        setDepartmentFilter('all');
        setRoleFilter('all');
        setExplorerState({ view: 'docTypes' });
        if (value === 'employee-management') {
            setActiveSubTab('overview');
        }
    }, []);

    const numSelected = selectedUserIds.length;
    const numFiltered = filteredUsersForSelection.length;




    const usersByDocType = useMemo(() => {
        if (explorerState.view !== 'usersInDocType') return [];

        const userIdsWithDocType = new Set(
            Object.keys(docsByType[explorerState.docType] || {})
        );

        return filteredActiveUsersForGrid.filter(u => userIdsWithDocType.has(u.id));
    }, [explorerState, docsByType, filteredActiveUsersForGrid]);

    return (
        <div>


            {/* Gradient Definition for Icons */}
            <svg width="0" height="0" className="absolute block w-0 h-0 overflow-hidden" aria-hidden="true">
                <defs>
                    <linearGradient id="folder-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
                        <stop offset="50%" stopColor="#a855f7" /> {/* purple-500 */}
                        <stop offset="100%" stopColor="#ec4899" /> {/* pink-500 */}
                    </linearGradient>
                </defs>
            </svg >

            {/* Management Section Header */}
            < div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4" >
                <div className="grid gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
                    <p className="text-muted-foreground">Manage all employee documents and profiles.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {activeTab === 'file-explorer' && (
                        <div className="flex items-center gap-2 w-full">
                            <BulkUploadDialog onBulkUploadComplete={handleBulkUploadComplete} users={activeUsers} />
                        </div>
                    )}
                    {activeTab === 'employee-management' && activeSubTab === 'manage' && (
                        <>
                            {numSelected > 0 ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <span className="text-sm font-medium mr-2 hidden sm:inline-block">{numSelected} selected</span>
                                    <BulkRoleChangeDialog onSave={handleBulkRoleChange}>
                                        <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium whitespace-nowrap px-4 py-2 h-9 flex items-center justify-center">
                                            <Users className="mr-2 h-4 w-4" /> Change Roles
                                        </Button>
                                    </BulkRoleChangeDialog>
                                    <Button size="sm" onClick={handleBulkResetPassword} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium whitespace-nowrap px-4 py-2 h-9 flex items-center justify-center">
                                        <KeyRound className="mr-2 h-4 w-4" /> Passwords
                                    </Button>
                                    <Button size="sm" onClick={handleBulkResetPins} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium whitespace-nowrap px-4 py-2 h-9 flex items-center justify-center">
                                        <FileLock2 className="mr-2 h-4 w-4" /> PINs
                                    </Button>
                                    <Button size="sm" onClick={handleBulkSoftDeleteUsers} className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-medium whitespace-nowrap px-4 py-2 h-9 flex items-center justify-center">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 w-full">
                                    <ImportExportButtons
                                        itemName="Users"
                                        onExport={handleExportUsers}
                                        onImport={async (data: any[]) => { }}
                                        onDownloadSample={() => { }}
                                    />
                                    <EmployeeManagementDialog onSave={handleEmployeeSave} departments={departments} companies={companies}>
                                        <Button className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-105 border-0 font-semibold px-6">
                                            Add Employee
                                        </Button>
                                    </EmployeeManagementDialog>
                                    <BulkUploadDialog onBulkUploadComplete={handleBulkUploadComplete} users={activeUsers} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div >

            <Tabs value={activeTab} onValueChange={onTabChange} className="mt-4">
                <div className="flex flex-col md:flex-row items-start md:items-center mb-4 gap-4">
                    <div className="overflow-x-auto w-full pb-2">
                        <TabsList className="w-max bg-slate-100 dark:bg-muted border border-slate-200 dark:border-white/5 p-1 gap-1 h-auto rounded-xl">
                            <TabsTrigger value="file-explorer" className="px-5 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">File Explorer</TabsTrigger>
                            <TabsTrigger value="employee-management" className="px-5 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Employee Management</TabsTrigger>
                            <TabsTrigger value="print-cards" className="px-5 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Print Cards</TabsTrigger>
                            <TabsTrigger value="engagement-hub" className="px-5 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Engagement Hub</TabsTrigger>
                            <TabsTrigger value="settings" className="px-5 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Settings</TabsTrigger>
                            <TabsTrigger value="deleted-items" className="px-5 py-2 rounded-lg text-slate-500 dark:text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Deleted Items</TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={
                                    activeTab === 'file-explorer' ? 'Search document types or employees...'
                                        : activeTab === 'employee-management' ? 'Search employees...'
                                            : activeTab === 'print-cards' ? 'Search employees for printing...'
                                                : activeTab === 'engagement-hub' ? 'Search engagement hub...'
                                                    : activeTab === 'settings' ? 'Search settings...'
                                                        : activeTab === 'deleted-items' ? 'Search deleted items...'
                                                            : 'Search...'
                                }
                                className="w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                suppressHydrationWarning
                            />
                        </div>
                    </div>
                </div>



                <TabsContent value="file-explorer">
                    <FileExplorerPage />
                </TabsContent>

                <TabsContent value="employee-management">
                    <EmployeeExplorerPage />
                </TabsContent>

                <TabsContent value="print-cards">
                    <PrintCardsExplorerPage />
                </TabsContent>

                <TabsContent value="engagement-hub">
                    <Card>
                        <CardContent className="pt-6">
                            <AdminEngagementManager searchTerm={searchTerm} />
                        </CardContent>
                    </Card>
                </TabsContent>




                <TabsContent value="settings">
                    <Card>

                        <CardContent>
                            <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                                <div className="overflow-x-auto w-full pb-2">
                                    <TabsList className="w-max bg-slate-100 dark:bg-muted border border-slate-200 dark:border-white/5 p-1 gap-1 h-auto rounded-xl">
                                        <TabsTrigger value="companies" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Companies</TabsTrigger>
                                        <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Branding</TabsTrigger>
                                        <TabsTrigger value="doc-types" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Document Types</TabsTrigger>
                                        <TabsTrigger value="departments" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Departments</TabsTrigger>
                                        <TabsTrigger value="data-management" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Data Management</TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="companies" className="mt-2">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-end p-2">
                                            <CompanyManagementDialog onSave={handleSaveCompany}>
                                                <Button className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0 font-medium">
                                                    <Home className="mr-2 h-4 w-4" /> Add Company
                                                </Button>
                                            </CompanyManagementDialog>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Logo</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Short Name</TableHead>
                                                        <TableHead className="hidden sm:table-cell">Domain</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredCompanies.length > 0 ? filteredCompanies.map(company => (
                                                        <TableRow key={company.id}>
                                                            <TableCell>
                                                                {company.logo ? (
                                                                    <Image src={company.logo} alt={company.name ? company.name : 'Company Logo'} width={40} height={40} className="rounded-md object-cover" />
                                                                ) : (
                                                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                                        No Logo
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="font-medium">{company.name}</TableCell>
                                                            <TableCell>{company.shortName}</TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                {company.domain ? (
                                                                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{company.domain}</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">No domain</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <CompanyManagementDialog company={company} onSave={handleSaveCompany}>
                                                                        <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                            <Edit className="mr-2 h-3 w-3" /> Edit
                                                                        </Button>
                                                                    </CompanyManagementDialog>
                                                                    <DeleteCompanyDialog company={company} onDelete={() => handleDeleteCompany(company.id)}>
                                                                        <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                            <Trash2 className="mr-2 h-3 w-3" /> Delete
                                                                        </Button>
                                                                    </DeleteCompanyDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center text-muted-foreground">No companies found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="branding" className="pt-6">
                                    <Card>

                                        <CardContent className="space-y-8">
                                            <div className="space-y-2">
                                                <Label>Company Logo</Label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                                        {logoSrc ? (
                                                            <Image src={logoSrc} alt="Current Logo" width={80} height={80} className="rounded-full object-cover" />
                                                        ) : (
                                                            <svg
                                                                width="64"
                                                                height="64"
                                                                viewBox="0 0 100 100"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path
                                                                    d="M50 0L95.5 25.5V74.5L50 100L4.5 74.5V25.5L50 0Z"
                                                                    fill="#004a99"
                                                                />
                                                                <path
                                                                    d="M26 63.5L50 50L74 63.5M50 75V50"
                                                                    stroke="#fecb00"
                                                                    strokeWidth="5"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                                <path
                                                                    d="M26 36.5L50 25L74 36.5"
                                                                    stroke="#ffffff"
                                                                    strokeWidth="5"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button asChild className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0 font-medium">
                                                            <label htmlFor="logo-upload">
                                                                <UploadCloud className="mr-2 h-4 w-4" />
                                                                Change Logo
                                                                <input
                                                                    type="file"
                                                                    id="logo-upload"
                                                                    className="sr-only"
                                                                    accept="image/*"
                                                                    onChange={handleLogoChange}
                                                                />
                                                            </label>
                                                        </Button>
                                                        {logoSrc && (
                                                            <Button variant="ghost" className="text-destructive" onClick={handleResetLogo}>
                                                                <X className="mr-2 h-4 w-4" />
                                                                Reset
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Upload a new logo for the login screen.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="site-name">Site Name</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="site-name"
                                                        value={tempSiteName}
                                                        onChange={(e) => setTempSiteName(e.target.value)}
                                                        className="max-w-xs"
                                                    />
                                                    <Button onClick={handleSiteNameSave} className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0 font-medium">
                                                        <Save className="mr-2 h-4 w-4" />
                                                        Save
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground">This name will appear on the login page and in the header.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="site-name-size">Site Name Size</Label>
                                                <Select value={tempSiteNameFontSize} onValueChange={setTempSiteNameFontSize}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Select Size" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text-lg">Small</SelectItem>
                                                        <SelectItem value="text-xl">Medium</SelectItem>
                                                        <SelectItem value="text-2xl">Large</SelectItem>
                                                        <SelectItem value="text-3xl">Extra Large</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="doc-types" className="mt-2">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-end p-2">
                                            <AddDocumentTypeDialog onAdd={handleAddDocumentType}>
                                                <Button className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0 font-medium">
                                                    <FolderPlus className="mr-2 h-4 w-4" /> Add Doc Type
                                                </Button>
                                            </AddDocumentTypeDialog>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Type Name</TableHead>
                                                        <TableHead>Documents</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredDocTypes.length > 0 ? filteredDocTypes.map(type => (
                                                        <TableRow key={type.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                                                    {type.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{docs.filter(d => d.type === type.name).length} documents</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">

                                                                    <EditDocumentTypeDialog
                                                                        documentType={type}
                                                                        onEdit={handleEditDocumentType}
                                                                    >
                                                                        <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                            <Edit className="mr-2 h-3 w-3" /> Edit
                                                                        </Button>
                                                                    </EditDocumentTypeDialog>
                                                                    <DeleteDocumentTypeDialog
                                                                        documentType={type}
                                                                        onDelete={() => handleDeleteDocumentType(type)}
                                                                        isTypeInUse={docs.some(d => d.type === type.name)}
                                                                    >
                                                                        <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                            <Trash2 className="mr-2 h-3 w-3" /> Delete
                                                                        </Button>
                                                                    </DeleteDocumentTypeDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground">No document types found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="departments" className="mt-2">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-end p-2">
                                            <AddDepartmentDialog onAdd={handleAddDepartment}>
                                                <Button className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0 font-medium">
                                                    <Building className="mr-2 h-4 w-4" /> Add Department
                                                </Button>
                                            </AddDepartmentDialog>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Department Name</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredDepartments.length > 0 ? filteredDepartments.map(dept => (
                                                        <TableRow key={dept.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                                    {dept.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button size="sm" disabled className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0 opacity-50 cursor-not-allowed">
                                                                        <Edit className="mr-2 h-3 w-3" /> Edit
                                                                    </Button>
                                                                    <DeleteDepartmentDialog department={dept} onDelete={() => handleDeleteDepartment(dept)}>
                                                                        <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                            <Trash2 className="mr-2 h-3 w-3" /> Delete
                                                                        </Button>
                                                                    </DeleteDepartmentDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={2} className="text-center text-muted-foreground">No departments found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="data-management" className="pt-6">
                                    <Card>

                                        <CardContent className="space-y-6">
                                            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-semibold">Undo Last Bulk Upload</h3>
                                                        <p className="text-sm text-destructive/80">This will permanently delete the last batch of {lastBulkUploadInfo?.ids.length || 0} uploaded document(s). This action cannot be undone.</p>
                                                    </div>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => setIsUndoDialogOpen(true)}
                                                        disabled={!lastBulkUploadInfo || lastBulkUploadInfo.ids.length === 0}
                                                    >
                                                        <Undo className="mr-2 h-4 w-4" />
                                                        Undo Last Upload ({lastBulkUploadInfo?.ids.length || 0})
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="deleted-items">
                    <Card>

                        <CardContent className="p-0">
                            <Tabs defaultValue="companies" className="w-full">
                                <div className="overflow-x-auto w-full pb-0 px-4 pt-4">
                                    <TabsList className="w-max bg-slate-100 dark:bg-muted border border-slate-200 dark:border-white/5 p-1 gap-1 h-auto rounded-xl">
                                        <TabsTrigger value="companies" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Companies</TabsTrigger>
                                        <TabsTrigger value="departments" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Departments</TabsTrigger>
                                        <TabsTrigger value="doc-types" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Document Types</TabsTrigger>
                                        <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Documents</TabsTrigger>
                                        <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Users</TabsTrigger>
                                        <TabsTrigger value="resources" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:animate-gradient-xy data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 transition-all font-medium text-slate-500 dark:text-muted-foreground">Resources</TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="companies" className="pt-0 px-4 pb-4">
                                    {selectedDeletedCompanyIds.length > 0 && (
                                        <div className="flex justify-end mb-2">
                                            <Button variant="destructive" size="sm" onClick={() => setIsBulkPermanentDeleteCompaniesDialogOpen(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDeletedCompanyIds.length})
                                            </Button>
                                        </div>
                                    )}
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            checked={filteredDeletedCompanies.length > 0 && selectedDeletedCompanyIds.length === filteredDeletedCompanies.length}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedDeletedCompanyIds(filteredDeletedCompanies.map(c => c.id));
                                                                } else {
                                                                    setSelectedDeletedCompanyIds([]);
                                                                }
                                                            }}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredDeletedCompanies.length > 0 ? filteredDeletedCompanies.map(company => (
                                                    <TableRow key={company.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedDeletedCompanyIds.includes(company.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedDeletedCompanyIds(prev => [...prev, company.id]);
                                                                    } else {
                                                                        setSelectedDeletedCompanyIds(prev => prev.filter(id => id !== company.id));
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{company.name}</TableCell>
                                                        <TableCell>{company.email}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button size="sm" onClick={() => handleRestoreCompany()} className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                <Undo className="mr-2 h-3 w-3" /> Restore
                                                            </Button>
                                                            <PermanentDeleteDialog
                                                                itemName={company.name}
                                                                itemType="company"
                                                                onDelete={() => handlePermanentDeleteCompany(company.id)}
                                                            >
                                                                <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                    <Trash className="mr-2 h-3 w-3" /> Permanent Delete
                                                                </Button>
                                                            </PermanentDeleteDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground">No deleted companies found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="departments" className="pt-0 px-4 pb-4">
                                    {selectedDeletedDepartmentIds.length > 0 && (
                                        <div className="flex justify-end mb-2">
                                            <Button variant="destructive" size="sm" onClick={() => setIsBulkPermanentDeleteDepartmentsDialogOpen(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDeletedDepartmentIds.length})
                                            </Button>
                                        </div>
                                    )}
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            checked={filteredDeletedDepartments.length > 0 && selectedDeletedDepartmentIds.length === filteredDeletedDepartments.length}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedDeletedDepartmentIds(filteredDeletedDepartments.map(d => d.id));
                                                                } else {
                                                                    setSelectedDeletedDepartmentIds([]);
                                                                }
                                                            }}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Department Name</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredDeletedDepartments.length > 0 ? filteredDeletedDepartments.map(dept => (
                                                    <TableRow key={dept.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedDeletedDepartmentIds.includes(dept.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedDeletedDepartmentIds(prev => [...prev, dept.id]);
                                                                    } else {
                                                                        setSelectedDeletedDepartmentIds(prev => prev.filter(id => id !== dept.id));
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                                {dept.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button size="sm" onClick={() => handleRestoreDepartment(dept)} className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                <Undo className="mr-2 h-3 w-3" /> Restore
                                                            </Button>
                                                            <PermanentDeleteDialog
                                                                itemName={dept.name}
                                                                itemType="department"
                                                                onDelete={() => handlePermanentDeleteDepartment(dept)}
                                                            >
                                                                <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                    <Trash className="mr-2 h-3 w-3" /> Permanent Delete
                                                                </Button>
                                                            </PermanentDeleteDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No deleted departments found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="doc-types" className="pt-0 px-4 pb-4">
                                    {selectedDeletedDocTypeIds.length > 0 && (
                                        <div className="flex justify-end mb-2">
                                            <Button variant="destructive" size="sm" onClick={() => setIsBulkPermanentDeleteDocTypesDialogOpen(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDeletedDocTypeIds.length})
                                            </Button>
                                        </div>
                                    )}
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            checked={filteredDeletedDocTypes.length > 0 && selectedDeletedDocTypeIds.length === filteredDeletedDocTypes.length}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedDeletedDocTypeIds(filteredDeletedDocTypes.map(t => t.id));
                                                                } else {
                                                                    setSelectedDeletedDocTypeIds([]);
                                                                }
                                                            }}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Type Name</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredDeletedDocTypes.length > 0 ? filteredDeletedDocTypes.map(type => (
                                                    <TableRow key={type.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedDeletedDocTypeIds.includes(type.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedDeletedDocTypeIds(prev => [...prev, type.id]);
                                                                    } else {
                                                                        setSelectedDeletedDocTypeIds(prev => prev.filter(id => id !== type.id));
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                                {type.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button size="sm" onClick={() => handleRestoreDocumentType(type)} className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                <Undo className="mr-2 h-3 w-3" /> Restore
                                                            </Button>
                                                            <PermanentDeleteDialog
                                                                itemName={type.name}
                                                                itemType="document type"
                                                                onDelete={() => handlePermanentDeleteDocumentType(type)}
                                                            >
                                                                <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                    <Trash className="mr-2 h-3 w-3" /> Permanent Delete
                                                                </Button>
                                                            </PermanentDeleteDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No deleted document types found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="documents" className="pt-0 px-4 pb-4">
                                    {selectedDeletedDocumentIds.length > 0 && (
                                        <div className="flex justify-end mb-2">
                                            <Button variant="destructive" size="sm" onClick={() => setIsBulkPermanentDeleteDocumentsDialogOpen(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDeletedDocumentIds.length})
                                            </Button>
                                        </div>
                                    )}
                                    <div className="border rounded-md">
                                        <DocumentList
                                            documents={filteredDeletedDocs}
                                            users={users}
                                            showOwner
                                            onSort={() => { }}
                                            sortConfig={null}
                                            isDeletedList
                                            onRestore={handleRestoreDocument}
                                            onPermanentDelete={handlePermanentDeleteDocument}
                                            onBulkPermanentDelete={handleBulkPermanentDeleteDocuments}
                                            selectedDocIds={selectedDeletedDocumentIds}
                                            onSelectDoc={(docId: string, checked: boolean) => {
                                                if (checked) {
                                                    setSelectedDeletedDocumentIds(prev => [...prev, docId]);
                                                } else {
                                                    setSelectedDeletedDocumentIds(prev => prev.filter(id => id !== docId));
                                                }
                                            }}
                                            onSelectAll={(checked: boolean) => {
                                                if (checked) {
                                                    setSelectedDeletedDocumentIds(filteredDeletedDocs.map(d => d.id));
                                                } else {
                                                    setSelectedDeletedDocumentIds([]);
                                                }
                                            }}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="users" className="pt-0 px-4 pb-4">
                                    {selectedDeletedUserIds.length > 0 && (
                                        <div className="flex justify-end mb-2">
                                            <Button variant="destructive" size="sm" onClick={() => setIsBulkPermanentDeleteUsersDialogOpen(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDeletedUserIds.length})
                                            </Button>
                                        </div>
                                    )}
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            checked={filteredDeletedUsers.length > 0 && selectedDeletedUserIds.length === filteredDeletedUsers.length}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedDeletedUserIds(filteredDeletedUsers.map(u => u.id));
                                                                } else {
                                                                    setSelectedDeletedUserIds([]);
                                                                }
                                                            }}
                                                        />
                                                    </TableHead>
                                                    <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredDeletedUsers.length > 0 ? filteredDeletedUsers.map(user => (
                                                    <TableRow key={user.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedDeletedUserIds.includes(user.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedDeletedUserIds(prev => [...prev, user.id]);
                                                                    } else {
                                                                        setSelectedDeletedUserIds(prev => prev.filter(id => id !== user.id));
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">
                                                            <Image src={getAvatarSrc(user)} width={40} height={40} className="rounded-full object-cover" alt={user.name ? user.name : 'User'} data-ai-hint="person portrait" />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{user.name}</TableCell>
                                                        <TableCell>{user.email}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button size="sm" onClick={() => router.push(`/dashboard/employee/${user.id}?role=admin`)} className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                <Eye className="mr-2 h-3 w-3" /> View
                                                            </Button>
                                                            <Button size="sm" onClick={() => handleRestoreUser(user.id)} className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                <Undo className="mr-2 h-3 w-3" /> Restore
                                                            </Button>
                                                            <PermanentDeleteDialog
                                                                itemName={user.name}
                                                                itemType="user"
                                                                onDelete={() => handlePermanentDeleteUser(user.id)}
                                                            >
                                                                <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                    <Trash className="mr-2 h-3 w-3" /> Permanent Delete
                                                                </Button>
                                                            </PermanentDeleteDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">No deleted users found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="resources" className="pt-0 px-4 pb-4">
                                    {selectedDeletedResourceIds.length > 0 && (
                                        <div className="flex justify-end mb-2">
                                            <Button variant="destructive" size="sm" onClick={() => setIsBulkPermanentDeleteResourcesDialogOpen(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDeletedResourceIds.length})
                                            </Button>
                                        </div>
                                    )}
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            checked={filteredDeletedResources.length > 0 && selectedDeletedResourceIds.length === filteredDeletedResources.length}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedDeletedResourceIds(filteredDeletedResources.map((r: any) => r.id));
                                                                } else {
                                                                    setSelectedDeletedResourceIds([]);
                                                                }
                                                            }}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredDeletedResources.length > 0 ? filteredDeletedResources.map((resource: any) => (
                                                    <TableRow key={resource.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedDeletedResourceIds.includes(resource.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedDeletedResourceIds(prev => [...prev, resource.id]);
                                                                    } else {
                                                                        setSelectedDeletedResourceIds(prev => prev.filter(id => id !== resource.id));
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{resource.name}</TableCell>
                                                        <TableCell><Badge variant="secondary">{resource.category}</Badge></TableCell>
                                                        <TableCell><Badge variant="outline">{resource.type}</Badge></TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleRestoreResource(resource.id)}
                                                                className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0"
                                                            >
                                                                <Undo className="mr-2 h-3 w-3" /> Restore
                                                            </Button>
                                                            <PermanentDeleteDialog
                                                                itemName={resource.name}
                                                                itemType="resource"
                                                                onDelete={() => handlePermanentDeleteResource(resource.id)}
                                                            >
                                                                <Button size="sm" className="h-8 px-3 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95 animate-gradient-xy border-0">
                                                                    <Trash className="mr-2 h-3 w-3" /> Permanent Delete
                                                                </Button>
                                                            </PermanentDeleteDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">No deleted resources found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Bulk Delete Companies Confirmation Dialog */}
                            <AlertDialog open={isBulkPermanentDeleteCompaniesDialogOpen} onOpenChange={setIsBulkPermanentDeleteCompaniesDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete the selected {selectedDeletedCompanyIds.length} company(ies). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkPermanentDeleteCompanies} className="bg-destructive hover:bg-destructive/90">
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog >

                            {/* Bulk Delete Departments Confirmation Dialog */}
                            <AlertDialog open={isBulkPermanentDeleteDepartmentsDialogOpen} onOpenChange={setIsBulkPermanentDeleteDepartmentsDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete the selected {selectedDeletedDepartmentIds.length} department(s). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkPermanentDeleteDepartments} className="bg-destructive hover:bg-destructive/90">
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Bulk Delete DocTypes Confirmation Dialog */}
                            <AlertDialog open={isBulkPermanentDeleteDocTypesDialogOpen} onOpenChange={setIsBulkPermanentDeleteDocTypesDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete the selected {selectedDeletedDocTypeIds.length} document type(s). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkPermanentDeleteDocTypes} className="bg-destructive hover:bg-destructive/90">
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Bulk Delete Documents Confirmation Dialog */}
                            <AlertDialog open={isBulkPermanentDeleteDocumentsDialogOpen} onOpenChange={setIsBulkPermanentDeleteDocumentsDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete the selected {selectedDeletedDocumentIds.length} document(s). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkPermanentDeleteDocuments} className="bg-destructive hover:bg-destructive/90">
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Bulk Delete Resources Confirmation Dialog */}
                            <AlertDialog open={isBulkPermanentDeleteResourcesDialogOpen} onOpenChange={setIsBulkPermanentDeleteResourcesDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete the selected {selectedDeletedResourceIds.length} resource(s). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkPermanentDeleteResources} className="bg-destructive hover:bg-destructive/90">
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Bulk Delete Users Confirmation Dialog */}
                            <AlertDialog open={isBulkPermanentDeleteUsersDialogOpen} onOpenChange={setIsBulkPermanentDeleteUsersDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete the selected {selectedDeletedUserIds.length} user(s). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkPermanentDeleteUsers} className="bg-destructive hover:bg-destructive/90">
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Undo Last Bulk Upload Confirmation Dialog */}
                            <AlertDialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Undo Last Bulk Upload?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the last batch of {lastBulkUploadInfo?.ids.length || 0} uploaded document(s). This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleUndoLastBulkUpload} className="bg-destructive hover:bg-destructive/90">
                                            Yes, Undo Upload
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    )
}

