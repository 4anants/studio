'use client';

import { AdminView } from '@/app/dashboard/admin-view';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
import { EmployeeView } from '@/components/dashboard/employee-view';

interface DashboardClientProps {
    isAdmin: boolean;
    showAdminPanel: boolean;
    showEmployeePanel: boolean;
}

export function DashboardClient({ isAdmin, showAdminPanel, showEmployeePanel }: DashboardClientProps) {
    if (isAdmin) {
        return showAdminPanel ? <AdminView /> : <AdminDashboard />;
    }

    return showEmployeePanel ? <EmployeeView /> : <EmployeeDashboard />;
}
