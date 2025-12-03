'use client';
import { notFound, useRouter } from 'next/navigation';
import { users, documents as allDocuments } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, DoorOpen, User } from 'lucide-react';
import Image from 'next/image';
import { DocumentList } from '@/components/dashboard/document-list';
import { UploadDialog } from '@/components/dashboard/upload-dialog';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import type { User as UserType } from '@/lib/mock-data';

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<UserType | undefined>(undefined);
  
  useEffect(() => {
    // In newer Next.js versions, `params` can be a promise. This effect handles it.
    const resolveUser = async () => {
      // Although our `params` from mock data is sync, this pattern is correct for async params.
      const resolvedParams = await Promise.resolve(params);
      const foundUser = users.find(u => u.id === resolvedParams.id);

      if (foundUser) {
        setUser(foundUser);
      } else {
        // If the user isn't found after checking, trigger a 404.
        notFound();
      }
    };

    resolveUser();
  }, [params]);

  const [employeeDocs, setEmployeeDocs] = useState(() => {
    if (!user) return [];
    return allDocuments.filter(doc => doc.ownerId === user.id)
  });
  
  useEffect(() => {
      if (user) {
          setEmployeeDocs(allDocuments.filter(doc => doc.ownerId === user.id));
      }
  }, [user]);

  if (!user) {
    // You can add a skeleton loader here if you'd like
    return <div>Loading...</div>;
  }

  const handleUploadComplete = () => {
    // In a real app, you would refetch the documents for this user.
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
                        <CardHeader className="flex flex-col items-center text-center">
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
                        <CardHeader className="flex-row items-center justify-between">
                           <div>
                             <CardTitle>Documents</CardTitle>
                             <CardDescription>All documents associated with {user.name}.</CardDescription>
                           </div>
                           <UploadDialog onUploadComplete={handleUploadComplete} />
                        </CardHeader>
                        <CardContent>
                            <DocumentList documents={employeeDocs} users={[]} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  )
}
