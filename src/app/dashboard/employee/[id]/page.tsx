'use client';
import { notFound, useRouter } from 'next/navigation';
import { users as initialUsers, documents as allDocuments } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, DoorOpen, User, Edit } from 'lucide-react';
import Image from 'next/image';
import { DocumentList } from '@/components/dashboard/document-list';
import { UploadDialog } from '@/components/dashboard/upload-dialog';
import { useState, useEffect, useMemo } from 'react';
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

type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const documentTypes: Document['type'][] = ['Salary Slip', 'Medical Report', 'Appraisal Letter', 'Personal'];

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [user, setUser] = useState<UserType | undefined>(undefined);
  const [employeeDocs, setEmployeeDocs] = useState<Document[]>([]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'uploadDate', direction: 'descending' });
  
  useEffect(() => {
    const resolveUser = async () => {
      const resolvedParams = await Promise.resolve(params);
      const foundUser = users.find(u => u.id === resolvedParams.id);

      if (foundUser) {
        setUser(foundUser);
      } else {
        notFound();
      }
    };

    resolveUser();
  }, [params, users]);
  
  useEffect(() => {
      if (user) {
          const userDocs = allDocuments.filter(doc => doc.ownerId === user.id);
          setEmployeeDocs(userDocs);
      }
  }, [user]);

  const handleEmployeeSave = (employee: UserType & { originalId?: string }) => {
    const userIndex = users.findIndex(u => u.id === (employee.originalId || employee.id));
    if (userIndex > -1) {
        const updatedUsers = [...users];
        const existingUser = updatedUsers[userIndex];

        updatedUsers[userIndex] = {
            ...existingUser,
            ...employee,
            id: employee.id, // Ensure ID is updated
            password: employee.password || existingUser.password
        };
        
        setUsers(updatedUsers);

        // If the ID was changed, we need to update the URL
        if (employee.originalId && employee.id !== employee.originalId) {
            router.replace(`/dashboard/employee/${employee.id}`);
        } else {
            // Force re-render to reflect changes if ID hasn't changed
            setUser({...updatedUsers[userIndex]});
        }
    }
  };


  const { availableYears, availableMonths } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<number>();
    employeeDocs.forEach(doc => {
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
  }, [employeeDocs, selectedYear]);

  const filteredDocs = useMemo(() => {
    return employeeDocs.filter(doc => {
      const date = new Date(doc.uploadDate);
      const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
      const typeMatch = selectedType === 'all' || doc.type === selectedType;
      return yearMatch && monthMatch && typeMatch;
    });
  }, [employeeDocs, selectedYear, selectedMonth, selectedType]);

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

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  if (!user) {
    return <div>Loading...</div>;
  }

  const handleUploadComplete = () => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: `Uploaded Doc.pdf`,
      type: 'Personal' as const,
      size: '128 KB',
      uploadDate: new Date().toISOString().split('T')[0],
      ownerId: user.id,
      fileType: 'pdf' as const,
    }
    setEmployeeDocs((prev) => [newDoc, ...prev]);
  };
  
  const userDetails = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Mobile', value: user.mobile || 'N/A' },
    { icon: Calendar, label: 'Date of Birth', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A' },
    { icon: Briefcase, label: 'Joining Date', value: user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A' },
    { icon: DoorOpen, label: 'Resignation Date', value: user.resignationDate ? new Date(user.resignationDate).toLocaleDateString() : 'N/A' },
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
                            <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave}>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4"/>
                                </Button>
                            </EmployeeManagementDialog>
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-4" />
                            <ul className="space-y-4 text-sm text-muted-foreground">
                                {userDetails.map((detail, index) => (
                                    <li key={index} className="flex items-center gap-4">
                                        <detail.icon className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground">{detail.label}</p>
                                            <p>{detail.value}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                           <div className="flex-grow">
                             <CardTitle>Documents</CardTitle>
                             <CardDescription>All documents associated with {user.name}.</CardDescription>
                           </div>
                           <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full min-w-[120px] sm:w-auto">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all' && availableMonths.length === 0}>
                                    <SelectTrigger className="w-full min-w-[120px] sm:w-auto">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {availableMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <UploadDialog onUploadComplete={handleUploadComplete} />
                           </div>
                        </CardHeader>
                        <CardContent>
                            <DocumentList documents={sortedAndFilteredDocs} users={[]} onSort={requestSort} sortConfig={sortConfig} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  )
}

    