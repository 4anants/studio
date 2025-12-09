
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
import { users as initialUsers, documents as allDocuments, documentTypesList, User, Document, departments as initialDepartments, holidays as initialHolidays, Holiday, HolidayLocation, holidayLocations, announcements as initialAnnouncements, Announcement, CompanyName, companies as initialCompanies, Company } from '@/lib/mock-data'
import { Search, MoreVertical, Edit, Trash2, KeyRound, Undo, FolderPlus, Tag, Building, CalendarPlus, Bell, Settings, UploadCloud, X, FileLock2, Users, Upload, Download, ArchiveRestore, Folder, Save, Eye, Home, Trash, ArrowLeft, Shield } from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import Image from 'next/image'
import { BulkUploadDialog } from '@/components/dashboard/bulk-upload-dialog'
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
import { useAuth } from '@/firebase'
import type { Auth } from 'firebase/auth'
import { ToastAction } from '@/components/ui/toast'

type ExplorerState = { view: 'docTypes' } | { view: 'usersInDocType', docType: string }

export function AdminView() {
  const [docs, setDocs] = useState(allDocuments)
  const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
  const [users, setUsers] = useState(initialUsers)
  const [documentTypes, setDocumentTypes] = useState(documentTypesList);
  const [deletedDocumentTypes, setDeletedDocumentTypes] = useState<string[]>([]);
  const [departments, setDepartments] = useState(initialDepartments);
  const [deletedDepartments, setDeletedDepartments] = useState<string[]>([]);
  const [companies, setCompanies] = useState(initialCompanies);
  const [deletedCompanies, setDeletedCompanies] = useState<Company[]>([]);
  const [holidays, setHolidays] = useState(initialHolidays);
  const [announcements, setAnnouncements] = useState(initialAnnouncements.map(a => ({...a, isRead: true, status: a.status || 'published'}))); // Admins see all as read initially
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkResetDialogOpen, setIsBulkResetDialogOpen] = useState(false)
  const [lastBulkUploadIds, setLastBulkUploadIds] = useState<string[]>([]);
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('file-explorer');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [holidayLocationFilter, setHolidayLocationFilter] = useState<HolidayLocation | 'all'>('all');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [siteName, setSiteName] = useState(CompanyName);
  const [tempSiteName, setTempSiteName] = useState(CompanyName);
  const [explorerState, setExplorerState] = useState<ExplorerState>({ view: 'docTypes' });
  const [auth, setAuth] = useState<Auth | null>(null);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const authHook = useAuth();

  useEffect(() => {
    if (authHook) {
        setAuth(authHook);
    }
  }, [authHook]);


  useEffect(() => {
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
    if (lastBulkUploadIds.length > 0) {
      setDocs(prev => prev.filter(d => !lastBulkUploadIds.includes(d.id)));
      toast({
        title: 'Upload Undone',
        description: `${lastBulkUploadIds.length} document(s) have been removed.`,
      });
      setLastBulkUploadIds([]);
    }
    setIsUndoDialogOpen(false);
  };

  const handleBulkUploadComplete = useCallback((newDocs: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[], originalFiles: File[]) => {
    const docIds: string[] = [];
    const fullNewDocs: Document[] = newDocs.map((d, i) => {
        const id = `doc-${Date.now()}-${i}`;
        docIds.push(id);
        return {
            ...d,
            id: id,
            size: `${(originalFiles[i].size / 1024).toFixed(0)} KB`,
            uploadDate: new Date().toISOString().split('T')[0],
            fileType: d.name.endsWith('.pdf') ? 'pdf' : d.name.endsWith('.doc') || d.name.endsWith('.docx') ? 'doc' : 'image',
        };
    });
    setDocs(prev => [...fullNewDocs, ...prev]);
    setLastBulkUploadIds(docIds);

    toast({
        title: 'Upload Successful!',
        description: `${newDocs.length} documents have been added.`,
        action: (
          <ToastAction altText="Undo" onClick={() => setIsUndoDialogOpen(true)}>
            Undo
          </ToastAction>
        ),
    });

  }, [toast]);

  const handleEmployeeSave = useCallback((employee: Partial<User> & { originalId?: string }) => {
    const isSadmin = employee.originalId === 'sadmin' || employee.id === 'sadmin';

    if (isSadmin && (employee.id !== 'sadmin' || employee.email !== 'sadmin@internal.local' || employee.role !== 'admin')) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'You cannot modify the Super Admin ID, email, or role.',
        });
        return;
    }

    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === (employee.originalId || employee.id));
      if (userIndex > -1) {
        // Update existing user
        const updatedUsers = [...prevUsers];
        const existingUser = updatedUsers[userIndex];
        const updatedUser = {
            ...existingUser,
            ...employee,
        };
        updatedUsers[userIndex] = updatedUser as User;
        
        if (updatedUser.id === 'user-1' && employee.originalId === 'user-1') {
            toast({
                title: "Profile Updated",
                description: `Your profile has been successfully updated.`,
            });
        } else if ('id' in employee && employee.id !== employee.originalId) {
            toast({
                title: "Profile Updated",
                description: `An email notification has been sent to the admins regarding the update of ${updatedUser.name}'s profile.`,
            });
        } else if (isSadmin) {
            toast({
                title: 'Super Admin Updated',
                description: 'Super Admin profile has been updated.',
            });
        }
        return updatedUsers;
      } else {
        // Add new user
        const newUser: User = {
           id: employee.id || `user-${Date.now()}`,
           name: employee.name || 'New User',
           email: employee.email || 'new@user.com',
           personalEmail: employee.personalEmail,
           avatar: employee.avatar || String(Date.now()),
           mobile: employee.mobile,
           // password: employee.password, // Password is not stored in state
           dateOfBirth: employee.dateOfBirth,
           joiningDate: employee.joiningDate,
           resignationDate: employee.resignationDate,
           designation: employee.designation,
           status: employee.status || 'pending',
           department: employee.department,
           role: employee.role || 'employee',
        };
        return [...prevUsers, newUser];
      }
    });
  }, [toast]);

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


  const handleEmployeeDelete = useCallback((employeeId: string) => {
    if (employeeId === 'sadmin') {
        toast({ variant: 'destructive', title: 'Action Forbidden', description: 'The Super Admin account cannot be deleted.' });
        return;
    }
    setUsers(prevUsers => prevUsers.map(u => 
        u.id === employeeId ? { ...u, status: 'deleted' } : u
    ));
    setSelectedUserIds(prev => prev.filter(id => id !== employeeId));
    toast({
        title: "Employee Deleted",
        description: `The employee has been moved to the deleted users list.`
    });
  }, [toast]);
  
  const handleRestoreUser = useCallback((employeeId: string) => {
    setUsers(prevUsers => prevUsers.map(u => 
        u.id === employeeId ? { ...u, status: 'active' } : u
    ));
    toast({
        title: "Employee Restored",
        description: `The employee has been restored to the active list.`
    });
  }, [toast]);

  const handlePermanentDeleteUser = useCallback((employeeId: string) => {
    if (employeeId === 'sadmin') {
        toast({ variant: 'destructive', title: 'Action Forbidden', description: 'The Super Admin account cannot be permanently deleted.' });
        return;
    }
    setUsers(prevUsers => prevUsers.filter(u => u.id !== employeeId));
    toast({
      variant: 'destructive',
      title: 'User Permanently Deleted',
      description: 'The user has been permanently removed from the system.',
    });
  }, [toast]);

  const handleResetPassword = useCallback((employeeId: string) => {
    if (employeeId === 'sadmin') {
        toast({ variant: 'destructive', title: 'Action Forbidden', description: 'Password for the Super Admin must be changed via the edit profile screen.' });
        return;
    }
    if (!auth) return;
    const user = users.find(u => u.id === employeeId);
    if (user && user.email) {
        auth.sendPasswordResetEmail(user.email)
            .then(() => {
                toast({
                    title: "Password Reset Link Sent",
                    description: `An email has been sent to ${user.name} with password reset instructions.`
                });
            })
            .catch(error => {
                toast({
                    variant: 'destructive',
                    title: "Error Sending Reset Email",
                    description: error.message,
                });
            });
    }
  }, [auth, toast, users]);

  const handleAddDocumentType = useCallback((newType: string) => {
    setDocumentTypes(prev => {
        if (!prev.find(dt => dt.toLowerCase() === newType.toLowerCase())) {
            toast({
                title: 'Document Type Added',
                description: `"${newType.trim()}" has been added to the list of document types.`,
            });
            return [...prev, newType];
        } else {
            toast({
                variant: 'destructive',
                title: 'Duplicate Type',
                description: `"${newType.trim()}" already exists.`,
            });
            return prev;
        }
    });
  }, [toast]);

  const handleEditDocumentType = useCallback((oldType: string, newType: string) => {
    if (oldType.toLowerCase() === newType.toLowerCase()) return;
  
    if (documentTypes.find(dt => dt.toLowerCase() === newType.toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Type',
            description: `"${newType.trim()}" already exists.`,
        });
        return;
    }

    setDocumentTypes(prev => prev.map(dt => dt === oldType ? newType : dt));
    setDocs(prevDocs => prevDocs.map(doc => doc.type === oldType ? { ...doc, type: newType } : doc));
    toast({
      title: 'Document Type Updated',
      description: `"${oldType}" has been renamed to "${newType}" and all associated documents have been updated.`,
    });
  }, [documentTypes, toast]);


  const handleDeleteDocumentType = useCallback((typeToDelete: string) => {
    const isTypeInUse = docs.some(d => d.type === typeToDelete);
    if (isTypeInUse) {
        toast({
            variant: 'destructive',
            title: 'Cannot Delete Document Type',
            description: `"${typeToDelete}" is currently in use by one or more documents. Please re-assign them before deleting.`,
        });
        return;
    }
    setDocumentTypes(prev => prev.filter(dt => dt !== typeToDelete));
    setDeletedDocumentTypes(prev => [...prev, typeToDelete]);
    toast({
      title: 'Document Type Deleted',
      description: `"${typeToDelete}" has been moved to the deleted items list.`,
    });
  }, [docs, toast]);
  
  const handleRestoreDocumentType = useCallback((typeToRestore: string) => {
    setDeletedDocumentTypes(prev => prev.filter(d => d !== typeToRestore));
    setDocumentTypes(prev => [...prev, typeToRestore]);
    toast({
      title: 'Document Type Restored',
      description: `"${typeToRestore}" has been restored.`,
    });
  }, [toast]);

  const handlePermanentDeleteDocumentType = useCallback((typeToDelete: string) => {
    setDeletedDocumentTypes(prev => prev.filter(d => d !== typeToDelete));
    toast({
        variant: 'destructive',
        title: 'Document Type Permanently Deleted',
        description: `"${typeToDelete}" has been permanently removed.`,
    });
  }, [toast]);

  const handleAddDepartment = useCallback((newDepartment: string) => {
    setDepartments(prev => {
        if (!prev.find(d => d.toLowerCase() === newDepartment.toLowerCase())) {
          toast({
            title: 'Department Added',
            description: `"${newDepartment.trim()}" has been added to the list of departments.`,
          });
          return [...prev, newDepartment];
        } else {
          toast({
            variant: 'destructive',
            title: 'Duplicate Department',
            description: `"${newDepartment.trim()}" already exists.`,
          });
          return prev;
        }
    });
  }, [toast]);

  const handleDeleteDepartment = useCallback((departmentToDelete: string) => {
    setDepartments(prev => prev.filter(d => d !== departmentToDelete));
    setDeletedDepartments(prev => [...prev, departmentToDelete]);
    toast({
      title: 'Department Deleted',
      description: `"${departmentToDelete}" has been moved to the deleted items list.`,
    });
  }, [toast]);

  const handleRestoreDepartment = useCallback((departmentToRestore: string) => {
    setDeletedDepartments(prev => prev.filter(d => d !== departmentToRestore));
    setDepartments(prev => [...prev, departmentToRestore]);
    toast({
      title: 'Department Restored',
      description: `"${departmentToRestore}" has been restored.`,
    });
  }, [toast]);
  
  const handlePermanentDeleteDepartment = useCallback((departmentToDelete: string) => {
    const isDeptInUse = users.some(u => u.department === departmentToDelete);
    if (isDeptInUse) {
        toast({
            variant: 'destructive',
            title: 'Cannot Delete Department',
            description: `"${departmentToDelete}" is currently assigned to one or more employees. Please reassign them before permanently deleting.`,
        });
        return;
    }
    setDeletedDepartments(prev => prev.filter(d => d !== departmentToDelete));
    toast({
        variant: 'destructive',
        title: 'Department Permanently Deleted',
        description: `"${departmentToDelete}" has been permanently removed.`,
    });
  }, [toast, users]);


  const handleAddHoliday = useCallback((newHoliday: {name: string, date: Date, location: HolidayLocation}) => {
    const newHolidayItem: Holiday = {
      id: `h-${Date.now()}`,
      name: newHoliday.name,
      date: newHoliday.date.toISOString().split('T')[0],
      location: newHoliday.location,
    };
    setHolidays(prev => [...prev, newHolidayItem].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({
      title: 'Holiday Added',
      description: `"${newHoliday.name}" has been added to the holiday list.`,
    });
  }, [toast]);

  const handleDeleteHoliday = useCallback((holidayId: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
    toast({
      title: 'Holiday Deleted',
      description: 'The holiday has been removed from the list.',
    });
  }, [toast]);

  const handleAddAnnouncement = useCallback((announcement: { title: string, message: string, eventDate?: string }) => {
    const newAnnouncement: Announcement = {
      id: `anno-${Date.now()}`,
      title: announcement.title,
      message: announcement.message,
      date: new Date().toISOString(),
      author: 'Admin',
      isRead: true, // New announcements by admin are 'read' for them
      status: 'published',
      eventDate: announcement.eventDate
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    toast({
      title: 'Announcement Published',
      description: 'A notification has been sent to all employees.',
    });
  }, [toast]);

  const handleDeleteAnnouncement = useCallback((announcementId: string) => {
    setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, status: 'deleted' } : a));
    toast({
      title: 'Announcement Deleted',
      description: 'The announcement has been moved to the deleted list.',
    });
  }, [toast]);

  const handleRestoreAnnouncement = useCallback((announcementId: string) => {
    setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, status: 'published' } : a));
    toast({
      title: 'Announcement Restored',
      description: 'The announcement has been restored and is now visible to employees.',
    });
  }, [toast]);

  const handlePermanentDeleteAnnouncement = useCallback((announcementId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    toast({
      variant: 'destructive',
      title: 'Announcement Permanently Deleted',
      description: 'The announcement has been permanently removed from the system.',
    });
  }, [toast]);

  const handleSaveCompany = useCallback((companyToSave: Company) => {
    const isEditing = companies.some(c => c.id === companyToSave.id && companyToSave.id);
  
    setCompanies(prev => {
      if (isEditing) {
        return prev.map(c => c.id === companyToSave.id ? companyToSave : c);
      } else {
        const newCompany = { ...companyToSave, id: `comp-${Date.now()}` };
        return [...prev, newCompany];
      }
    });
  
    if (isEditing) {
      toast({ title: 'Company Updated', description: `Details for ${companyToSave.name} have been updated.` });
    } else {
      toast({ title: 'Company Added', description: `${companyToSave.name} has been added.` });
    }
  }, [toast, companies]);

  const handleDeleteCompany = useCallback((companyId: string) => {
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

    setCompanies(prev => prev.filter(c => c.id !== companyId));
    setDeletedCompanies(prev => [...prev, companyToDelete]);
    toast({
        title: 'Company Deleted',
        description: `"${companyToDelete.name}" has been moved to the deleted items list.`,
    });
  }, [companies, users, toast]);

  const handleRestoreCompany = useCallback((companyId: string) => {
    const companyToRestore = deletedCompanies.find(c => c.id === companyId);
    if (companyToRestore) {
        setDeletedCompanies(prev => prev.filter(c => c.id !== companyId));
        setCompanies(prev => [...prev, companyToRestore]);
        toast({
            title: 'Company Restored',
            description: `"${companyToRestore.name}" has been restored.`
        });
    }
  }, [deletedCompanies, toast]);

  const handlePermanentDeleteCompany = useCallback((companyId: string) => {
    setDeletedCompanies(prev => prev.filter(c => c.id !== companyId));
    toast({
        variant: 'destructive',
        title: 'Company Permanently Deleted',
        description: 'The company has been permanently removed from the system.',
    });
  }, [toast]);


  const activeUsers = useMemo(() => users.filter(user => user.status === 'active' || user.status === 'inactive' || user.status === 'pending'), [users]);
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
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [filteredByRole, searchTerm]);
  
  const filteredActiveUsersForTable = useMemo(() => filteredByRole.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [filteredByRole, searchTerm]);

  const filteredDeletedUsers = useMemo(() => deletedUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [deletedUsers, searchTerm]);

  const filteredDocTypes = useMemo(() => documentTypes.filter(type => 
    type.toLowerCase().includes(searchTerm.toLowerCase())
  ), [documentTypes, searchTerm]);

  const filteredDeletedDocTypes = useMemo(() => deletedDocumentTypes.filter(type => 
    type.toLowerCase().includes(searchTerm.toLowerCase())
  ), [deletedDocumentTypes, searchTerm]);

  const filteredDepartments = useMemo(() => departments.filter(dept =>
    dept.toLowerCase().includes(searchTerm.toLowerCase())
  ), [departments, searchTerm]);

  const filteredDeletedDepartments = useMemo(() => deletedDepartments.filter(dept =>
    dept.toLowerCase().includes(searchTerm.toLowerCase())
  ), [deletedDepartments, searchTerm]);

  const filteredCompanies = useMemo(() => companies.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) || (comp.shortName && comp.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [companies, searchTerm]);

  const filteredDeletedCompanies = useMemo(() => deletedCompanies.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [deletedCompanies, searchTerm]);


  const filteredHolidays = useMemo(() => {
    return holidays.filter(holiday => 
      holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (holidayLocationFilter === 'all' || holiday.location === holidayLocationFilter)
    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [holidays, searchTerm, holidayLocationFilter]);
  
  const filteredAnnouncements = useMemo(() => {
    return publishedAnnouncements.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.message.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [publishedAnnouncements, searchTerm]);

  const filteredDeletedAnnouncements = useMemo(() => {
    return deletedAnnouncements.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.message.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [deletedAnnouncements, searchTerm]);
  
  const filteredDeletedDocs = useMemo(() => {
    return deletedDocs.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
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

  const filteredUsersForSelection = activeSubTab === 'manage' ? filteredActiveUsersForTable.filter(u => u.id !== 'sadmin') : [];

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

  const handleDeleteDocument = useCallback((docId: string) => {
    const docToDelete = docs.find(d => d.id === docId);
    if (docToDelete) {
        setDocs(prev => prev.filter(d => d.id !== docId));
        setDeletedDocs(prev => [...prev, docToDelete]);
        toast({
            title: "Document Deleted",
            description: `"${docToDelete.name}" has been moved to deleted items.`
        });
    }
  }, [docs, toast]);

  const handleBulkDeleteDocuments = useCallback((docIds: string[]) => {
    const docsToDelete = docs.filter(d => docIds.includes(d.id));
    if (docsToDelete.length > 0) {
        setDocs(prev => prev.filter(d => !docIds.includes(d.id)));
        setDeletedDocs(prev => [...prev, ...docsToDelete]);
        toast({
            title: "Documents Deleted",
            description: `${docsToDelete.length} document(s) have been moved to deleted items.`
        });
    }
  }, [docs, toast]);

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
    if(docToDelete) {
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
      today.setHours(0,0,0,0);
      const eDate = new Date(eventDate);
      eDate.setTime(eDate.getTime() + eDate.getTimezoneOffset() * 60 * 1000); // Adjust for timezone
      return eDate >= today;
  }

  const getUserFromId = (id: string) => users.find(u => u.id === id);

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
                            {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>
                                    {dept}
                                </SelectItem>
                            ))}
                            {activeTab === 'file-explorer' && <SelectItem value="unassigned">Unassigned Documents</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Role</Label>
                    <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as any)}>
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
                            <Button variant="outline" size="icon" onClick={() => setExplorerState({ view: 'docTypes'})}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Employees with "{explorerState.docType}"</CardTitle>
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
                                    onSort={() => {}}
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
                            {documentTypes.filter(dt => dt.toLowerCase().includes(searchTerm.toLowerCase())).map(docType => (
                                <Card 
                                    key={docType}
                                    className="cursor-pointer hover:border-primary transition-all group"
                                    onClick={() => setExplorerState({ view: 'usersInDocType', docType })}
                                >
                                    <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                                        <Folder className="h-16 w-16 text-primary group-hover:scale-105 transition-transform" />
                                        <p className="text-sm font-medium text-center truncate w-full">{docType}</p>
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
                                            <Image src={getAvatarSrc(user)} width={64} height={64} className="rounded-full object-cover" alt={user.name} data-ai-hint="person portrait" />
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
                                      <Image src={getAvatarSrc(user)} width={64} height={64} className="rounded-full object-cover" alt={user.name} data-ai-hint="person portrait" />
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
                                          <Image src={getAvatarSrc(user)} width={40} height={40} className="rounded-full object-cover" alt={user.name} data-ai-hint="person portrait" />
                                      </TableCell>
                                      <TableCell className="font-medium">{user.name}</TableCell>
                                      <TableCell>{user.email}</TableCell>
                                      <TableCell className="hidden lg:table-cell">{user.department || 'N/A'}</TableCell>
                                      <TableCell className="hidden md:table-cell">
                                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                          )}>
                                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                          </span>
                                      </TableCell>
                                      <TableCell>
                                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', 
                                              user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                              user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'
                                          )}>
                                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
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
                                <TableRow key={announcement.id} className={cn(isUpcoming && "bg-blue-500/10 ring-2 ring-destructive animate-pulse")}>
                                     <TableCell className="font-medium hidden sm:table-cell">
                                        {new Date(announcement.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </TableCell>
                                    <TableCell>{announcement.title}</TableCell>
                                    <TableCell className="hidden md:table-cell max-w-sm truncate">{announcement.message}</TableCell>
                                     <TableCell>
                                        {announcement.eventDate ? (
                                            <div className="flex items-center gap-2">
                                                 <span className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    new Date(announcement.eventDate) > new Date() ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                )}>
                                                    {new Date(announcement.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                                </span>
                                            </div>
                                        ): <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DeleteAnnouncementDialog announcement={announcement} onDelete={() => handleDeleteAnnouncement(announcement.id)} isPermanent={false}>
                                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </DeleteAnnouncementDialog>
                                    </TableCell>
                                </TableRow>
                           )}) : (
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
                           <Select value={holidayLocationFilter} onValueChange={(value) => setHolidayLocationFilter(value as any)}>
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
                                    <TableCell className="font-medium">{new Date(holiday.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</TableCell>
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
                <Tabs defaultValue="companies" className="w-full">
                  <div className="overflow-x-auto w-full pb-2">
                    <TabsList className="w-max">
                      <TabsTrigger value="companies">Companies</TabsTrigger>
                      <TabsTrigger value="branding">Branding</TabsTrigger>
                      <TabsTrigger value="doc-types">Document Types</TabsTrigger>
                      <TabsTrigger value="departments">Departments</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="data-management">Data Management</TabsTrigger>
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
                                                    <Image src={company.logo} alt={company.name} width={40} height={40} className="rounded-md object-cover"/>
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
                                            <Image src={logoSrc} alt="Current Logo" width={80} height={80} className="rounded-full object-cover"/>
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
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                   {filteredDocTypes.length > 0 ? filteredDocTypes.map(type => (
                                        <TableRow key={type}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                                    {type}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
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
                                                    onDelete={() => handleDeleteDocumentType(type)}
                                                    isTypeInUse={docs.some(d => d.type === type)}
                                                >
                                                     <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </Button>
                                                </DeleteDocumentTypeDialog>
                                            </TableCell>
                                        </TableRow>
                                   )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">No document types found.</TableCell>
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
                                        <TableRow key={dept}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    {dept}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" disabled>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Button>
                                                <DeleteDepartmentDialog departmentName={dept} onDelete={() => handleDeleteDepartment(dept)}>
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
                                                    <Shield className="h-4 w-4 text-green-500"/> {domain}
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
                                        <p className="text-sm text-destructive/80">This will permanently delete the last batch of {lastBulkUploadIds.length} uploaded document(s). This action cannot be undone.</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setIsUndoDialogOpen(true)}
                                        disabled={lastBulkUploadIds.length === 0}
                                    >
                                        <Undo className="mr-2 h-4 w-4" />
                                        Undo Last Upload ({lastBulkUploadIds.length})
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
                                                        <Button variant="outline" size="sm" onClick={() => handleRestoreCompany(company.id)}>
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
                                                <TableRow key={dept}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Building className="h-4 w-4 text-muted-foreground" />
                                                            {dept}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleRestoreDepartment(dept)}>
                                                            <Undo className="mr-2 h-4 w-4" /> Restore
                                                        </Button>
                                                         <PermanentDeleteDialog
                                                          itemName={dept}
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
                                                <TableRow key={type}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                                            {type}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleRestoreDocumentType(type)}>
                                                            <Undo className="mr-2 h-4 w-4" /> Restore
                                                        </Button>
                                                        <PermanentDeleteDialog
                                                            itemName={type}
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
                                        onSort={() => {}}
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
                                                        <Image src={getAvatarSrc(user)} width={40} height={40} className="rounded-full object-cover" alt={user.name} data-ai-hint="person portrait" />
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
                                                    <TableCell className="font-medium hidden sm:table-cell">{new Date(announcement.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
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
              This will permanently delete the last batch of {lastBulkUploadIds.length} uploaded document(s). This action cannot be undone.
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
