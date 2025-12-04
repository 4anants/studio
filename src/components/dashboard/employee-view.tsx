'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DocumentList } from './document-list'
import { UploadDialog } from './upload-dialog'
import { documents as allDocuments, users as allUsers, documentTypesList } from '@/lib/mock-data'
import type { Document } from '@/lib/mock-data'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Simulate a logged-in employee user
const currentUserId = 'user-1'
type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function EmployeeView() {
  const [userDocuments, setUserDocuments] = useState(
    allDocuments.filter((doc) => doc.ownerId === currentUserId)
  )
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'uploadDate', direction: 'descending' });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All']);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');


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

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
            <p className="text-muted-foreground">Access and manage your personal and company documents.</p>
        </div>
        <UploadDialog onUploadComplete={handleUploadComplete} />
      </div>

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
    </>
  )
}
