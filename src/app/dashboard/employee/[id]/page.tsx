'use client';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { departments } from '@/lib/constants';
import type { User as UserType, Company, Document, Department } from '@/lib/types';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, Award, User, Edit, Building, LogOut, Droplet, MapPin, Shield, BadgeCheck, ShieldAlert, Lock } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { EmployeeManagementDialog } from '@/components/dashboard/employee-management-dialog';
import { EmployeeSelfEditDialog } from '@/components/dashboard/employee-self-edit-dialog';
import { PinSetupDialog } from '@/components/dashboard/pin-setup-dialog';
import { cn, getAvatarSrc } from '@/lib/utils';
import { EmployeeFileExplorer } from '@/components/dashboard/employee-file-explorer';
import { IdCardDialog } from '@/components/dashboard/id-card-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';


export default function EmployeeProfilePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams<{ id: string }>();

    const {
        users: serverUsers,
        companies: serverCompanies,
        documents: serverDocuments,
        departments: serverDepartments,
        mutateUsers,
        mutateDocuments
    } = useData();
    const { toast } = useToast();

    // Use derived state instead of duplicating into local state where possible, 
    // but for search/sort/filter we might need local state.
    // Actually, for this page, we just need to find the specific user and their docs.

    const id = params?.id;
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'uploadDate', direction: 'descending' });
    const [isMounted, setIsMounted] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinSetupOpen, setPinSetupOpen] = useState(false);
    const [hasPin, setHasPin] = useState(false);

    const user = useMemo(() => {
        return (serverUsers as UserType[]).find(u => u.id === id);
    }, [serverUsers, id]);

    const userCompany = useMemo(() => {
        if (!user || !serverCompanies) return undefined;
        return (serverCompanies as Company[]).find(c => c.name === user.company);
    }, [user, serverCompanies]);

    const role = searchParams.get('role');
    const isSelfView = role !== 'admin';
    const isOwnProfile = session?.user?.id === user?.id;

    useEffect(() => {
        setIsMounted(true);

        // Check PIN status for the current logged-in user (whether Admin or Employee)
        fetch('/api/document-pin')
            .then(res => res.json())
            .then(data => {
                if (data && typeof data.pinSet === 'boolean') {
                    setHasPin(data.pinSet);
                }
            })
            .catch(err => console.error('Failed to check PIN status', err));
    }, []);

    const handlePinSuccess = useCallback(() => {
        setHasPin(true);
        toast({ title: 'Document PIN verified/updated successfully' });
    }, [toast]);
    const isSadmin = user?.id === 'sadmin';

    const handleEmployeeSave = useCallback(async (employeeUpdate: Partial<UserType> & { originalId?: string }) => {
        if (!user) return; // Should not happen if mounted

        // Merge current user data with updates to ensure all required fields (like email) are present for the API
        const employee = { ...user, ...employeeUpdate };

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee),
            });
            if (!res.ok) {
                const errorText = await res.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText };
                }
                console.error("Server save error:", errorData);
                throw new Error(errorData.error || 'Failed to save');
            }

            await mutateUsers();

            if (employeeUpdate.originalId && employee.id && employee.id !== employeeUpdate.originalId) {
                router.replace(`/dashboard/employee/${employee.id}?role=admin`);
            }
        } catch (error) {
            console.error("Failed to save user", error);
            toast({
                title: "Error saving profile",
                description: error instanceof Error ? error.message : "Unknown error occurred",
                variant: "destructive"
            });
            throw error;
        }
    }, [user, mutateUsers, router, toast]);



    const userDocuments = useMemo(() => {
        if (!id) return [];
        return (serverDocuments as Document[]).filter(doc => doc.ownerId === id);
    }, [id, serverDocuments]);

    if (!user) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center gap-4">
                <h2 className="text-xl font-semibold">User Not Found</h2>
                <p className="text-muted-foreground">The user profile could not be found. If your ID was recently updated, please log in again.</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                    <Button onClick={() => window.location.href = '/api/auth/signout'}>Logout</Button>
                </div>
            </div>
        );
    }

    const userDetails = [
        { icon: Mail, label: 'Official Email', value: user.email },
        { icon: Mail, label: 'Personal Email', value: user.personalEmail || 'N/A' },
        { icon: Phone, label: 'Mobile', value: user.mobile ? `+91 ${user.mobile}` : 'N/A' },
        { icon: ShieldAlert, label: 'Emergency Contact', value: user.emergencyContact ? `+91 ${user.emergencyContact}` : 'N/A' },
        { icon: Calendar, label: 'Date of Birth', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A' },
        { icon: Droplet, label: 'Blood Group', value: user.bloodGroup || 'N/A' },
        { icon: Shield, label: 'Role', value: (user.role || 'employee').charAt(0).toUpperCase() + (user.role || 'employee').slice(1) },
        { icon: Briefcase, label: 'Company', value: user.company || 'N/A' },
        { icon: MapPin, label: 'Location', value: user.location || 'N/A' },
        { icon: Building, label: 'Department', value: user.department || 'N/A' },
        { icon: Award, label: 'Designation', value: user.designation || 'N/A' },
        { icon: Briefcase, label: 'Joining Date', value: user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A' },
        { icon: LogOut, label: 'Resignation Date', value: user.resignationDate ? new Date(user.resignationDate).toLocaleDateString() : 'N/A' },
        { icon: User, label: 'Status', value: (user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1) },
    ].filter(detail => !(detail.label.includes('Emergency Contact') && detail.value === 'N/A'));

    const col1Details = userDetails.slice(0, Math.ceil(userDetails.length / 2));
    const col2Details = userDetails.slice(Math.ceil(userDetails.length / 2));

    const canEdit = !isSadmin || isSelfView || (user?.id === 'sadmin');

    if (!isMounted) return null;



    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl font-semibold tracking-tight">Employee Profile</h1>
                </div>
                <div className="grid gap-6">
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="md:col-span-1 lg:col-span-1">
                            <Card>
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div className="flex flex-col items-center text-center w-full">
                                        <Image
                                            src={getAvatarSrc(user)}
                                            width={128}
                                            height={128}
                                            className="rounded-full mb-4 object-cover"
                                            alt={user.name ? user.name : 'Profile'}
                                            data-ai-hint="person portrait"
                                        />
                                        <CardTitle className="text-2xl">{user.name}</CardTitle>
                                        <CardDescription>Employee ID: {user.id.substring(0, 8).toUpperCase()}</CardDescription>
                                    </div>

                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    {(isSelfView || isOwnProfile) && (
                                        <Button variant="outline" className="w-full rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setPinSetupOpen(true)}>
                                            <Lock className="mr-2 h-4 w-4" />
                                            {hasPin ? 'Change Document PIN' : 'Set Document PIN'}
                                        </Button>
                                    )}
                                    <IdCardDialog employee={user} company={userCompany}>
                                        <Button variant="default" className="w-full">
                                            <BadgeCheck className="mr-2 h-4 w-4" /> ID Card
                                        </Button>
                                    </IdCardDialog>
                                    {canEdit && (
                                        isSadmin ? (
                                            !isUnlocked ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" className="w-full">
                                                            <Shield className="mr-2 h-4 w-4" /> Unlock to Edit
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Security Check</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Please enter the security code to edit the Super Admin profile.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <div className="py-4">
                                                            <Input
                                                                type="password"
                                                                placeholder="Enter Security Code"
                                                                id="sadmin-security-code"
                                                            />
                                                        </div>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={(e) => {
                                                                const input = document.getElementById('sadmin-security-code') as HTMLInputElement;
                                                                if (input.value === '9638777739') {
                                                                    setIsUnlocked(true);
                                                                } else {
                                                                    e.preventDefault();
                                                                    alert('Invalid Security Code');
                                                                }
                                                            }}>
                                                                Verify
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <EmployeeSelfEditDialog employee={user} onSave={handleEmployeeSave}>
                                                    <Button variant="outline" className="w-full">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                                    </Button>
                                                </EmployeeSelfEditDialog>
                                            )
                                        ) : isSelfView ? (
                                            <EmployeeSelfEditDialog employee={user} onSave={handleEmployeeSave}>
                                                <Button variant="outline" className="w-full">
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                                </Button>
                                            </EmployeeSelfEditDialog>
                                        ) : (
                                            <EmployeeManagementDialog employee={user} onSave={handleEmployeeSave} departments={serverDepartments as Department[]} companies={serverCompanies as Company[]}>
                                                <Button variant="outline" className="w-full">
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                                </Button>
                                            </EmployeeManagementDialog>
                                        )
                                    )}
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
                                                                ),
                                                                detail.label === 'Role' && (
                                                                    detail.value === 'Admin' ? 'text-blue-600' : 'text-gray-600'
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
                                                                ),
                                                                detail.label === 'Role' && (
                                                                    detail.value === 'Admin' ? 'text-blue-600' : 'text-gray-600'
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
                    {!isSelfView && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>All documents uploaded for {user.name}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <EmployeeFileExplorer
                                    documents={userDocuments}
                                    currentUser={user}
                                    checkPermission={(doc, action) => {
                                        if (isSelfView) { // Employee Viewing Self
                                            if (action === 'delete') return doc.type === 'Personal';
                                            return true; // view/download all
                                        } else { // Admin Viewing Employee
                                            if (action === 'delete') return true; // Admin can delete all
                                            // Admin can view/download ONLY Personal? (Matching legacy behavior)
                                            // Or true? A lot of admins would expect to see Salary Slips.
                                            // Legacy was "return doc.type === 'Personal'".
                                            // I will maintain legacy for safety, but it's weird.
                                            return doc.type === 'Personal';
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
            <PinSetupDialog
                open={pinSetupOpen}
                onOpenChange={setPinSetupOpen}
                onSuccess={handlePinSuccess}
                isChanging={hasPin}
            />
        </div>
    )
}
