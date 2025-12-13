
'use client';


import { AdminView } from '@/app/dashboard/admin-view'
import { EmployeeView } from '@/components/dashboard/employee-view'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation';

function DashboardContent({ role }: { role: string | null }) {
  if (role === 'admin') {
    return <AdminView />
  }
  return <EmployeeView />
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent role={role} />
      </Suspense>
    </main>
  );
}


export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  )
}

