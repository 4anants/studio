'use client'
import Link from 'next/link'
import {
  FileLock2,
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

export function DashboardHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role')

  const handleLogout = () => {
    router.push('/login')
  }

  const user = role === 'admin' ? { name: 'Admin User', email: 'admin@company.com' } : { name: 'Employee User', email: 'employee@company.com' }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="#"
          className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary"
        >
          <FileLock2 className="h-6 w-6" />
          <span className="font-bold">AE INTRAWEB</span>
        </Link>
      </nav>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />
        <AnnouncementBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Image src={`https://picsum.photos/seed/${role === 'admin' ? 'admin' : 'employee'}/40/40`} width={40} height={40} className="rounded-full" alt="User avatar" data-ai-hint="person portrait"/>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
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
