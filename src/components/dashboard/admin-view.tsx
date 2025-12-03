'use client'
import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DocumentList } from './document-list'
import { UploadDialog } from './upload-dialog'
import { users as initialUsers, documents as allDocuments, User, Document } from '@/lib/mock-data'
import { Search, MoreVertical, Edit, Trash2, KeyRound, Undo, Filter } from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import Image from 'next/image'
import { BulkUploadDialog } from './bulk-upload-dialog'
import { Button } from '../ui/button'
import { EmployeeManagementDialog } from './employee-management-dialog'
import { DeleteEmployeeDialog } from './delete-employee-dialog'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
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
import { Label } from '../ui/label'

export function AdminView() {
  const [docs, setDocs] = useState(allDocuments)
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkResetDialogOpen, setIsBulkResetDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all-docs');
  const [selectedUserIdFilter, setSelectedUserIdFilter] = useState('all');
  const { toast } = useToast();

  const handleUploadComplete = (userId: string) => {
    // Simulate refetching or adding a new doc for a specific user
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: `Admin Uploaded Doc.pdf`,
      type: 'Salary Slip' as const,
      size: '300 KB',
      uploadDate: new Date().toISOString().split('T')[0],
      ownerId: userId,
      fileType: 'pdf' as const,
    }
    setDocs((prev) => [newDoc, ...prev])
  }

  const handleBulkUploadComplete = (newDocs: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[]) => {
    const fullNewDocs: Document[] = newDocs.map(d => ({
        ...d,
        id: `doc-${Date.now()}-${Math.random()}`,
        size: `${(Math.random() * 1000).toFixed(0)} KB`,
        uploadDate: new Date().toISOString().split('T')[0],
        fileType: d.name.endsWith('.pdf') ? 'pdf' : d.name.endsWith('.doc') || d.name.endsWith('.docx') ? 'doc' : 'image',
    }))
    setDocs(prev => [...fullNewDocs, ...prev]);
  }

  const handleEmployeeSave = (employee: User) => {
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === employee.id);
      if (userIndex > -1) {
        // Update existing user
        const updatedUsers = [...prevUsers];
        const existingUser = updatedUsers[userIndex];
        updatedUsers[userIndex] = {
            ...existingUser,
            ...employee,
            password: employee.password || existingUser.password // Keep old password if not provided
        };
        return updatedUsers;
      } else {
        // Add new user
        return [...prevUsers, { ...employee, status: 'active' }];
      }
    });
  };

  const handleEmployeeDelete = (employeeId: string) => {
    setUsers(prevUsers => prevUsers.map(u => 
        u.id === employeeId ? { ...u, status: 'deleted' } : u
    ));
    setSelectedUserIds(prev => prev.filter(id => id !== employeeId));
    toast({
        title: "Employee Deleted",
        description: `The employee has been moved to the deleted users list.`
    });
  };
  
  const handleRestoreUser = (employeeId: string) => {
    setUsers(prevUsers => prevUsers.map(u => 
        u.id === employeeId ? { ...u, status: 'active' } : u
    ));
    toast({
        title: "Employee Restored",
        description: `The employee has been restored to the active list.`
    });
  };

  const handleResetPassword = (employeeName: string) => {
    toast({
      title: "Password Reset Link Sent",
      description: `An email has been sent to ${employeeName} with password reset instructions.`
    });
  };

  const activeUsers = users.filter(user => user.status === 'active');
  const deletedUsers = users.filter(user => user.status === 'deleted');

  const filteredActiveUsers = activeUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDeletedUsers = deletedUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredUsersForSelection = activeTab === 'by-employee' ? filteredActiveUsers : [];

  const filteredDocuments = docs.filter(doc => {
    const owner = users.find(u => u.id === doc.ownerId);
    if (owner?.status === 'deleted') return false; // Hide docs of deleted users
    
    const userMatch = selectedUserIdFilter === 'all' || doc.ownerId === selectedUserIdFilter;
    const searchMatch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return userMatch && searchMatch;
  });

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedUserIds(filteredUsersForSelection.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };
  
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkDelete = () => {
    setUsers(prevUsers => prevUsers.map(u => 
        selectedUserIds.includes(u.id) ? { ...u, status: 'deleted' } : u
    ));
    toast({
        title: "Bulk Delete Successful",
        description: `${selectedUserIds.length} employee(s) have been moved to the deleted list.`
    });
    setSelectedUserIds([]);
    setIsBulkDeleteDialogOpen(false);
  }

  const handleBulkResetPassword = () => {
    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
    selectedUsers.forEach(user => handleResetPassword(user.name));
    toast({
        title: "Bulk Password Reset",
        description: `Password reset links have been sent to ${selectedUserIds.length} employee(s).`
    });
    setSelectedUserIds([]);
    setIsBulkResetDialogOpen(false);
  }
  
  const onTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedUserIds([]);
    setSearchTerm('');
    if (value !== 'all-docs') {
      setSelectedUserIdFilter('all');
    }
  }

  const numSelected = selectedUserIds.length;
  const numFiltered = filteredUsersForSelection.length;


  return (
    <>
      <div className="flex items-center justify-between">
         <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all employee documents and profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          {numSelected > 0 && activeTab === 'by-employee' ? (
            <>
                <span className="text-sm text-muted-foreground">{numSelected} selected</span>
                <Button variant="outline" onClick={() => setIsBulkResetDialogOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" /> Reset Passwords
                </Button>
                <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
            </>
          ) : (
            <>
                <EmployeeManagementDialog onSave={handleEmployeeSave}>
                    <Button>Add Employee</Button>
                </EmployeeManagementDialog>
                <BulkUploadDialog onBulkUploadComplete={handleBulkUploadComplete} users={activeUsers} />
            </>
          )}
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={onTabChange}>
        <div className="flex items-center">
            <TabsList>
                <TabsTrigger value="all-docs">All Documents</TabsTrigger>
                <TabsTrigger value="by-employee">Manage Employees</TabsTrigger>
                <TabsTrigger value="deleted-users">Deleted Users</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={activeTab === 'all-docs' ? 'Search documents...' : 'Search users...'}
                        className="w-full sm:w-[300px] pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
        <TabsContent value="all-docs">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>All Employee Documents</CardTitle>
                        <CardDescription>A comprehensive list of all documents for active employees.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="user-filter" className="text-sm font-medium">Filter by Employee</Label>
                        <Select value={selectedUserIdFilter} onValueChange={setSelectedUserIdFilter}>
                            <SelectTrigger className="w-[180px]" id="user-filter">
                                <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {activeUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <DocumentList documents={filteredDocuments} users={activeUsers} showOwner />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="by-employee">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Employees</CardTitle>
                    <CardDescription>A list of all active employees in the system.</CardDescription>
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
                                <TableHead className="hidden md:table-cell">Mobile</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredActiveUsers.length > 0 ? filteredActiveUsers.map(user => (
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
                                    <TableCell className="hidden md:table-cell">{user.mobile || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave}>
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
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">No active users found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="deleted-users">
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

    