'use client'

import { useState, useMemo, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { announcements as initialAnnouncements } from '@/lib/mock-data'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function AnnouncementBell() {
  // This component manages its own state for simplicity.
  // In a real app, this state might be shared via context or a global store.
  const [announcements, setAnnouncements] = useState(initialAnnouncements.map(a => ({...a, isRead: a.isRead ?? false })))
  
  const hasUnreadAnnouncements = useMemo(() => announcements.some(a => !a.isRead), [announcements])

  // A simple way to sync state if another component marks items as read.
  // This is a basic example; a more robust solution would use a global event bus or state manager.
  useEffect(() => {
    const handleStorageChange = () => {
      const allRead = localStorage.getItem('announcements_all_read');
      if (allRead === 'true') {
        setAnnouncements(prev => prev.map(a => ({...a, isRead: true})));
        localStorage.removeItem('announcements_all_read');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // For employee-view to tell the header bell to clear its notification
  const handleClick = () => {
    // Programmatically find and click the 'Announcements' tab trigger
    const tabTrigger = document.querySelector('button[role="tab"][value="announcements"]');
    if (tabTrigger instanceof HTMLElement) {
      tabTrigger.click();
      tabTrigger.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Also update local state immediately
    setAnnouncements(prev => prev.map(a => ({...a, isRead: true})))

    // This is a simple way to communicate between components without a complex state manager.
    // It tells other parts of the app that the announcements have been seen.
    localStorage.setItem('announcements_tab_clicked', 'true');
    const event = new Event('storage');
    window.dispatchEvent(event);
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
