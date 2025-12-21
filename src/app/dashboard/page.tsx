'use client';

import { AdminView } from '@/app/dashboard/admin-view'

import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard'
import { EmployeeView } from '@/components/dashboard/employee-view'
import { Suspense, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

function DashboardContent({ role, view }: { role: string | null, view: string | null }) {
  logger.log('[DashboardContent] Rendering with role:', role, 'view:', view);

  if (role === 'admin') {
    const component = view === 'panel' ? 'AdminView' : 'EmployeeDashboard (Admin Mode)';
    logger.log('[DashboardContent] Admin role detected, rendering:', component);
    return view === 'panel' ? <AdminView /> : <EmployeeDashboard />
  }

  const component = view === 'panel' ? 'EmployeeView' : 'EmployeeDashboard';
  logger.log('[DashboardContent] Employee role (or no role), rendering:', component);
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

  const roleFromUrl = searchParams.get('role');
  const viewFromUrl = searchParams.get('view');

  // Use session role as default if URL param is missing
  const effectiveRole = roleFromUrl || (session?.user?.role === 'admin' ? 'admin' : null);

  useEffect(() => {
    // Debug logging
    logger.log('[Dashboard] Status:', status);
    logger.log('[Dashboard] Session role:', session?.user?.role);
    logger.log('[Dashboard] URL role param:', roleFromUrl);
    logger.log('[Dashboard] Effective role:', effectiveRole);

    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      logger.log('[Dashboard] Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // Security and role routing
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role;
      logger.log('[Dashboard] User authenticated with role:', userRole);

      // Security: Prevent role escalation via URL
      if (roleFromUrl === 'admin' && userRole !== 'admin') {
        logger.log('[Dashboard] Non-admin trying to access admin view, redirecting');
        router.replace('/dashboard');
        return;
      }

      // Automatically redirect admins to admin view if no role specified
      if (!roleFromUrl && userRole === 'admin') {
        logger.log('[Dashboard] Admin user without role param, redirecting to admin view');
        router.replace('/dashboard?role=admin');
        return;
      }
    }
  }, [status, session, roleFromUrl, router, effectiveRole]);

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
        <DashboardContent role={effectiveRole} view={viewFromUrl} />
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
