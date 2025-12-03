'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DocumentList } from './document-list'
import { UploadDialog } from './upload-dialog'
import { documents as allDocuments, users as allUsers } from '@/lib/mock-data'
import type { Document } from '@/lib/mock-data'

// Simulate a logged-in employee user
const currentUserId = 'user-1'
type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';

export function EmployeeView() {
  const [userDocuments, setUserDocuments] = useState(
    allDocuments.filter((doc) => doc.ownerId === currentUserId)
  )
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'uploadDate', direction: 'descending' });


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

  const sortedDocuments = useMemo(() => {
    let sortableItems = [...userDocuments];
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
  }, [userDocuments, sortConfig]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
            <p className="text-muted-foreground">Access and manage your personal and company documents.</p>
        </div>
        <UploadDialog onUploadComplete={handleUploadComplete} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
          <CardDescription>
            Here are all documents associated with your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList documents={sortedDocuments} users={allUsers} onSort={requestSort} sortConfig={sortConfig} />
        </CardContent>
      </Card>
    </>
  )
}
