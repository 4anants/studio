import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EmployeeProfileClient from './client-page';

export default async function EmployeeProfilePage({
    params,
    searchParams
}: {
    params: { id: string };
    searchParams: { role?: string }
}) {
    // Server-side authentication check
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/login');
    }

    const userId = params.id;
    const requestedRole = searchParams.role;
    const actualRole = session.user.role;
    const sessionUserId = session.user.id;

    // Security: Users can only view their own profile unless they're admin
    if (actualRole !== 'admin' && userId !== sessionUserId) {
        // Non-admin trying to view someone else's profile
        redirect(`/dashboard/employee/${sessionUserId}`);
    }

    // Security: Prevent role escalation via URL
    if (requestedRole === 'admin' && actualRole !== 'admin') {
        // Non-admin trying to use admin role parameter
        redirect(`/dashboard/employee/${userId}`);
    }

    // Pass validated data to client component
    return (
        <EmployeeProfileClient
            userId={userId}
            isAdmin={actualRole === 'admin'}
            isSelfView={userId === sessionUserId}
        />
    );
}
