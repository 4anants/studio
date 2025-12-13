import { useState, useMemo, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Announcement } from '@/lib/types'
import { useData } from '@/hooks/use-data'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function AnnouncementBell() {
  const { announcements: serverAnnouncements } = useData();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (serverAnnouncements) {
      setAnnouncements(serverAnnouncements.map(a => ({
        ...a,
        isRead: false // Default to false if not provided
      })));
    }
  }, [serverAnnouncements]);

  const hasUnreadAnnouncements = useMemo(() => announcements.some(a => !a.isRead), [announcements])

  useEffect(() => {
    const handleStorageChange = () => {
      const allRead = localStorage.getItem('announcements_all_read');
      if (allRead === 'true') {
        setAnnouncements((prev: Announcement[]) => prev.map(a => ({ ...a, isRead: true })));
        localStorage.removeItem('announcements_all_read');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClick = () => {
    // Dispatch a custom event that the dashboard views can listen for.
    window.dispatchEvent(new CustomEvent('view-announcements'));

    // Also update local state immediately for the bell icon
    setAnnouncements((prev: Announcement[]) => prev.map(a => ({ ...a, isRead: true })));
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full relative" onClick={handleClick}>
            <Bell className="h-5 w-5" />
            {hasUnreadAnnouncements && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            <span className="sr-only">View announcements</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Announcements</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
