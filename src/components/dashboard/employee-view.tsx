'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DocumentList } from './document-list'
import { UploadDialog } from './upload-dialog'
import { documents as allDocuments } from '@/lib/mock-data'

// Simulate a logged-in employee user
const currentUserId = 'user-1'

export function EmployeeView() {
  const [userDocuments, setUserDocuments] = useState(
    allDocuments.filter((doc) => doc.ownerId === currentUserId)
  )

  const handleUploadComplete = () => {
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
  }

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
          <DocumentList documents={userDocuments} />
        </CardContent>
      </Card>
    </>
  )
}
