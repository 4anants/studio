'use client'
import React from 'react'
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
import { FileText, FileArchive, FileImage, Download, MoreHorizontal, Trash2, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Document, User } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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

type SortKey = keyof Document;
type SortDirection = 'ascending' | 'descending';

interface DocumentListProps {
  documents: Document[];
  users: User[];
  showOwner?: boolean;
  onSort: (key: SortKey) => void;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
}

const SortableHeader = React.memo(({
  children,
  sortKey,
  onSort,
  sortConfig,
  className,
}: {
  children: React.ReactNode;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  className?: string;
}) => {
  const isSorting = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  const Icon = isSorting
    ? direction === 'ascending' ? ArrowUp : ArrowDown
    : ChevronsUpDown;

  return (
    <TableHead className={cn("cursor-pointer hover:bg-muted/50", className)} onClick={() => onSort(sortKey)}>
      <div className="flex items-center gap-2">
        {children}
        <Icon className={`h-4 w-4 ${isSorting ? 'text-foreground' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );
});
SortableHeader.displayName = 'SortableHeader';


export const DocumentList = React.memo(({ documents, users, showOwner = false, onSort, sortConfig }: DocumentListProps) => {
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
    if (!ownerId) return <span className='text-muted-foreground italic'>Unassigned</span>
    return users.find(u => u.id === ownerId)?.name || <span className='text-muted-foreground italic'>Unknown User</span>;
  }

  if (documents.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-4">No documents found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px] hidden sm:table-cell"></TableHead>
          <SortableHeader sortKey="name" onSort={onSort} sortConfig={sortConfig}>Name</SortableHeader>
          {showOwner && <TableHead className="hidden md:table-cell">Owner</TableHead>}
          <SortableHeader sortKey="type" onSort={onSort} sortConfig={sortConfig}>Type</SortableHeader>
          <TableHead className="hidden md:table-cell">Size</TableHead>
          <SortableHeader sortKey="uploadDate" onSort={onSort} sortConfig={sortConfig} className="hidden lg:table-cell">Uploaded</SortableHeader>
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
});
DocumentList.displayName = 'DocumentList';

    