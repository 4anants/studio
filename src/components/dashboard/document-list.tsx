'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { FileText, FileArchive, FileImage, Download, MoreHorizontal, Trash2 } from 'lucide-react'
import type { Document, User } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'

function getFileIcon(fileType: Document['fileType']) {
  switch (fileType) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />
    case 'doc':
      return <FileArchive className="h-5 w-5 text-blue-500" />
    case 'image':
      return <FileImage className="h-5 w-5 text-green-500" />
    default:
      return <FileText className="h-5 w-5 text-gray-500" />
  }
}

interface DocumentListProps {
  documents: Document[];
  users: User[];
  showOwner?: boolean;
}

export function DocumentList({ documents, users, showOwner = false }: DocumentListProps) {
  const { toast } = useToast()
    
  const handleDownload = (docName: string) => {
    toast({
      title: "Downloading...",
      description: `${docName} is being downloaded.`,
    })
  }

  const handleDelete = (docName: string) => {
    toast({
      variant: 'destructive',
      title: "Deleting...",
      description: `${docName} is being deleted.`,
    })
  }
  
  const getOwnerName = (ownerId: string) => {
    return users.find(u => u.id === ownerId)?.name || 'Unknown';
  }

  if (documents.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-4">No documents found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px] hidden sm:table-cell"></TableHead>
          <TableHead>Name</TableHead>
          {showOwner && <TableHead className="hidden md:table-cell">Owner</TableHead>}
          <TableHead>Type</TableHead>
          <TableHead className="hidden md:table-cell">Size</TableHead>
          <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="hidden sm:table-cell">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {getFileIcon(doc.fileType)}
              </div>
            </TableCell>
            <TableCell className="font-medium">{doc.name}</TableCell>
            {showOwner && <TableCell className="hidden md:table-cell">{getOwnerName(doc.ownerId)}</TableCell>}
            <TableCell>{doc.type}</TableCell>
            <TableCell className="hidden md:table-cell">{doc.size}</TableCell>
            <TableCell className="hidden lg:table-cell">{doc.uploadDate}</TableCell>
            <TableCell className="text-right">
                <div className="hidden sm:block">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc.name)}>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                </div>
                <div className="sm:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(doc.name)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(doc.name)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
