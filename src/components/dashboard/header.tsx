
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

const AseLogo = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-primary"
    >
      <path
        d="M50 0L95.5 25.5V74.5L50 100L4.5 74.5V25.5L50 0Z"
        fill="currentColor"
      />
      <path
        d="M26 63.5L50 50L74 63.5M50 75V50"
        stroke="#fecb00"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 36.5L50 25L74 36.5"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );


export function DashboardHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role')
  const [siteName, setSiteName] = useState(CompanyName);

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
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    router.push('/login')
  }

  // In a real app, this would come from an auth context
  const employeeUserId = 'user-1';

  const user = role === 'admin' ? 
    allUsers.find(u => u.role === 'admin') || { name: 'Admin User', email: 'admin@company.com', avatar: 'admin' } :
    allUsers.find(u => u.id === employeeUserId) || { name: 'Employee User', email: 'employee@company.com', avatar: 'employee' };

  const handleProfileClick = () => {
    const targetUserId = employeeUserId;
    const targetRole = role === 'admin' ? 'admin' : undefined;
    const url = `/dashboard/employee/${targetUserId}${targetRole ? `?role=${targetRole}` : ''}`;
    router.push(url);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href={`/dashboard?role=${role || 'employee'}`}
          className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary"
        >
          <AseLogo />
          <span className="font-bold">{siteName}</span>
        </Link>
      </nav>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />
        <ThemeToggle />
        <AnnouncementBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Image src={getAvatarSrc(user)} width={40} height={40} className="rounded-full object-cover" alt="User avatar" data-ai-hint="person portrait"/>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
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
