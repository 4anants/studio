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
import { users as initialUsers, documents as allDocuments, documentTypesList, User, Document, departments as initialDepartments, holidays as initialHolidays, Holiday, HolidayLocation, holidayLocations, announcements as initialAnnouncements, Announcement, CompanyName } from '@/lib/mock-data'
import { Search, MoreVertical, Edit, Trash2, KeyRound, Undo, FolderPlus, Tag, Building, CalendarPlus, Bell, Settings, UploadCloud, X, FileLock2, ShieldQuestion, Users, Upload, Download, ArchiveRestore, Folder, Save, AlertTriangle } from 'lucide-react'
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
import { cn } from '@/lib/utils'
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DocumentList } from '@/components/dashboard/document-list'

export function AdminView() {
  const [docs, setDocs] = useState(allDocuments)
  const [users, setUsers] = useState(initialUsers)
  const [documentTypes, setDocumentTypes] = useState(documentTypesList);
  const [departments, setDepartments] = useState(initialDepartments);
  const [holidays, setHolidays] = useState(initialHolidays);
  const [announcements, setAnnouncements] = useState(initialAnnouncements.map(a => ({...a, isRead: true, status: a.status || 'published'}))); // Admins see all as read initially
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkResetDialogOpen, setIsBulkResetDialogOpen] = useState(false)
  const [isBulkRoleChangeDialogOpen, setIsBulkRoleChangeDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('file-explorer');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [holidayLocationFilter, setHolidayLocationFilter] = useState<HolidayLocation | 'all'>('all');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [siteName, setSiteName] = useState(CompanyName);
  const [tempSiteName, setTempSiteName] = useState(CompanyName);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const handleViewAnnouncements = () => {
      setActiveTab('announcements');
    };
    window.addEventListener('view-announcements', handleViewAnnouncements);
    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
    const storedSiteName = localStorage.getItem('siteName');
    if (storedSiteName) {
      setSiteName(storedSiteName);
      setTempSiteName(storedSiteName);
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

  const handleBulkUploadComplete = useCallback((newDocs: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[]) => {
    const fullNewDocs: Document[] = newDocs.map(d => ({
        ...d,
        id: `doc-${Date.now()}-${Math.random()}`,
        size: `${(Math.random() * 1000).toFixed(0)} KB`,
        uploadDate: new Date().toISOString().split('T')[0],
        fileType: d.name.endsWith('.pdf') ? 'pdf' : d.name.endsWith('.doc') || d.name.endsWith('.docx') ? 'doc' : 'image',
    }))
    setDocs(prev => [...fullNewDocs, ...prev]);
  }, []);

  const handleEmployeeSave = useCallback((employee: Partial<User> & { originalId?: string }) => {
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
        
        if ('id' in employee && employee.id !== employee.originalId) {
            toast({
                title: "Profile Updated",
                description: `An email notification has been sent to the admins regarding the update of ${updatedUser.name}'s profile.`,
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
           password: employee.password,
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

  const handleResetPassword = useCallback((employeeName: string) => {
    toast({
      title: "Password Reset Link Sent",
      description: `An email has been sent to ${employeeName} with password reset instructions.`
    });
  }, [toast]);

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
    // Also update users who were in this department
    setUsers(prevUsers => prevUsers.map(u => u.department === departmentToDelete ? { ...u, department: undefined } : u));
    toast({
      title: 'Department Deleted',
      description: `"${departmentToDelete}" has been deleted.`,
    });
  }, [toast]);

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
      title: 'Announcement Permanently Deleted',
      description: 'The announcement has been permanently removed from the system.',
    });
  }, [toast]);


  const activeUsers = useMemo(() => users.filter(user => user.status === 'active' || user.status === 'inactive' || user.status === 'pending'), [users]);
  const deletedUsers = useMemo(() => users.filter(user => user.status === 'deleted'), [users]);
  
  const publishedAnnouncements = useMemo(() => announcements.filter(a => a.status === 'published'), [announcements]);
  const deletedAnnouncements = useMemo(() => announcements.filter(a => a.status === 'deleted'), [announcements]);


  const filteredByDept = useMemo(() => {
    if (departmentFilter === 'all' || departmentFilter === 'unassigned') {
        return activeUsers;
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

  const filteredDepartments = useMemo(() => departments.filter(dept =>
    dept.toLowerCase().includes(searchTerm.toLowerCase())
  ), [departments, searchTerm]);

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

    const { documentsByOwner, unassignedDocuments } = useMemo(() => {
        const userIds = new Set(users.map(u => u.id));
        const ownerMap: Record<string, Document[]> = {};
        const unassigned: Document[] = [];
    
        docs.forEach(doc => {
          if (doc.ownerId && userIds.has(doc.ownerId)) {
            if (!ownerMap[doc.ownerId]) {
              ownerMap[doc.ownerId] = [];
            }
            ownerMap[doc.ownerId].push(doc);
          } else {
            unassigned.push(doc);
          }
        });
    
        return { documentsByOwner: ownerMap, unassignedDocuments: unassigned };
      }, [docs, users]);

  const filteredUsersForSelection = activeSubTab === 'manage' ? filteredActiveUsersForTable : [];

  const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedUserIds(filteredUsersForSelection.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  }, [filteredUsersForSelection]);
  
  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
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
        description: `${selectedUserIds.length} employee(s) have been moved to the deleted list.`
    });
    setSelectedUserIds([]);
    setIsBulkDeleteDialogOpen(false);
  }, [selectedUserIds, toast]);

  const handleBulkResetPassword = useCallback(() => {
    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
    selectedUsers.forEach(user => handleResetPassword(user.name));
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
    setIsBulkRoleChangeDialogOpen(false);
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
  
  const onTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setSelectedUserIds([]);
    setSearchTerm('');
    setDepartmentFilter('all');
    setRoleFilter('all');
    setHolidayLocationFilter('all');
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


  return (
    <>
      <div className="flex items-center justify-between">
         <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{siteName}</h1>
            <p className="text-muted-foreground">Manage all employee documents and profiles.</p>
        </div>
        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
                <EmployeeManagementDialog onSave={handleEmployeeSave} departments={departments}>
                    <Button>Add Employee</Button>
                </EmployeeManagementDialog>
                <BulkUploadDialog onBulkUploadComplete={handleBulkUploadComplete} users={activeUsers} />
            </div>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className="flex items-center mb-4">
            <TabsList>
                <TabsTrigger value="file-explorer">File Explorer</TabsTrigger>
                <TabsTrigger value="employee-management">Employee Management</TabsTrigger>
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
                <TabsTrigger value="holidays">Holidays</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={
                            activeTab === 'file-explorer' ? 'Search employee folders...'
                            : activeTab === 'employee-management' ? 'Search employees...'
                            : activeTab === 'holidays' ? 'Search holidays...'
                            : activeTab === 'announcements' ? 'Search announcements...'
                            : activeTab === 'settings' ? 'Search settings...'
                            : 'Search...'
                        }
                        className="w-full sm:w-[300px] pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {(activeTab === 'employee-management' || activeTab === 'file-explorer') && (
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="grid gap-2">
                        <Label className="text-sm font-medium">Department</Label>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-[220px]">
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
                    <div className="grid gap-2">
                        <Label className="text-sm font-medium">Role</Label>
                         <div className="flex flex-wrap items-center gap-2">
                             <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as any)}>
                                <SelectTrigger className="w-[180px]">
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
                </CardContent>
            </Card>
        )}

        <TabsContent value="file-explorer">
            <Card>
                <CardHeader>
                    <CardTitle>Employee Folders</CardTitle>
                    <CardDescription>Browse all documents by employee. Unassigned documents are at the top.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full" defaultValue={unassignedDocuments.length > 0 && (departmentFilter === 'all' || departmentFilter === 'unassigned') ? ['unassigned'] : []}>
                       {(departmentFilter === 'all' || departmentFilter === 'unassigned') && unassignedDocuments.length > 0 && (
                            <AccordionItem value="unassigned" className="border-b-0">
                                <AccordionTrigger>
                                     <div className="flex items-center gap-3">
                                        <FileLock2 className="h-5 w-5 text-destructive" />
                                        <span className="font-medium text-destructive">Unassigned Documents</span>
                                        <span className="text-sm text-muted-foreground">({unassignedDocuments.length} documents)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-8 pt-0">
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
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {departmentFilter !== 'unassigned' && filteredActiveUsersForGrid.map(user => (
                            <AccordionItem value={user.id} key={user.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <Folder className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-sm text-muted-foreground">({documentsByOwner[user.id]?.length || 0} documents)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-8">
                                    <DocumentList 
                                        documents={documentsByOwner[user.id] || []}
                                        users={users}
                                        onSort={() => {}} 
                                        sortConfig={null} 
                                        onReassign={handleReassignDocument}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                         {departmentFilter !== 'unassigned' && filteredActiveUsersForGrid.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <p>No employees found based on the current filters.</p>
                            </div>
                        )}
                    </Accordion>
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
                                      <Image src={`https://picsum.photos/seed/${user.avatar}/64/64`} width={64} height={64} className="rounded-full" alt={user.name} data-ai-hint="person portrait" />
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
                      <div className="flex items-center justify-between">
                          <div>
                              <CardTitle>Manage Employees</CardTitle>
                              <CardDescription>A list of all active employees in the system.</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                              <Button onClick={handleExportUsers} variant="outline">
                                  <Download className="mr-2 h-4 w-4" /> 
                                  {numSelected > 0 ? `Export Selected (${numSelected})` : 'Export All Users'}
                              </Button>
                              <BulkUserImportDialog onImport={handleBulkUserImport}>
                                  <Button variant="outline">
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
                                          />
                                      </TableCell>
                                      <TableCell className="hidden sm:table-cell">
                                          <Image src={`https://picsum.photos/seed/${user.avatar}/40/40`} width={40} height={40} className="rounded-full" alt={user.name} data-ai-hint="person portrait" />
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
                                          <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon">
                                                      <MoreVertical className="h-5 w-5" />
                                                  </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                  <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave} departments={departments}>
                                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                          <Edit className="mr-2 h-4 w-4" />
                                                          Edit Employee
                                                      </DropdownMenuItem>
                                                  </EmployeeManagementDialog>
                                                  <DropdownMenuItem onClick={() => handleResetPassword(user.name)}>
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
                <CardHeader className="flex flex-row items-center justify-between">
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
                                <TableHead>Date</TableHead>
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
                                <TableRow key={announcement.id} className={cn(isUpcoming && "bg-blue-500/10 animate-pulse")}>
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
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex-grow sm:flex-grow-0">
                           <p className="text-sm font-medium text-muted-foreground">Location</p>
                           <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button
                                    variant={holidayLocationFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setHolidayLocationFilter('all')}
                                >
                                    All
                                </Button>
                                {holidayLocations.filter(l => l !== 'ALL').map(loc => (
                                    <Button
                                        key={loc}
                                        variant={holidayLocationFilter === loc ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setHolidayLocationFilter(loc)}
                                    >
                                        {loc}
                                    </Button>
                                ))}
                            </div>
                        </div>
                         <AddHolidayDialog onAdd={handleAddHoliday}>
                            <Button variant="outline">
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
                <Tabs defaultValue="branding" className="w-full">
                  <TabsList>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="doc-types">Document Types</TabsTrigger>
                    <TabsTrigger value="departments">Departments</TabsTrigger>
                    <TabsTrigger value="deleted-users">Deleted Users</TabsTrigger>
                    <TabsTrigger value="deleted-announcements">Deleted Announcements</TabsTrigger>
                  </TabsList>
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
                        <CardHeader className="flex flex-row items-center justify-between">
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
                                                <Button variant="ghost" size="sm" disabled>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Button>
                                                 <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </Button>
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
                        <CardHeader className="flex flex-row items-center justify-between">
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
                   <TabsContent value="deleted-users" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deleted Users</CardTitle>
                            <CardDescription>A list of all deleted employees. You can restore them from here.</CardDescription>
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
                                                <Image src={`https://picsum.photos/seed/${user.avatar}/40/40`} width={40} height={40} className="rounded-full" alt={user.name} data-ai-hint="person portrait" />
                                            </TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleRestoreUser(user.id)}>
                                                    <Undo className="mr-2 h-4 w-4" />
                                                    Restore
                                                </Button>
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
                  <TabsContent value="deleted-announcements" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deleted Announcements</CardTitle>
                            <CardDescription>A list of all deleted announcements. You can restore or permanently delete them from here.</CardDescription>
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
                                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                                        Restore
                                                    </Button>
                                                    <DeleteAnnouncementDialog announcement={announcement} onDelete={() => handlePermanentDeleteAnnouncement(announcement.id)} isPermanent={true}>
                                                        <Button variant="destructive" size="sm">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Permanently
                                                        </Button>
                                                    </DeleteAnnouncementDialog>
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
    </>
  )
}
