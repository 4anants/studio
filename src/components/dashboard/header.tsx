
'use client'
import Link from 'next/link'
import {
  LogOut,
  User,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { AnnouncementBell } from './announcement-bell'
import { ThemeToggle } from '../theme-toggle'
import { useState, useEffect } from 'react'
import { CompanyName, users as allUsers, User as UserType } from '@/lib/mock-data'
import { getAvatarSrc } from '@/lib/utils'
import { AseLogo } from './ase-logo'
import { Skeleton } from '../ui/skeleton';


export function DashboardHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession();
  const [siteName, setSiteName] = useState(CompanyName);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    const storedSiteName = localStorage.getItem('siteName');
    if (storedSiteName) {
      setSiteName(storedSiteName);
      document.title = storedSiteName;
    }

    const handleStorageChange = () => {
      const storedSiteName = localStorage.getItem('siteName');
      if (storedSiteName) {
        setSiteName(storedSiteName);
        document.title = storedSiteName;
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Determine the current user
    let user: UserType | undefined;
    const localSession = localStorage.getItem('session');

    if (localSession === 'sadmin') {
      user = allUsers.find(u => u.id === 'sadmin');
    } else if (status === 'authenticated' && session?.user?.email) {
      user = allUsers.find(u => u.email.toLowerCase() === session.user!.email!.toLowerCase());
      // If user from SSO is not in our mock data, create a temporary profile
      if (!user) {
        user = {
            id: session.user.email,
            name: session.user.name || 'New User',
            email: session.user.email,
            avatar: session.user.image || String(Date.now()),
            status: 'active',
            role: 'employee',
        }
      }
    } else if (localSession) {
        user = allUsers.find(u => u.id === localSession);
    }
    
    if (user) {
      setCurrentUser(user);
    }


    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [status, session]);

  const handleLogout = async () => {
    localStorage.removeItem('session');
    await signOut({ callbackUrl: '/login' });
  }

  const handleProfileClick = () => {
    if (!currentUser) return;

    // Use URLSearchParams to preserve existing query params if any
    const params = new URLSearchParams(searchParams.toString());
    
    const role = currentUser.role === 'admin' ? 'admin' : 'employee';
    params.set('role', role);

    const url = `/dashboard/employee/${currentUser.id}?${params.toString()}`;
    router.push(url);
  }

  if (status === 'loading' || !currentUser) {
    // Render a skeleton or null while waiting for the user
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-6 w-32" />
            </nav>
             <div className="ml-auto flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
             </div>
        </header>
    );
  }


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href={`/dashboard?${searchParams.toString()}`}
          className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary"
        >
          <div className="h-8 w-8">
            <AseLogo />
          </div>
          <span className="font-bold">{siteName}</span>
        </Link>
      </nav>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />
        <ThemeToggle />
        {currentUser.role !== 'admin' && <AnnouncementBell />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Image src={getAvatarSrc(currentUser)} width={40} height={40} className="rounded-full object-cover" alt="User avatar" data-ai-hint="person portrait"/>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
