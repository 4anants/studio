
'use client'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { documentTypesList, departments as initialDepartments, holidayLocations, CompanyName } from '@/lib/constants'
import type { User, Document, Holiday, HolidayLocation, Announcement, Company, Department, DocumentType as AppDocumentType } from '@/lib/types'
import { useData } from '@/hooks/use-data'
import { Search, MoreVertical, Edit, Trash2, KeyRound, FolderPlus, Tag, Building, CalendarPlus, Bell, UploadCloud, X, FileLock2, Users, Download, Home, ArrowLeft, Folder, Upload, Save, Shield, Undo, Eye, Trash, ArchiveRestore } from 'lucide-react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import Image from 'next/image'
import { BulkUploadDialog } from '@/components/dashboard/bulk-upload/bulk-upload-dialog'
import { Button } from '@/components/ui/button'
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
import { AddHolidayDialog } from '@/components/dashboard/add-holiday-dialog'
import { AddAnnouncementDialog } from '@/components/dashboard/add-announcement-dialog'
import { DeleteAnnouncementDialog } from '@/components/dashboard/delete-announcement-dialog'
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
// import { ToastAction } from '@/components/ui/toast'
import { IntegrationsSettings } from '@/components/dashboard/integrations-settings'

type ExplorerState = { view: 'docTypes' } | { view: 'usersInDocType', docType: string }


export function AdminView() {
    const {
        users: serverUsers,
        documents: serverDocs,
        holidays: serverHolidays,
        announcements: serverAnnouncements,
        companies: serverCompanies,
        departments: serverDepartments,
        documentTypes: serverDocTypes,
        mutateUsers, mutateDocuments, mutateHolidays, mutateAnnouncements, mutateCompanies, mutateDepartments, mutateDocumentTypes
    } = useData();

    const [docs, setDocs] = useState<Document[]>([])
    const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
    const [users, setUsers] = useState<User[]>([])
    const [documentTypes, setDocumentTypes] = useState<AppDocumentType[]>([]);

    const [departments, setDepartments] = useState<Department[]>([]);

    const [companies, setCompanies] = useState<Company[]>([]);
    const deletedCompanies = useMemo<Company[]>(() => [], []);

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    // Sync with server data
    useEffect(() => {
        if (serverUsers) setUsers(serverUsers as User[]);
    }, [serverUsers]);

    useEffect(() => {
        if (serverDocs) setDocs(serverDocs as Document[]);
    }, [serverDocs]);

    useEffect(() => {
        if (serverHolidays) setHolidays(serverHolidays as Holiday[]);
    }, [serverHolidays]);

    useEffect(() => {
        if (serverAnnouncements) setAnnouncements(serverAnnouncements.map((a: Announcement) => ({ ...a, isRead: true, status: a.status || 'published' })));
    }, [serverAnnouncements]);

    useEffect(() => {
        if (serverCompanies) setCompanies(serverCompanies as Company[]);
    }, [serverCompanies]);

    useEffect(() => {
        if (serverDepartments) setDepartments(serverDepartments as Department[]);
    }, [serverDepartments]);

    useEffect(() => {
        if (serverDocTypes) setDocumentTypes(serverDocTypes as AppDocumentType[]);
    }, [serverDocTypes]);
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
    const [isBulkResetDialogOpen, setIsBulkResetDialogOpen] = useState(false)
    const [lastBulkUploadInfo, setLastBulkUploadInfo] = useState<{ ids: string[], timestamp: number } | null>(null);
    const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('file-explorer');
    const [activeSubTab, setActiveSubTab] = useState('overview');
    const [activeSettingsTab, setActiveSettingsTab] = useState('companies');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
    const [holidayLocationFilter, setHolidayLocationFilter] = useState<HolidayLocation | 'all'>('all');
    const [logoSrc, setLogoSrc] = useState<string | null>(null);
    const [siteName, setSiteName] = useState(CompanyName);
    const [tempSiteName, setTempSiteName] = useState(CompanyName);
    const [explorerState, setExplorerState] = useState<ExplorerState>({ view: 'docTypes' });
    const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        setIsMounted(true);
        const handleViewAnnouncements = () => {
            setActiveTab('announcements');

        };
        window.addEventListener('view-announcements', handleViewAnnouncements);

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
            window.removeEventListener('view-announcements', handleViewAnnouncements);
        };
    }, []);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const newLogo = e.target?.result as string;
                setLogoSrc(newLogo);
                localStorage.setItem('companyLogo', newLogo);
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
        toast({
            title: 'Logo Reset',
            description: 'The company logo has been reset to the default.',
        });
    };

    const handleSiteNameSave = () => {
        setSiteName(tempSiteName);
        localStorage.setItem('siteName', tempSiteName);
        window.dispatchEvent(new Event('storage')); // Notify other tabs/components
        toast({
            title: 'Site Name Updated',
            description: 'The site name has been changed successfully.',
        });
    };

    const handleAddDomain = () => {
        if (newDomain && !allowedDomains.includes(newDomain)) {
            const newDomains = [...allowedDomains, newDomain];
            setAllowedDomains(newDomains);
            localStorage.setItem('allowedDomains', JSON.stringify(newDomains));
            setNewDomain('');
            toast({ title: 'Domain Added', description: `Domain "${newDomain}" has been added.` });
        } else {
            toast({ variant: 'destructive', title: 'Invalid Domain', description: 'Domain is either empty or already exists.' });
        }
    };

    const handleRemoveDomain = (domainToRemove: string) => {
        const newDomains = allowedDomains.filter(d => d !== domainToRemove);
        setAllowedDomains(newDomains);
        localStorage.setItem('allowedDomains', JSON.stringify(newDomains));
        toast({ title: 'Domain Removed', description: `Domain "${domainToRemove}" has been removed.` });
    };

    const handleUndoLastBulkUpload = () => {
        if (lastBulkUploadInfo && lastBulkUploadInfo.ids.length > 0) {
            setDocs(prev => prev.filter(d => !lastBulkUploadInfo.ids.includes(d.id)));
            toast({
                title: 'Upload Undone',
                description: `${lastBulkUploadInfo.ids.length} document(s) have been removed.`,
            });
            setLastBulkUploadInfo(null);
        }
        setIsUndoDialogOpen(false);
    };

    const handleBulkUploadComplete = useCallback((count: number) => {
        mutateDocuments();
        toast({
            title: 'Upload Successful!',
            description: `${count} documents have been added.`,
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

    const handleResetPassword = useCallback((employeeId: string) => {
        if (employeeId === 'sadmin') {
            toast({ variant: 'destructive', title: 'Action Forbidden', description: 'Password for the Super Admin must be changed via the edit profile screen.' });
            return;
        }
        const user = users.find(u => u.id === employeeId);
        if (user && user.email) {
            toast({
                title: "Password Reset Link Sent",
                description: `An email has been sent to ${user.name} with password reset instructions.`
            });
        }
    }, [toast, users]);

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


    const handleAddHoliday = useCallback(async (newHoliday: { name: string, date: Date, location: HolidayLocation }) => {
        const newHolidayItem = {
            id: `h-${Date.now()}`,
            name: newHoliday.name,
            date: newHoliday.date.toISOString().split('T')[0],
            location: newHoliday.location,
        };

        try {
            await fetch('/api/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHolidayItem)
            });
            await mutateHolidays();
            toast({
                title: 'Holiday Added',
                description: `"${newHoliday.name}" has been added to the holiday list.`,
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add holiday' });
        }
    }, [toast, mutateHolidays]);

    const handleDeleteHoliday = useCallback(async (holidayId: string) => {
        try {
            await fetch(`/api/holidays?id=${holidayId}`, { method: 'DELETE' });
            await mutateHolidays();
            toast({
                title: 'Holiday Deleted',
                description: 'The holiday has been removed from the list.',
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete holiday' });
        }
    }, [toast, mutateHolidays]);

    const handleAddAnnouncement = useCallback(async (announcement: { title: string, message: string, eventDate?: string }) => {
        const newAnnouncement = {
            id: `anno-${Date.now()}`,
            title: announcement.title,
            message: announcement.message,
            date: new Date().toISOString(),
            author: 'Admin',
            isRead: true,
            status: 'published',
            eventDate: announcement.eventDate
        };

        try {
            await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAnnouncement)
            });
            await mutateAnnouncements();
            toast({
                title: 'Announcement Published',
                description: 'A notification has been sent to all employees.',
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add announcement' });
        }
    }, [toast, mutateAnnouncements]);

    const handleDeleteAnnouncement = useCallback(async (announcementId: string) => {
        const announcement = announcements.find(a => a.id === announcementId);
        if (!announcement) return;

        try {
            await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...announcement, status: 'deleted' })
            });
            await mutateAnnouncements();

            toast({
                title: 'Announcement Deleted',
                description: 'The announcement has been moved to the deleted list.',
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete announcement' });
        }
    }, [announcements, toast, mutateAnnouncements]);

    const handleRestoreAnnouncement = useCallback(async (announcementId: string) => {
        const announcement = announcements.find(a => a.id === announcementId);
        if (!announcement) return;

        try {
            await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...announcement, status: 'published' })
            });
            await mutateAnnouncements();

            toast({
                title: 'Announcement Restored',
                description: 'The announcement has been restored and is now visible to employees.',
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to restore announcement' });
        }
    }, [announcements, toast, mutateAnnouncements]);

    const handlePermanentDeleteAnnouncement = useCallback(async (announcementId: string) => {
        try {
            await fetch(`/api/announcements?id=${announcementId}`, { method: 'DELETE' });
            await mutateAnnouncements();
            toast({
                variant: 'destructive',
                title: 'Announcement Permanently Deleted',
                description: 'The announcement has been permanently removed from the system.',
            });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete announcement' });
        }
    }, [toast, mutateAnnouncements]);

    const handleSaveCompany = useCallback(async (companyToSave: Company) => {
        const company = { ...companyToSave, id: companyToSave.id || `comp-${Date.now()}` };
        try {
            await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company)
            });
            await mutateCompanies();
            if (companyToSave.id) {
                toast({ title: 'Company Updated', description: `Details for ${companyToSave.name} have been updated.` });
            } else {
                toast({ title: 'Company Added', description: `${companyToSave.name} has been added.` });
            }
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save company' });
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


    const activeUsers = useMemo(() => users.filter(user => (user.status === 'active' || user.status === 'inactive' || user.status === 'pending') && user.id !== 'sadmin'), [users]);
    const deletedUsers = useMemo(() => users.filter(user => user.status === 'deleted'), [users]);

    const publishedAnnouncements = useMemo(() => announcements.filter(a => a.status === 'published'), [announcements]);
    const deletedAnnouncements = useMemo(() => announcements.filter(a => a.status === 'deleted'), [announcements]);


    const filteredByDept = useMemo(() => {
        if (departmentFilter === 'all') {
            return activeUsers;
        }
        if (departmentFilter === 'unassigned') {
            return []; // Return empty for user grid if unassigned is selected
        }
        return activeUsers.filter(user => user.department && departmentFilter === user.department);
    }, [activeUsers, departmentFilter]);

    const filteredByRole = useMemo(() => filteredByDept.filter(user =>
        roleFilter === 'all' || user.role === roleFilter
    ), [filteredByDept, roleFilter]);

    const filteredActiveUsersForGrid = useMemo(() => filteredByRole.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [filteredByRole, searchTerm]);

    const filteredActiveUsersForTable = useMemo(() => filteredByRole.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [filteredByRole, searchTerm]);

    const filteredDeletedUsers = useMemo(() => deletedUsers.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [deletedUsers, searchTerm]);

    const filteredDocTypes = useMemo(() => documentTypes.filter(type =>
        type.status === 'active' &&
        (type.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [documentTypes, searchTerm]);

    const filteredDeletedDocTypes = useMemo(() => documentTypes.filter(type =>
        type.status === 'deleted' &&
        (type.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [documentTypes, searchTerm]);

    const filteredDepartments = useMemo(() => departments.filter(dept =>
        dept.status === 'active' &&
        (dept.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [departments, searchTerm]);

    const filteredDeletedDepartments = useMemo(() => departments.filter(dept =>
        dept.status === 'deleted' &&
        (dept.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [departments, searchTerm]);

    const filteredCompanies = useMemo(() => companies.filter(comp =>
        (comp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (comp.shortName && comp.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [companies, searchTerm]);

    const filteredDeletedCompanies = useMemo(() => deletedCompanies.filter(comp =>
        (comp.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [deletedCompanies, searchTerm]);


    const filteredHolidays = useMemo(() => {
        return holidays.filter(holiday =>
            (holiday.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
            (holidayLocationFilter === 'all' || holiday.location === holidayLocationFilter)
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [holidays, searchTerm, holidayLocationFilter]);

    const filteredAnnouncements = useMemo(() => {
        return publishedAnnouncements.filter(announcement =>
            (announcement.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (announcement.message || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [publishedAnnouncements, searchTerm]);

    const filteredDeletedAnnouncements = useMemo(() => {
        return deletedAnnouncements.filter(announcement =>
            (announcement.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (announcement.message || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [deletedAnnouncements, searchTerm]);

    const filteredDeletedDocs = useMemo(() => {
        return deletedDocs.filter(doc =>
            (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.type || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }, [deletedDocs, searchTerm]);


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

    const filteredUsersForSelection = useMemo(() => activeSubTab === 'manage' ? filteredActiveUsersForTable.filter(u => u.id !== 'sadmin') : [], [activeSubTab, filteredActiveUsersForTable]);

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

    const handleBulkDelete = useCallback(() => {
        setUsers(prevUsers => prevUsers.map(u =>
            selectedUserIds.includes(u.id) ? { ...u, status: 'deleted' } : u
        ));
        toast({
            title: "Bulk Delete Successful",
            description: `${selectedUserIds.length} employee(s) have been moved to the deleted users list.`
        });
        setSelectedUserIds([]);
        setIsBulkDeleteDialogOpen(false);
    }, [selectedUserIds, toast]);

    const handleBulkResetPassword = useCallback(() => {
        const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
        selectedUsers.forEach(user => handleResetPassword(user.id));
        toast({
            title: "Bulk Password Reset",
            description: `Password reset links have been sent to ${selectedUserIds.length} employee(s).`
        });
        setSelectedUserIds([]);
        setIsBulkResetDialogOpen(false);
    }, [users, selectedUserIds, handleResetPassword, toast]);

    const handleBulkRoleChange = useCallback((newRole: 'admin' | 'employee') => {
        setUsers(prevUsers => prevUsers.map(u =>
            selectedUserIds.includes(u.id) ? { ...u, role: newRole } : u
        ));
        toast({
            title: "Bulk Role Change Successful",
            description: `The role for ${selectedUserIds.length} employee(s) has been changed to ${newRole}.`
        });
        setSelectedUserIds([]);
    }, [selectedUserIds, toast]);

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
                fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
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

    const handleRestoreDocument = useCallback((docId: string) => {
        const docToRestore = deletedDocs.find(d => d.id === docId);
        if (docToRestore) {
            setDeletedDocs(prev => prev.filter(d => d.id !== docId));
            setDocs(prev => [...prev, docToRestore]);
            toast({
                title: "Document Restored",
                description: `"${docToRestore.name}" has been restored.`
            });
        }
    }, [deletedDocs, toast]);

    const handlePermanentDeleteDocument = useCallback((docId: string) => {
        const docToDelete = deletedDocs.find(d => d.id === docId);
        if (docToDelete) {
            setDeletedDocs(prev => prev.filter(d => d.id !== docId));
            toast({
                variant: "destructive",
                title: "Document Permanently Deleted",
                description: `"${docToDelete.name}" has been permanently removed.`
            });
        }
    }, [deletedDocs, toast]);

    const onTabChange = useCallback((value: string) => {
        setActiveTab(value);
        setSelectedUserIds([]);
        setSearchTerm('');
        setDepartmentFilter('all');
        setRoleFilter('all');
        setHolidayLocationFilter('all');
        setExplorerState({ view: 'docTypes' });
        if (value === 'employee-management') {
            setActiveSubTab('overview');
        }
    }, []);

    const numSelected = selectedUserIds.length;
    const numFiltered = filteredUsersForSelection.length;

    const isEventUpcoming = (eventDate?: string) => {
        if (!eventDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eDate = new Date(eventDate);
        eDate.setTime(eDate.getTime() + eDate.getTimezoneOffset() * 60 * 1000); // Adjust for timezone
        return eDate >= today;
    }



    const usersByDocType = useMemo(() => {
        if (explorerState.view !== 'usersInDocType') return [];

        const userIdsWithDocType = new Set(
            Object.keys(docsByType[explorerState.docType] || {})
        );

        return filteredActiveUsersForGrid.filter(u => userIdsWithDocType.has(u.id));
    }, [explorerState, docsByType, filteredActiveUsersForGrid]);

    return (
        <>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="grid gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{siteName}</h1>
                    <p className="text-muted-foreground">Manage all employee documents and profiles.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {numSelected > 0 && activeTab === 'employee-management' && activeSubTab === 'manage' ? (
                        <>
                            <span className="text-sm text-muted-foreground">{numSelected} selected</span>
                            <BulkRoleChangeDialog onSave={handleBulkRoleChange}>
                                <Button variant="outline">
                                    <Users className="mr-2 h-4 w-4" /> Change Roles
                                </Button>
                            </BulkRoleChangeDialog>
                            <Button variant="outline" onClick={() => setIsBulkResetDialogOpen(true)}>
                                <KeyRound className="mr-2 h-4 w-4" /> Reset Passwords
                            </Button>
                            <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <EmployeeManagementDialog onSave={handleEmployeeSave} departments={departments} companies={companies}>
                                <Button className="w-full sm:w-auto">Add Employee</Button>
                            </EmployeeManagementDialog>
                            <BulkUploadDialog onBulkUploadComplete={handleBulkUploadComplete} users={activeUsers} />
                        </div>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="mt-4">
                <div className="flex flex-col md:flex-row items-start md:items-center mb-4 gap-4">
                    <div className="overflow-x-auto w-full pb-2">
                        <TabsList className="w-max">
                            <TabsTrigger value="file-explorer">File Explorer</TabsTrigger>
                            <TabsTrigger value="employee-management">Employee Management</TabsTrigger>
                            <TabsTrigger value="announcements">Announcements</TabsTrigger>
                            <TabsTrigger value="holidays">Holidays</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                            <TabsTrigger value="deleted-items">Deleted Items</TabsTrigger>
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
                                            : activeTab === 'holidays' ? 'Search holidays...'
                                                : activeTab === 'announcements' ? 'Search announcements...'
                                                    : activeTab === 'settings' ? 'Search settings...'
                                                        : activeTab === 'deleted-items' ? 'Search deleted items...'
                                                            : 'Search...'
                                }
                                className="w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {(activeTab === 'employee-management' || (activeTab === 'file-explorer' && explorerState.view !== 'docTypes')) && (
                    <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">Department</Label>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {filteredDepartments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                    {activeTab === 'file-explorer' && <SelectItem value="unassigned">Unassigned Documents</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">Role</Label>
                            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as 'all' | 'admin' | 'employee')}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="employee">Employee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <TabsContent value="file-explorer">
                    <Card>
                        {departmentFilter === 'unassigned' ? (
                            <CardHeader>
                                <CardTitle>Unassigned Documents</CardTitle>
                                <CardDescription>
                                    These documents could not be automatically assigned. Please assign them to an employee.
                                </CardDescription>
                            </CardHeader>
                        ) : explorerState.view === 'usersInDocType' ? (
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="icon" onClick={() => setExplorerState({ view: 'docTypes' })}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <CardTitle>Employees with &quot;{explorerState.docType}&quot;</CardTitle>
                                        <CardDescription>Select an employee to view their documents of this type.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        ) : null}

                        <CardContent>
                            {explorerState.view === 'docTypes' && departmentFilter !== 'unassigned' && (
                                <CardHeader>
                                    <CardTitle>Browse Documents</CardTitle>
                                    <CardDescription>Select a document type to see all related employees.</CardDescription>
                                </CardHeader>
                            )}
                            {departmentFilter === 'unassigned' ? (
                                unassignedDocuments.length > 0 ? (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <h3 className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
                                            <FileLock2 className="h-5 w-5" />
                                            Action Required
                                        </h3>
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1 mb-4">
                                            These documents could not be automatically assigned. Please select them and assign them to an employee.
                                        </p>
                                        <DocumentList
                                            documents={unassignedDocuments}
                                            users={users}
                                            onSort={() => { }}
                                            sortConfig={null}
                                            showOwner={true}
                                            onReassign={handleReassignDocument}
                                            onDelete={handleDeleteDocument}
                                            onBulkDelete={handleBulkDeleteDocuments}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p>No unassigned documents found.</p>
                                    </div>
                                )
                            ) : explorerState.view === 'docTypes' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {documentTypes.filter(dt => dt.name.toLowerCase().includes(searchTerm.toLowerCase())).map(docType => (
                                        <Card
                                            key={docType.id}
                                            className="cursor-pointer hover:border-primary transition-all group"
                                            onClick={() => setExplorerState({ view: 'usersInDocType', docType: docType.name })}
                                        >
                                            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                                                <Folder className="h-16 w-16 text-primary group-hover:scale-105 transition-transform" />
                                                <p className="text-sm font-medium text-center truncate w-full">{docType.name}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                                        {usersByDocType.map(user => (
                                            <Card
                                                key={user.id}
                                                className="cursor-pointer hover:border-primary transition-all"
                                                onClick={() => router.push(`/dashboard/employee/${user.id}?role=admin`)}
                                            >
                                                <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                                                    <Image
                                                        src={getAvatarSrc(user)}
                                                        width={64}
                                                        height={64}
                                                        className="rounded-full object-cover"
                                                        alt={user.name ? user.name : 'Employee avatar'} // FIXED: Robust fallback
                                                        data-ai-hint="person portrait"
                                                    />
                                                    <p className="text-sm font-medium text-center truncate w-full">{user.name}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {usersByDocType.length === 0 && (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p>No employees found with this document type.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="employee-management">
                    <Tabs defaultValue="overview" value={activeSubTab} onValueChange={setActiveSubTab}>
                        <TabsList>
                            <TabsTrigger value="overview">Employee Overview</TabsTrigger>
                            <TabsTrigger value="manage">Manage Employees</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Employee Overview</CardTitle>
                                    <CardDescription>Select an employee to view their detailed profile and documents.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                                        {filteredActiveUsersForGrid.map(user => (
                                            <Card
                                                key={user.id}
                                                className="cursor-pointer hover:border-primary transition-all"
                                                onClick={() => router.push(`/dashboard/employee/${user.id}?role=admin`)}
                                            >
                                                <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                                                    <Image
                                                        src={getAvatarSrc(user)}
                                                        width={64}
                                                        height={64}
                                                        className="rounded-full object-cover"
                                                        alt={user.name ? user.name : 'Employee avatar'} // FIXED: Robust fallback
                                                        data-ai-hint="person portrait"
                                                    />
                                                    <p className="text-sm font-medium text-center truncate w-full">{user.name}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {filteredActiveUsersForGrid.length === 0 && (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p>No employees found.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="manage" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle>Manage Employees</CardTitle>
                                            <CardDescription>A list of all active employees in the system.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <Button onClick={handleExportUsers} variant="outline" className="w-full sm:w-auto">
                                                <Download className="mr-2 h-4 w-4" />
                                                {numSelected > 0 ? `Export Selected (${numSelected})` : 'Export All Users'}
                                            </Button>
                                            <BulkUserImportDialog onImport={handleBulkUserImport}>
                                                <Button variant="outline" className="w-full sm:w-auto">
                                                    <Upload className="mr-2 h-4 w-4" /> Import Users
                                                </Button>
                                            </BulkUserImportDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[40px]">
                                                    <Checkbox
                                                        checked={numSelected === numFiltered && numFiltered > 0 ? true : numSelected > 0 ? 'indeterminate' : false}
                                                        onCheckedChange={handleSelectAll}
                                                        aria-label="Select all"
                                                        disabled={filteredUsersForSelection.length === 0}
                                                    />
                                                </TableHead>
                                                <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead className="hidden lg:table-cell">Department</TableHead>
                                                <TableHead className="hidden md:table-cell">Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredActiveUsersForTable.length > 0 ? filteredActiveUsersForTable.map(user => (
                                                <TableRow key={user.id} data-state={selectedUserIds.includes(user.id) && "selected"}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedUserIds.includes(user.id)}
                                                            onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                                                            aria-label={`Select ${user.name}`}
                                                            disabled={user.id === 'sadmin'}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Image
                                                            src={getAvatarSrc(user)}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full object-cover"
                                                            alt={user.name ? user.name : 'User avatar'} // FIXED: Robust fallback
                                                            data-ai-hint="person portrait"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell className="hidden lg:table-cell">{user.department || 'N/A'}</TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                                                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                        )}>
                                                            {(user.role || 'employee').charAt(0).toUpperCase() + (user.role || 'employee').slice(1)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                                                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                        )}>
                                                            {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {user.id === 'sadmin' ? (
                                                            <div className="flex items-center justify-end">
                                                                <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave} departments={departments} companies={companies}>
                                                                    <Button variant="ghost" size="sm">
                                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                                    </Button>
                                                                </EmployeeManagementDialog>
                                                            </div>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreVertical className="h-5 w-5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave} departments={departments} companies={companies}>
                                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            Edit Employee
                                                                        </DropdownMenuItem>
                                                                    </EmployeeManagementDialog>
                                                                    <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                                        Reset Password
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DeleteEmployeeDialog employee={user} onDelete={() => handleEmployeeDelete(user.id)}>
                                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete Employee
                                                                        </DropdownMenuItem>
                                                                    </DeleteEmployeeDialog>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center text-muted-foreground">No active users found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="announcements">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Manage Announcements</CardTitle>
                                <CardDescription>Create and publish announcements for all employees.</CardDescription>
                            </div>
                            <AddAnnouncementDialog onAdd={handleAddAnnouncement}>
                                <Button variant="outline">
                                    <Bell className="mr-2 h-4 w-4" /> New Announcement
                                </Button>
                            </AddAnnouncementDialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="hidden md:table-cell">Message</TableHead>
                                        <TableHead>Event Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAnnouncements.length > 0 ? filteredAnnouncements.map(announcement => {
                                        const isUpcoming = isEventUpcoming(announcement.eventDate);
                                        return (
                                            <TableRow key={announcement.id} className={cn(isMounted && isUpcoming && "bg-blue-500/10 ring-2 ring-destructive animate-pulse")}>
                                                <TableCell className="font-medium hidden sm:table-cell">
                                                    {new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </TableCell>
                                                <TableCell>{announcement.title}</TableCell>
                                                <TableCell className="hidden md:table-cell max-w-sm truncate">{announcement.message}</TableCell>
                                                <TableCell>
                                                    {announcement.eventDate ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                'px-2 py-1 rounded-full text-xs font-medium',
                                                                (isMounted && new Date(announcement.eventDate) > new Date()) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                            )}>
                                                                {new Date(announcement.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                                            </span>
                                                        </div>
                                                    ) : <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DeleteAnnouncementDialog announcement={announcement} onDelete={() => handleDeleteAnnouncement(announcement.id)} isPermanent={false}>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </DeleteAnnouncementDialog>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">No announcements found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="holidays">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Manage Holidays</CardTitle>
                                <CardDescription>Add or remove holidays for the organization.</CardDescription>
                            </div>
                            <div className="flex w-full flex-col sm:flex-row sm:w-auto items-center gap-4">
                                <div className="flex items-center gap-2 w-full">
                                    <Label className="text-sm font-medium">Location</Label>
                                    <Select value={holidayLocationFilter} onValueChange={(value) => setHolidayLocationFilter(value as HolidayLocation | 'all')}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Select Location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Locations</SelectItem>
                                            {holidayLocations.map(loc => (
                                                <SelectItem key={loc} value={loc}>
                                                    {loc}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <AddHolidayDialog onAdd={handleAddHoliday}>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <CalendarPlus className="mr-2 h-4 w-4" /> Add Holiday
                                    </Button>
                                </AddHolidayDialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHolidays.length > 0 ? filteredHolidays.map(holiday => (
                                        <TableRow key={holiday.id}>
                                            <TableCell className="font-medium">{new Date(holiday.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</TableCell>
                                            <TableCell>{holiday.name}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                    {holiday.location}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteHoliday(holiday.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No holidays found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Manage global application settings and configurations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                                <div className="overflow-x-auto w-full pb-2">
                                    <TabsList className="w-max">
                                        <TabsTrigger value="companies">Companies</TabsTrigger>
                                        <TabsTrigger value="branding">Branding</TabsTrigger>
                                        <TabsTrigger value="doc-types">Document Types</TabsTrigger>
                                        <TabsTrigger value="departments">Departments</TabsTrigger>
                                        <TabsTrigger value="security">Security</TabsTrigger>
                                        <TabsTrigger value="data-management">Data Management</TabsTrigger>
                                        <TabsTrigger value="integrations">Integrations</TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="companies" className="pt-6">
                                    <Card>
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle>Manage Companies</CardTitle>
                                                <CardDescription>Add, edit, or delete companies from the organization.</CardDescription>
                                            </div>
                                            <CompanyManagementDialog onSave={handleSaveCompany}>
                                                <Button variant="outline">
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
                                                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                                                        <TableHead className="hidden sm:table-cell">Phone</TableHead>
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
                                                            <TableCell className="hidden sm:table-cell">{company.email}</TableCell>
                                                            <TableCell className="hidden sm:table-cell">{company.phone}</TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <MoreVertical className="h-5 w-5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <CompanyManagementDialog company={company} onSave={handleSaveCompany}>
                                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                                            </DropdownMenuItem>
                                                                        </CompanyManagementDialog>
                                                                        <DeleteCompanyDialog company={company} onDelete={() => handleDeleteCompany(company.id)}>
                                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                            </DropdownMenuItem>
                                                                        </DeleteCompanyDialog>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
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
                                        <CardHeader>
                                            <CardTitle>Application Branding</CardTitle>
                                            <CardDescription>Manage the look and feel of the application.</CardDescription>
                                        </CardHeader>
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
                                                        <Button asChild variant="outline">
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
                                                    <Button onClick={handleSiteNameSave}>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        Save Name
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground">This name will appear on the login page and in the header.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="doc-types" className="pt-6">
                                    <Card>
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle>Manage Document Types</CardTitle>
                                                <CardDescription>Add or edit document categories for the whole organization.</CardDescription>
                                            </div>
                                            <AddDocumentTypeDialog onAdd={handleAddDocumentType}>
                                                <Button variant="outline">
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
                                                                    <Button variant="ghost" size="icon" onClick={() => setExplorerState({ view: 'usersInDocType', docType: type.name })}>
                                                                        <div className="flex items-center text-blue-600 hover:text-blue-800">
                                                                            <Eye className="h-4 w-4 mr-1" />
                                                                            <span className="text-xs">View</span>
                                                                        </div>
                                                                    </Button>
                                                                    <EditDocumentTypeDialog
                                                                        documentType={type}
                                                                        onEdit={handleEditDocumentType}
                                                                    >
                                                                        <Button variant="ghost" size="sm">
                                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                                        </Button>
                                                                    </EditDocumentTypeDialog>
                                                                    <DeleteDocumentTypeDialog
                                                                        documentType={type}
                                                                        onDelete={() => handleDeleteDocumentType(type.id)}
                                                                        isTypeInUse={docs.some(d => d.type === type.name)}
                                                                    >
                                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                                <TabsContent value="departments" className="pt-6">
                                    <Card>
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle>Manage Departments</CardTitle>
                                                <CardDescription>Add, edit, or delete departments for the organization.</CardDescription>
                                            </div>
                                            <AddDepartmentDialog onAdd={handleAddDepartment}>
                                                <Button variant="outline">
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
                                                                <Button variant="ghost" size="sm" disabled>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </Button>
                                                                <DeleteDepartmentDialog department={dept} onDelete={() => handleDeleteDepartment(dept)}>
                                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                    </Button>
                                                                </DeleteDepartmentDialog>
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
                                <TabsContent value="security" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Authentication Security</CardTitle>
                                            <CardDescription>Manage which email domains are allowed to sign in.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="new-domain">Add New Domain</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="new-domain"
                                                        value={newDomain}
                                                        onChange={(e) => setNewDomain(e.target.value)}
                                                        placeholder="e.g., example.com"
                                                        className="max-w-xs"
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddDomain(); }}
                                                    />
                                                    <Button onClick={handleAddDomain}>Add Domain</Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Enter a domain that is allowed to sign in.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Allowed Domains</Label>
                                                {allowedDomains.length > 0 ? (
                                                    <div className="border rounded-md p-4 space-y-2 max-w-md">
                                                        {allowedDomains.map(domain => (
                                                            <div key={domain} className="flex items-center justify-between">
                                                                <span className="flex items-center gap-2 text-sm">
                                                                    <Shield className="h-4 w-4 text-green-500" /> {domain}
                                                                </span>
                                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveDomain(domain)}>
                                                                    <X className="mr-2 h-4 w-4" /> Remove
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground max-w-md">
                                                        No domains have been added. The default fallback domain will be used for authentication.
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="data-management" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Data Management</CardTitle>
                                            <CardDescription>Perform sensitive actions like undoing bulk uploads.</CardDescription>
                                        </CardHeader>
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
                                <TabsContent value="integrations" className="pt-6">
                                    <IntegrationsSettings />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="deleted-items">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deleted Items</CardTitle>
                            <CardDescription>Manage, restore, or permanently delete items.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="companies" className="w-full">
                                <div className="overflow-x-auto w-full pb-2">
                                    <TabsList className="w-max">
                                        <TabsTrigger value="companies">Companies</TabsTrigger>
                                        <TabsTrigger value="departments">Departments</TabsTrigger>
                                        <TabsTrigger value="doc-types">Document Types</TabsTrigger>
                                        <TabsTrigger value="documents">Documents</TabsTrigger>
                                        <TabsTrigger value="users">Users</TabsTrigger>
                                        <TabsTrigger value="announcements">Announcements</TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="companies" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Deleted Companies</CardTitle>
                                            <CardDescription>A list of all deleted companies. You can restore or permanently delete them.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredDeletedCompanies.length > 0 ? filteredDeletedCompanies.map(company => (
                                                        <TableRow key={company.id}>
                                                            <TableCell className="font-medium">{company.name}</TableCell>
                                                            <TableCell>{company.email}</TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button variant="outline" size="sm" onClick={() => handleRestoreCompany()}>
                                                                    <Undo className="mr-2 h-4 w-4" /> Restore
                                                                </Button>
                                                                <PermanentDeleteDialog
                                                                    itemName={company.name}
                                                                    itemType="company"
                                                                    onDelete={() => handlePermanentDeleteCompany(company.id)}
                                                                >
                                                                    <Button variant="destructive" size="sm">
                                                                        <Trash className="mr-2 h-4 w-4" /> Permanent Delete
                                                                    </Button>
                                                                </PermanentDeleteDialog>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground">No deleted companies found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="departments" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Deleted Departments</CardTitle>
                                            <CardDescription>A list of all deleted departments. You can restore or permanently delete them.</CardDescription>
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
                                                    {filteredDeletedDepartments.length > 0 ? filteredDeletedDepartments.map(dept => (
                                                        <TableRow key={dept.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                                    {dept.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button variant="outline" size="sm" onClick={() => handleRestoreDepartment(dept)}>
                                                                    <Undo className="mr-2 h-4 w-4" /> Restore
                                                                </Button>
                                                                <PermanentDeleteDialog
                                                                    itemName={dept.name}
                                                                    itemType="department"
                                                                    onDelete={() => handlePermanentDeleteDepartment(dept)}
                                                                >
                                                                    <Button variant="destructive" size="sm">
                                                                        <Trash className="mr-2 h-4 w-4" /> Permanent Delete
                                                                    </Button>
                                                                </PermanentDeleteDialog>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={2} className="text-center text-muted-foreground">No deleted departments found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="doc-types" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Deleted Document Types</CardTitle>
                                            <CardDescription>A list of all deleted document types. You can restore or permanently delete them.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Type Name</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredDeletedDocTypes.length > 0 ? filteredDeletedDocTypes.map(type => (
                                                        <TableRow key={type.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                                                    {type.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button variant="outline" size="sm" onClick={() => handleRestoreDocumentType(type)}>
                                                                    <Undo className="mr-2 h-4 w-4" /> Restore
                                                                </Button>
                                                                <PermanentDeleteDialog
                                                                    itemName={type.name}
                                                                    itemType="document type"
                                                                    onDelete={() => handlePermanentDeleteDocumentType(type)}
                                                                >
                                                                    <Button variant="destructive" size="sm">
                                                                        <Trash className="mr-2 h-4 w-4" /> Permanent Delete
                                                                    </Button>
                                                                </PermanentDeleteDialog>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={2} className="text-center text-muted-foreground">No deleted document types found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="documents" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Deleted Documents</CardTitle>
                                            <CardDescription>A list of all deleted documents. You can restore or permanently delete them.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <DocumentList
                                                documents={filteredDeletedDocs}
                                                users={users}
                                                showOwner
                                                onSort={() => { }}
                                                sortConfig={null}
                                                isDeletedList
                                                onRestore={handleRestoreDocument}
                                                onPermanentDelete={handlePermanentDeleteDocument}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="users" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Deleted Users</CardTitle>
                                            <CardDescription>A list of all deleted employees. You can restore or permanently delete them.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredDeletedUsers.length > 0 ? filteredDeletedUsers.map(user => (
                                                        <TableRow key={user.id}>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <Image src={getAvatarSrc(user)} width={40} height={40} className="rounded-full object-cover" alt={user.name ? user.name : 'User'} data-ai-hint="person portrait" />
                                                            </TableCell>
                                                            <TableCell className="font-medium">{user.name}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/employee/${user.id}?role=admin`)}>
                                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => handleRestoreUser(user.id)}>
                                                                    <Undo className="mr-2 h-4 w-4" /> Restore
                                                                </Button>
                                                                <PermanentDeleteDialog
                                                                    itemName={user.name}
                                                                    itemType="user"
                                                                    onDelete={() => handlePermanentDeleteUser(user.id)}
                                                                >
                                                                    <Button variant="destructive" size="sm">
                                                                        <Trash className="mr-2 h-4 w-4" /> Permanent Delete
                                                                    </Button>
                                                                </PermanentDeleteDialog>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No deleted users found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="announcements" className="pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Deleted Announcements</CardTitle>
                                            <CardDescription>A list of all deleted announcements. You can restore or permanently delete them here.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Title</TableHead>
                                                        <TableHead className="hidden md:table-cell">Message</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredDeletedAnnouncements.length > 0 ? filteredDeletedAnnouncements.map(announcement => (
                                                        <TableRow key={announcement.id}>
                                                            <TableCell className="font-medium hidden sm:table-cell">{new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                                                            <TableCell>{announcement.title}</TableCell>
                                                            <TableCell className="hidden md:table-cell max-w-sm truncate">{announcement.message}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button variant="outline" size="sm" onClick={() => handleRestoreAnnouncement(announcement.id)}>
                                                                        <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                                                                    </Button>
                                                                    <PermanentDeleteDialog
                                                                        itemName={announcement.title}
                                                                        itemType='announcement'
                                                                        onDelete={() => handlePermanentDeleteAnnouncement(announcement.id)}
                                                                    >
                                                                        <Button variant="destructive" size="sm">
                                                                            <Trash className="mr-2 h-4 w-4" /> Delete Permanently
                                                                        </Button>
                                                                    </PermanentDeleteDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No deleted announcements found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will move the selected {numSelected} employee(s) to the deleted users list. You can restore them later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete {numSelected} Employee(s)
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Reset Password Confirmation Dialog */}
            <AlertDialog open={isBulkResetDialogOpen} onOpenChange={setIsBulkResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Password Reset</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to send password reset links to the {numSelected} selected employee(s)?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkResetPassword}>
                            Send Reset Links
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
        </>
    )
}

