
'use client'
import { UpcomingBirthdaysPopup } from './upcoming-birthdays-popup'
import Link from 'next/link'
import {
  LogOut,
  User,
  LayoutDashboard,
  Shield,
} from 'lucide-react'
// ... imports


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
import { CompanyName } from '@/lib/constants'
import { User as UserType } from '@/lib/types'
import { useData } from '@/hooks/use-data'
import { getAvatarSrc } from '@/lib/utils'
import { AseLogo } from './ase-logo'
import { Skeleton } from '../ui/skeleton';


export function DashboardHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession();
  const { users: allUsers, birthdays, loading: dataLoading } = useData();
  const [siteName, setSiteName] = useState(CompanyName);
  const [siteNameFontSize, setSiteNameFontSize] = useState('text-xl');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    const storedSiteName = localStorage.getItem('siteName');
    if (storedSiteName) {
      setSiteName(storedSiteName);
      document.title = storedSiteName;
    }

    const storedFontSize = localStorage.getItem('siteNameFontSize');
    if (storedFontSize) {
      setSiteNameFontSize(storedFontSize);
    }

    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }

    const handleStorageChange = () => {
      const storedSiteName = localStorage.getItem('siteName');
      if (storedSiteName) {
        setSiteName(storedSiteName);
        document.title = storedSiteName;
      }

      const storedFontSize = localStorage.getItem('siteNameFontSize');
      if (storedFontSize) {
        setSiteNameFontSize(storedFontSize);
      }

      const storedLogo = localStorage.getItem('companyLogo');
      setLogoSrc(storedLogo); // This handles both new logo and reset (null)
    };

    window.addEventListener('storage', handleStorageChange);

    // ... existing user session logic ... 

    // Determine the current user
    let user: UserType | undefined;
    const localSession = localStorage.getItem('session');

    if (localSession === 'sadmin') {
      user = (allUsers as UserType[]).find(u => u.id === 'sadmin');
    } else if (status === 'authenticated' && session?.user?.email) {
      user = (allUsers as UserType[]).find(u => u.email.toLowerCase() === session.user!.email!.toLowerCase());
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
      user = (allUsers as UserType[]).find(u => u.id === localSession);
    }

    // Fallback for sadmin if not found in DB (e.g. all users deleted)
    if (!user && localSession === 'sadmin') {
      user = {
        id: 'sadmin',
        name: 'Super Admin',
        email: 'admin@aeintraweb.com',
        role: 'admin',
        status: 'active',
        avatar: 'admin',
        department: 'IT',
        company: CompanyName,
        joiningDate: new Date().toISOString(),
      } as UserType;
    }

    if (user) {
      setCurrentUser(user);
    } else if (!dataLoading && (localSession || status === 'authenticated')) {
      // Data loaded but user not found -> Deleted.
      localStorage.removeItem('session');
      signOut({ redirect: false }).then(() => {
        window.location.href = `${window.location.origin}/login`;
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [status, session, allUsers, dataLoading]);

  const handleLogout = async () => {
    localStorage.removeItem('session');
    // Prevent NextAuth from handling the redirect, handle it manually to ensure correct port
    await signOut({ redirect: false });
    window.location.href = `${window.location.origin}/login`;
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

  // Only show loading state if:
  // 1. Session status is loading
  // 2. Data is loading AND we don't have a resolved currentUser yet
  if (status === 'loading' || (dataLoading && !currentUser)) {
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

  // If we are not loading and still have no currentUser, the user must have been deleted.
  // Redirect to login and clear session.
  if (!currentUser) {
    if (typeof window !== 'undefined') {
      // Avoid infinite loop if already on login (though header is usually not on login page)
      localStorage.removeItem('session');
      // signOut({ callbackUrl: '/login' }); // This might be async, so return null for now.
      // Using router.push for immediate action if signOut is slow?
      // prefer signOut to clear cookies
      // But we can't await here.
      // Let's rely on a useEffect for the side effect, but return null here to avoid crash.
    }
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href={`/dashboard?${searchParams.toString()}`}
            className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary"
          >
            <div className="h-8 w-8 relative">
              {logoSrc ? (
                <img src={logoSrc} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <AseLogo />
              )}
            </div>
            <span className="font-bold">{siteName}</span>
          </Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial" />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
    );
  }


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 sm:px-6 relative">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 z-10">
        <Link
          href={`/dashboard?role=${searchParams.get('role') || 'employee'}`}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 whitespace-nowrap animate-gradient-xy bg-[length:200%_200%]"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        {currentUser?.role === 'admin' && (
          <Link
            href="/dashboard?role=admin&view=panel"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 whitespace-nowrap animate-gradient-xy bg-[length:200%_200%]"
          >
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Centered Logo/Branding */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none md:pointer-events-auto">
        <Link
          href={`/dashboard?${searchParams.toString()}`}
          className="flex items-center gap-3 text-lg font-semibold md:text-base"
        >
          <div className="h-10 w-10 relative rounded-full overflow-hidden shadow-sm flex items-center justify-center p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-xy bg-[length:200%_200%]">
            <div className="h-full w-full bg-background rounded-full overflow-hidden flex items-center justify-center">
              {logoSrc ? (
                <img src={logoSrc} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <AseLogo />
              )}
            </div>
          </div>
          <span className={`font-bold whitespace-nowrap bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text animate-gradient-xy bg-[length:200%_200%] ${siteNameFontSize}`}>{siteName}</span>
        </Link>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />
        <ThemeToggle />
        {currentUser.role !== 'admin' && <AnnouncementBell />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full p-[2px] h-11 w-11 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-xy bg-[length:200%_200%] hover:scale-105 transition-transform duration-300">
              <div className="h-full w-full rounded-full bg-background p-[2px] overflow-hidden">
                <Image src={getAvatarSrc(currentUser)} width={40} height={40} className="rounded-full object-cover h-full w-full" alt="User avatar" data-ai-hint="person portrait" />
              </div>
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
      {currentUser && <UpcomingBirthdaysPopup users={birthdays as UserType[]} currentUserId={currentUser.id} />}
    </header>
  )
}
