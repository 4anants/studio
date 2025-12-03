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
import { Search, MoreVertical, Edit, Trash2, KeyRound } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'

export function AdminView() {
  const [docs, setDocs] = useState(allDocuments)
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
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
        return [...prevUsers, employee];
      }
    });
  };

  const handleEmployeeDelete = (employeeId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.id !== employeeId));
    // Also remove documents associated with the deleted user
    setDocs(prevDocs => prevDocs.filter(d => d.ownerId !== employeeId));
  };
  
  const handleResetPassword = (employeeName: string) => {
    toast({
      title: "Password Reset Link Sent",
      description: `An email has been sent to ${employeeName} with password reset instructions.`
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDocuments = docs.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    users.find(u => u.id === doc.ownerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between">
         <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all employee documents and profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          <EmployeeManagementDialog onSave={handleEmployeeSave}>
            <Button>Add Employee</Button>
          </EmployeeManagementDialog>
          <BulkUploadDialog onBulkUploadComplete={handleBulkUploadComplete} users={users} />
        </div>
      </div>
      
      <Tabs defaultValue="all-docs">
        <div className="flex items-center">
            <TabsList>
                <TabsTrigger value="all-docs">All Documents</TabsTrigger>
                <TabsTrigger value="by-employee">Manage Employees</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search users or files..."
                        className="w-full sm:w-[300px] pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
        <TabsContent value="all-docs">
            <Card>
                <CardHeader>
                    <CardTitle>All Employee Documents</CardTitle>
                    <CardDescription>A comprehensive list of all documents uploaded to the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DocumentList documents={filteredDocuments} users={users} showOwner />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="by-employee">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Employees</CardTitle>
                    <CardDescription>A list of all employees in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden md:table-cell">Mobile</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <TableRow key={user.id}>
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
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No users found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
