'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DocumentList } from './document-list'
import { UploadDialog } from './upload-dialog'
import { documents as allDocuments, users as allUsers, documentTypesList, holidays as initialHolidays, HolidayLocation, holidayLocations, announcements as initialAnnouncements, Announcement } from '@/lib/mock-data'
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
import { Calendar, Bell, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'

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
  const [announcements, setAnnouncements] = useState(initialAnnouncements.map(a => ({...a, isRead: a.isRead ?? false })));
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'uploadDate', direction: 'descending' });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All']);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [holidayLocationFilter, setHolidayLocationFilter] = useState<HolidayLocation | 'all'>('all');

  const hasUnreadAnnouncements = useMemo(() => announcements.some(a => !a.isRead), [announcements]);

  useEffect(() => {
    const handleStorageChange = () => {
      const tabClicked = localStorage.getItem('announcements_tab_clicked');
      if (tabClicked === 'true') {
        setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
        localStorage.removeItem('announcements_tab_clicked');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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

  const { availableYears, availableMonths } = useMemo(() => {
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
        availableYears: Array.from(years).sort((a, b) => Number(b) - Number(a)),
        availableMonths: Array.from(months).sort((a, b) => a - b)
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
  
  const filteredHolidays = useMemo(() => {
    return [...holidays]
      .filter(holiday => holidayLocationFilter === 'all' || holiday.location === 'ALL' || holiday.location === holidayLocationFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, holidayLocationFilter]);

  const latestAnnouncement = useMemo(() => announcements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0], [announcements]);

  const sortedAnnouncements = useMemo(() => [...announcements].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [announcements]);

  const onTabChange = useCallback((value: string) => {
    if (value === 'announcements') {
      setTimeout(() => {
        setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
        // Tell other components (like the header bell) that we've read everything
        localStorage.setItem('announcements_all_read', 'true');
        const event = new Event('storage');
        window.dispatchEvent(event);

      }, 200); // Small delay to allow tab to switch
    }
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
            <p className="text-muted-foreground">Access and manage your personal and company documents.</p>
        </div>
        <UploadDialog onUploadComplete={handleUploadComplete} />
      </div>
      
      {latestAnnouncement && (
        <Alert className={cn(!latestAnnouncement.isRead && 'border-primary')}>
            <Info className="h-4 w-4" />
            <AlertTitle>{latestAnnouncement.title}</AlertTitle>
            <AlertDescription>{latestAnnouncement.message}</AlertDescription>
        </Alert>
      )}

       <Tabs defaultValue="documents" onValueChange={onTabChange}>
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
                                        {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
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
                                        {availableMonths.map(month => <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>)}
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
                    <div className="mb-4">
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
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No holidays found for selected location.</TableCell>
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
                    <CardContent className="space-y-4">
                        {sortedAnnouncements.length > 0 ? sortedAnnouncements.map(announcement => (
                            <div key={announcement.id} className={cn("p-4 border rounded-lg relative overflow-hidden", !announcement.isRead && "bg-blue-50/50 border-blue-200")}>
                                {!announcement.isRead && <div className="absolute left-0 top-0 h-full w-1.5 bg-primary"></div>}
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    {announcement.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Posted on {new Date(announcement.date).toLocaleString()} by {announcement.author}
                                </p>
                                <p className="mt-2 text-sm">{announcement.message}</p>
                            </div>
                        )) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>No announcements right now.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
      </Tabs>
    </>
  )
}
