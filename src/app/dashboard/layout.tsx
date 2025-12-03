import { DashboardHeader } from '@/components/dashboard/header';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Suspense>
        <DashboardHeader />
      </Suspense>
      {children}
    </div>
  );
}
