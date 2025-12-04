

'use client';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { users as initialUsers, documents as allDocuments, documentTypesList, departments, CompanyName } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, Award, User, Edit, Building, LogOut, IdCard, Droplet, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback, use } from 'react';
import { Separator } from '@/components/ui/separator';
import type { User as UserType, Document } from '@/lib/mock-data';
import { EmployeeManagementDialog } from '@/components/dashboard/employee-management-dialog';
import { EmployeeSelfEditDialog } from '@/components/dashboard/employee-self-edit-dialog';
import { cn } from '@/lib/utils';
import { IdCardDialog } from '@/components/dashboard/id-card-dialog';

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  
  const { id } = use(params);

  const [user, setUser] = useState<UserType | undefined>(undefined);
  
  const role = searchParams.get('role');
  const isSelfView = role !== 'admin';
  
  useEffect(() => {
    if (id) {
      const foundUser = users.find(u => u.id === id);
      setUser(foundUser);
    }
  }, [id, users]);
  
  const handleEmployeeSave = useCallback((employee: Partial<UserType> & { originalId?: string }) => {
    setUsers(currentUsers => {
        const userIndex = currentUsers.findIndex(u => u.id === (employee.originalId || id));
        if (userIndex > -1) {
            const updatedUsers = [...currentUsers];
            const existingUser = updatedUsers[userIndex];

            const updatedUser = {
                ...existingUser,
                ...employee,
            };

            updatedUsers[userIndex] = updatedUser;
            
            if (employee.originalId && employee.id && employee.id !== employee.originalId) {
                router.replace(`/dashboard/employee/${employee.id}?role=admin`);
            } else {
                setUser(updatedUser);
            }
            return updatedUsers;
        }
        return currentUsers;
    });
  }, [router, id]);

  if (!user) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center">
            <p>Loading user or user not found...</p>
        </div>
    );
  }
  
  const userDetails = [
    { icon: Mail, label: 'Official Email', value: user.email },
    { icon: Mail, label: 'Personal Email', value: user.personalEmail || 'N/A' },
    { icon: Phone, label: 'Mobile', value: user.mobile || 'N/A' },
    { icon: Calendar, label: 'Date of Birth', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A' },
    { icon: Droplet, label: 'Blood Group', value: user.bloodGroup || 'N/A' },
    { icon: Briefcase, label: 'Company', value: user.company || 'N/A' },
    { icon: MapPin, label: 'Location', value: user.location || 'N/A' },
    { icon: Building, label: 'Department', value: user.department || 'N/A' },
    { icon: Award, label: 'Designation', value: user.designation || 'N/A' },
    { icon: Briefcase, label: 'Joining Date', value: user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A' },
    { icon: LogOut, label: 'Resignation Date', value: user.resignationDate ? new Date(user.resignationDate).toLocaleDateString() : 'N/A' },
    { icon: User, label: 'Status', value: user.status.charAt(0).toUpperCase() + user.status.slice(1) },
  ];

  const col1Details = userDetails.slice(0, 6);
  const col2Details = userDetails.slice(6);


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold tracking-tight">Employee Profile</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                <div className="md:col-span-1 lg:col-span-1">
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
                           
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {isSelfView ? (
                                <EmployeeSelfEditDialog employee={user} onSave={handleEmployeeSave}>
                                    <Button variant="outline" className="w-full">
                                        <Edit className="mr-2 h-4 w-4"/> Edit Profile
                                    </Button>
                                </EmployeeSelfEditDialog>
                            ) : (
                                <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave} departments={departments}>
                                     <Button variant="outline" className="w-full">
                                        <Edit className="mr-2 h-4 w-4"/> Edit Profile
                                    </Button>
                                </EmployeeManagementDialog>
                            )}
                             <IdCardDialog user={user}>
                                <Button variant="outline" className="w-full">
                                    <IdCard className="mr-2 h-4 w-4" />
                                    Generate ID Card
                                </Button>
                            </IdCardDialog>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal & Employment Details</CardTitle>
                            <CardDescription>All information related to {user.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <ul className="space-y-4 text-sm text-muted-foreground">
                                        {col1Details.map((detail, index) => (
                                            <li key={index} className="flex items-start gap-4">
                                                <detail.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">{detail.label}</p>
                                                    <p className={cn(
                                                        'break-words',
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
                                </div>
                                <div>
                                    <ul className="space-y-4 text-sm text-muted-foreground">
                                        {col2Details.map((detail, index) => (
                                            <li key={index} className="flex items-start gap-4">
                                                <detail.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">{detail.label}</p>
                                                    <p className={cn(
                                                        'break-words',
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
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  )
}
    

    
