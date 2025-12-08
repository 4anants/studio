
'use client'
import Link from 'next/link'
import {
  LogOut,
  User,
} from 'lucide-react'

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
import { CompanyName, users as allUsers } from '@/lib/mock-data'
import { getAvatarSrc } from '@/lib/utils'
import { AseLogo } from './ase-logo'


export function DashboardHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role')
  const [siteName, setSiteName] = useState(CompanyName);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
    
    // In a real app, this would come from an auth context
    const employeeUserId = 'user-1';
    
    let user;
    if (role === 'admin') {
      const sadmin = allUsers.find(u => u.email === 'sadmin@internal.local');
      if (sadmin) {
        user = sadmin;
      } else {
        user = allUsers.find(u => u.role === 'admin') || allUsers[0];
      }
    } else {
      user = allUsers.find(u => u.id === employeeUserId) || allUsers[0];
    }
    setCurrentUser(user);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [role]);

  const handleLogout = () => {
    router.push('/login')
  }

  const handleProfileClick = () => {
    if (!currentUser) return;
    const targetUserId = currentUser.id;
    const targetRole = role === 'admin' ? 'admin' : undefined;
    const url = `/dashboard/employee/${targetUserId}${targetRole ? `?role=${targetRole}` : ''}`;
    router.push(url);
  }

  if (!currentUser) {
    // Render a skeleton or null while waiting for the user
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
            {/* Can add a skeleton loader here */}
        </header>
    );
  }


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href={`/dashboard?role=${role || 'employee'}`}
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
        {role !== 'admin' && <AnnouncementBell />}
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
