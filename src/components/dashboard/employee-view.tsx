'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DocumentList } from './document-list'
import { UploadDialog } from './upload-dialog'
import { documents as allDocuments, users as allUsers, documentTypesList, holidays as initialHolidays, HolidayLocation, holidayLocations, announcements as initialAnnouncements, Announcement, User } from '@/lib/mock-data'
import type { Document } from '@/lib/mock-data'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
import { Calendar, Bell, MailOpen, Mail, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Simulate a logged-in employee user
const currentUserId = 'user-1'
type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function EmployeeView() {
  const [userDocuments, setUserDocuments] = useState(
    allDocuments.filter((doc) => doc.ownerId === currentUserId)
  )
  const [holidays] = useState(initialHolidays);
  const [announcements, setAnnouncements] = useState(initialAnnouncements.map(a => ({...a, isRead: a.isRead ?? false, status: a.status || 'published' })));
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'uploadDate', direction: 'descending' });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All']);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [holidayLocationFilter, setHolidayLocationFilter] = useState<HolidayLocation | 'all'>('all');
  const [activeTab, setActiveTab] = useState('documents');

  const hasUnreadAnnouncements = useMemo(() => announcements.some(a => !a.isRead), [announcements]);

  useEffect(() => {
    const handleViewAnnouncements = () => {
      setActiveTab('announcements');
    };
    window.addEventListener('view-announcements', handleViewAnnouncements);
    return () => {
      window.removeEventListener('view-announcements', handleViewAnnouncements);
    };
  }, []);

  const handleUploadComplete = useCallback(() => {
    // In a real app, you would refetch the documents.
    // Here, we just add a dummy document to simulate the update.
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: 'New Document.pdf',
      type: 'Personal' as const,
      size: '150 KB',
      uploadDate: new Date().toISOString().split('T')[0],
      ownerId: currentUserId,
      fileType: 'pdf' as const,
    }
    setUserDocuments((prev) => [newDoc, ...prev])
  }, [])

  const requestSort = useCallback((key: SortKey) => {
    setSortConfig(currentSortConfig => {
      let direction: SortDirection = 'ascending';
      if (currentSortConfig && currentSortConfig.key === key && currentSortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      return { key, direction };
    });
  }, []);
  
  const handleTypeSelection = useCallback((type: string) => {
    setSelectedTypes(prevTypes => {
      if (type === 'All') {
        return ['All'];
      }
      
      const newTypes = prevTypes.filter(t => t !== 'All');

      if (newTypes.includes(type)) {
        const filteredTypes = newTypes.filter(t => t !== type);
        return filteredTypes.length === 0 ? ['All'] : filteredTypes;
      } else {
        return [...newTypes, type];
      }
    });
  }, []);

  const { docYears, docMonths } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<number>();
    
    userDocuments
      .filter(doc => selectedTypes.includes('All') || selectedTypes.includes(doc.type))
      .forEach(doc => {
        const date = new Date(doc.uploadDate);
        years.add(date.getFullYear().toString());
        if (selectedYear === 'all' || date.getFullYear().toString() === selectedYear) {
            months.add(date.getMonth());
        }
    });

    return { 
        docYears: Array.from(years).sort((a, b) => Number(b) - Number(a)),
        docMonths: Array.from(months).sort((a, b) => a - b)
    };
  }, [userDocuments, selectedTypes, selectedYear]);

  const filteredDocuments = useMemo(() => {
    return userDocuments.filter(doc => {
      const date = new Date(doc.uploadDate);
      const typeMatch = selectedTypes.includes('All') || selectedTypes.includes(doc.type);
      const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
      return typeMatch && yearMatch && monthMatch;
    });
  }, [userDocuments, selectedTypes, selectedYear, selectedMonth]);

  const sortedAndFilteredDocuments = useMemo(() => {
    let sortableItems = [...filteredDocuments];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredDocuments, sortConfig]);
  
  const { holidayYears, holidayMonths } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<number>();
    holidays.forEach(holiday => {
        const date = new Date(holiday.date);
        years.add(date.getFullYear().toString());
        if (selectedYear === 'all' || date.getFullYear().toString() === selectedYear) {
            months.add(date.getMonth());
        }
    });
    return {
        holidayYears: Array.from(years).sort((a,b) => Number(b) - Number(a)),
        holidayMonths: Array.from(months).sort((a,b) => a - b)
    };
  }, [holidays, selectedYear]);

  const filteredHolidays = useMemo(() => {
    return [...holidays]
      .filter(holiday => {
          const date = new Date(holiday.date);
          const locationMatch = holidayLocationFilter === 'all' || holiday.location === 'ALL' || holiday.location === holidayLocationFilter;
          const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
          const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
          return locationMatch && yearMatch && monthMatch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, holidayLocationFilter, selectedYear, selectedMonth]);

  const { announcementYears, announcementMonths } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<number>();
    announcements.forEach(announcement => {
        const date = new Date(announcement.date);
        years.add(date.getFullYear().toString());
        if (selectedYear === 'all' || date.getFullYear().toString() === selectedYear) {
            months.add(date.getMonth());
        }
    });
    return {
        announcementYears: Array.from(years).sort((a,b) => Number(b) - Number(a)),
        announcementMonths: Array.from(months).sort((a,b) => a - b)
    };
    }, [announcements, selectedYear]);

  const filteredAnnouncements = useMemo(() => {
      return [...announcements]
      .filter(announcement => announcement.status === 'published')
      .filter(announcement => {
          const date = new Date(announcement.date);
          const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
          const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth;
          return yearMatch && monthMatch;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [announcements, selectedYear, selectedMonth]);

  const onTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setSelectedYear('all');
    setSelectedMonth('all');
    if (value === 'announcements') {
      setTimeout(() => {
        setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
        localStorage.setItem('announcements_all_read', 'true');
        window.dispatchEvent(new Event('storage'));
      }, 200); 
    }
  }, []);

  const toggleAnnouncementRead = useCallback((id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: !a.isRead } : a));
  }, []);

  const isEventUpcoming = (eventDate?: string) => {
      if (!eventDate) return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      const eDate = new Date(eventDate);
      eDate.setTime(eDate.getTime() + eDate.getTimezoneOffset() * 60 * 1000); // Adjust for timezone
      return eDate >= today;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
            <p className="text-muted-foreground">Access and manage your personal and company documents.</p>
        </div>
        <UploadDialog onUploadComplete={handleUploadComplete} />
      </div>
      
       <Tabs value={activeTab} onValueChange={onTabChange} className="pt-4">
            <TabsList>
                <TabsTrigger value="documents">My Documents</TabsTrigger>
                <TabsTrigger value="holidays">Holiday List</TabsTrigger>
                <TabsTrigger value="announcements" className="relative">
                    Announcements
                    {hasUnreadAnnouncements && <span className="relative flex h-3 w-3 ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="documents">
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Filter by</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Document Type</label>
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <Button
                                    variant={selectedTypes.includes('All') ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleTypeSelection('All')}
                                >
                                    All
                                </Button>
                                {documentTypesList.map(type => (
                                    <Button
                                        key={type}
                                        variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleTypeSelection(type)}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex-grow min-w-[120px]">
                                <label className="text-sm font-medium">Year</label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full mt-1">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {docYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-grow min-w-[120px]">
                                  <label className="text-sm font-medium">Month</label>
                                  <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                    <SelectTrigger className="w-full mt-1">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {docMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Your Files</CardTitle>
                    <CardDescription>
                        Here are all documents associated with your account.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <DocumentList documents={sortedAndFilteredDocuments} users={allUsers} onSort={requestSort} sortConfig={sortConfig} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="holidays">
                 <Card>
                    <CardHeader>
                        <CardTitle>Holiday List</CardTitle>
                        <CardDescription>Upcoming company holidays for the year.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="flex-grow">
                                <label className="text-sm font-medium">Filter by Location</label>
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <Button
                                        variant={holidayLocationFilter === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setHolidayLocationFilter('all')}
                                    >
                                        All
                                    </Button>
                                    {holidayLocations.filter(l => l !== 'ALL').map(loc => (
                                        <Button
                                            key={loc}
                                            variant={holidayLocationFilter === loc ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setHolidayLocationFilter(loc)}
                                        >
                                            {loc}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-grow min-w-[120px]">
                                    <label className="text-sm font-medium">Year</label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Years</SelectItem>
                                            {holidayYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-grow min-w-[120px]">
                                    <label className="text-sm font-medium">Month</label>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Months</SelectItem>
                                            {holidayMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Holiday Name</TableHead>
                                <TableHead>Location</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {filteredHolidays.length > 0 ? filteredHolidays.map(holiday => (
                                <TableRow key={holiday.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                        </div>
                                    </TableCell>
                                    <TableCell>{holiday.name}</TableCell>
                                    <TableCell>
                                         <span className={cn('px-2 py-1 rounded-full text-xs font-medium', 
                                            holiday.location === 'ALL' ? 'bg-blue-100 text-blue-800' : 
                                            'bg-secondary text-secondary-foreground'
                                        )}>
                                           {holiday.location}
                                        </span>
                                    </TableCell>
                                </TableRow>
                           )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No holidays found for selected filters.</TableCell>
                                </TableRow>
                           )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="announcements">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Announcements</CardTitle>
                        <CardDescription>Stay up to date with the latest news and updates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-2 mb-4">
                            <div className="flex-grow min-w-[120px]">
                                <label className="text-sm font-medium">Year</label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full mt-1">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {announcementYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-grow min-w-[120px]">
                                <label className="text-sm font-medium">Month</label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                    <SelectTrigger className="w-full mt-1">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {announcementMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {filteredAnnouncements.length > 0 ? filteredAnnouncements.map(announcement => {
                                const isUpcoming = isEventUpcoming(announcement.eventDate);
                                return (
                                <div key={announcement.id} className={cn(
                                    "p-4 border rounded-lg relative overflow-hidden", 
                                    isUpcoming && "bg-blue-50/50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700",
                                    !isUpcoming && !announcement.isRead && "bg-secondary"
                                )}>
                                     {isUpcoming && <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500 animate-pulse"></div>}
                                    <div className="absolute top-2 right-2">
                                        <Button variant="ghost" size="sm" onClick={() => toggleAnnouncementRead(announcement.id)} disabled={isUpcoming}>
                                            {announcement.isRead ? (
                                                <>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Mark as Unread
                                                </>
                                            ) : (
                                                <>
                                                    <MailOpen className="mr-2 h-4 w-4" />
                                                    Mark as Read
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-primary" />
                                        {announcement.title}
                                    </h3>
                                    {announcement.eventDate && (
                                        <div className={cn("mt-1 flex items-center gap-2 text-sm", isUpcoming ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                                            <Calendar className="h-4 w-4" />
                                            <span>Event Date: {new Date(announcement.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                            {isUpcoming && <span className="text-xs font-bold">(UPCOMING)</span>}
                                        </div>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Posted on {new Date(announcement.date).toLocaleString()} by {announcement.author}
                                    </p>
                                    <p className="mt-2 text-sm pr-32">{announcement.message}</p>
                                </div>
                            )}) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No announcements found for the selected period.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
      </Tabs>
    </>
  )
}
