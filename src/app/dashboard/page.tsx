'use client';

import { AdminView } from '@/app/dashboard/admin-view'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard'
import { EmployeeView } from '@/components/dashboard/employee-view'
import { Suspense, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

function DashboardContent({ role, view }: { role: string | null, view: string | null }) {
  if (role === 'admin') {
    return view === 'panel' ? <AdminView /> : <AdminDashboard />
  }
  return view === 'panel' ? <EmployeeView /> : <EmployeeDashboard />
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
  const router = useRouter();
  const { data: session, status } = useSession();

  const role = searchParams.get('role');
  const view = searchParams.get('view');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    // Security: Prevent role escalation via URL
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role;
      if (role === 'admin' && userRole !== 'admin') {
        // Non-admin trying to access admin view
        router.replace('/dashboard');
      }
    }
  }, [status, session, role, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  // Show nothing while redirecting
  if (status === 'unauthenticated') {
    return <DashboardSkeleton />;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent role={role} view={view} />
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
