'use client';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { users as initialUsers, documents as allDocuments, documentTypesList, departments } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, Award, User, Edit, Building, LogOut } from 'lucide-react';
import Image from 'next/image';
import { DocumentList } from '@/components/dashboard/document-list';
import { UploadDialog } from '@/components/dashboard/upload-dialog';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import type { User as UserType, Document } from '@/lib/mock-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeManagementDialog } from '@/components/dashboard/employee-management-dialog';
import { EmployeeSelfEditDialog } from '@/components/dashboard/employee-self-edit-dialog';
import { cn } from '@/lib/utils';

type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [user, setUser] = useState<UserType | undefined>(undefined);
  const [employeeDocs, setEmployeeDocs] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<string[]>(documentTypesList);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All']);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'uploadDate', direction: 'descending' });
  
  const role = searchParams.get('role');
  const isSelfView = role !== 'admin';

  useEffect(() => {
    const foundUser = initialUsers.find(u => u.id === params.id);

    if (foundUser) {
      setUser(foundUser);
    } else {
      notFound();
    }
  }, [params.id]);
  
  useEffect(() => {
      if (user) {
          const userDocs = allDocuments.filter(doc => doc.ownerId === user.id);
          setEmployeeDocs(userDocs);
      }
  }, [user]);

  const handleEmployeeSave = useCallback((employee: Partial<UserType> & { originalId?: string }) => {
    setUsers(currentUsers => {
        const userIndex = currentUsers.findIndex(u => u.id === (employee.originalId || employee.id));
        if (userIndex > -1) {
            const updatedUsers = [...currentUsers];
            const existingUser = updatedUsers[userIndex];

            const updatedUser = {
                ...existingUser,
                ...employee,
            };

            updatedUsers[userIndex] = updatedUser;
            
            // If the ID was changed (by admin), we need to update the URL
            if (employee.originalId && employee.id && employee.id !== employee.originalId) {
                router.replace(`/dashboard/employee/${employee.id}?role=admin`);
            } else {
                // Force re-render to reflect changes if ID hasn't changed
                setUser(updatedUser);
            }
            return updatedUsers;
        }
        return currentUsers;
    });
  }, [router]);

  const handleTypeSelection = useCallback((type: string) => {
    setSelectedTypes(prevTypes => {
      if (type === 'All') {
        return ['All'];
      }
      
      const newTypes = prevTypes.filter(t => t !== 'All');

      if (newTypes.includes(type)) {
        const filteredTypes = newTypes.filter(t => t !== type);
        return filteredTypes.length === 0 ? ['All'] : filteredTypes;
      } else {
        return [...newTypes, type];
      }
    });
  }, []);

  const { availableYears, availableMonths } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<number>();
    
    employeeDocs
      .filter(doc => selectedTypes.includes('All') || selectedTypes.includes(doc.type))
      .forEach(doc => {
        const date = new Date(doc.uploadDate);
        years.add(date.getFullYear().toString());
        if (selectedYear === 'all' || date.getFullYear().toString() === selectedYear) {
            months.add(date.getMonth());
        }
    });

    return { 
        availableYears: Array.from(years).sort((a, b) => Number(b) - Number(a)),
        availableMonths: Array.from(months).sort((a, b) => a - b)
    };
  }, [employeeDocs, selectedTypes, selectedYear]);

  const filteredDocs = useMemo(() => {
    return employeeDocs.filter(doc => {
      const date = new Date(doc.uploadDate);
      const typeMatch = selectedTypes.includes('All') || selectedTypes.includes(doc.type);
      const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
      return typeMatch && yearMatch && monthMatch;
    });
  }, [employeeDocs, selectedTypes, selectedYear, selectedMonth]);

  const sortedAndFilteredDocs = useMemo(() => {
    let sortableItems = [...filteredDocs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredDocs, sortConfig]);

  const requestSort = useCallback((key: SortKey) => {
    setSortConfig(currentSortConfig => {
      let direction: SortDirection = 'ascending';
      if (currentSortConfig && currentSortConfig.key === key && currentSortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      return { key, direction };
    });
  }, []);

  const handleUploadComplete = useCallback(() => {
    if (!user) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: `Uploaded Doc.pdf`,
      type: 'Personal',
      size: '128 KB',
      uploadDate: new Date().toISOString().split('T')[0],
      ownerId: user.id,
      fileType: 'pdf' as const,
    }
    setEmployeeDocs((prev) => [newDoc, ...prev]);
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }
  
  const userDetails = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Mobile', value: user.mobile || 'N/A' },
    { icon: Building, label: 'Department', value: user.department || 'N/A' },
    { icon: Award, label: 'Designation', value: user.designation || 'N/A' },
    { icon: Calendar, label: 'Date of Birth', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A' },
    { icon: Briefcase, label: 'Joining Date', value: user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A' },
    { icon: LogOut, label: 'Resignation Date', value: user.resignationDate ? new Date(user.resignationDate).toLocaleDateString() : 'N/A' },
    { icon: User, label: 'Status', value: user.status.charAt(0).toUpperCase() + user.status.slice(1) },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold tracking-tight">Employee Profile</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div className="flex flex-col items-center text-center w-full">
                                 <Image 
                                    src={`https://picsum.photos/seed/${user.avatar}/128/128`} 
                                    width={128} 
                                    height={128} 
                                    className="rounded-full mb-4" 
                                    alt={user.name}
                                    data-ai-hint="person portrait" 
                                 />
                                <CardTitle className="text-2xl">{user.name}</CardTitle>
                                <CardDescription>Employee ID: {user.id}</CardDescription>
                            </div>
                            {isSelfView ? (
                                <EmployeeSelfEditDialog employee={user} onSave={handleEmployeeSave}>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                </EmployeeSelfEditDialog>
                            ) : (
                                <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave} departments={departments}>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                </EmployeeManagementDialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-4" />
                            <ul className="space-y-4 text-sm text-muted-foreground">
                                {userDetails.map((detail, index) => (
                                    <li key={index} className="flex items-center gap-4">
                                        <detail.icon className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground">{detail.label}</p>
                                            <p className={cn(
                                                detail.label === 'Status' && (
                                                    detail.value === 'Active' ? 'text-green-600' : 
                                                    detail.value === 'Inactive' ? 'text-red-600' :
                                                    'text-yellow-600'
                                                )
                                            )}>{detail.value}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                           <div className="flex items-center justify-between">
                             <div>
                               <CardTitle>Documents</CardTitle>
                               <CardDescription>All documents associated with {user.name}.</CardDescription>
                             </div>
                             <UploadDialog onUploadComplete={handleUploadComplete} />
                           </div>
                           <Separator className="my-4" />
                           <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Document Type</label>
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <Button
                                            variant={selectedTypes.includes('All') ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleTypeSelection('All')}
                                        >
                                            All
                                        </Button>
                                        {documentTypes.map(type => (
                                            <Button
                                                key={type}
                                                variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleTypeSelection(type)}
                                            >
                                                {type}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <div className="flex-grow min-w-[120px]">
                                        <label className="text-sm font-medium">Year</label>
                                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Years</SelectItem>
                                                {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-grow min-w-[120px]">
                                         <label className="text-sm font-medium">Month</label>
                                         <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="Select Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Months</SelectItem>
                                                {availableMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                               </div>
                           </div>
                        </CardHeader>
                        <CardContent>
                            <DocumentList documents={sortedAndFilteredDocs} users={users} onSort={requestSort} sortConfig={sortConfig} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  )
}
