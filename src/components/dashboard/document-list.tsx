'use client'
import React, { useState } from 'react'
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
import { FileText, FileArchive, FileImage, Download, MoreHorizontal, Trash2, ChevronsUpDown, ArrowUp, ArrowDown, UserPlus, Send, Undo, Trash } from 'lucide-react'
import type { Document, User } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Checkbox } from '../ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermanentDeleteDialog } from './permanent-delete-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  onReassign?: (docId: string, newOwnerId: string) => void;
  onDelete?: (docId: string) => void;
  onBulkDelete?: (docIds: string[]) => void;
  isDeletedList?: boolean;
  onRestore?: (docId: string) => void;
  onPermanentDelete?: (docId: string) => void;
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


export const DocumentList = React.memo(({ documents, users, showOwner = false, onSort, sortConfig, onReassign, onDelete, onBulkDelete, isDeletedList = false, onRestore, onPermanentDelete }: DocumentListProps) => {
  const { toast } = useToast()
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [assignToUserId, setAssignToUserId] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const handleDownload = (docName: string) => {
    toast({
      title: "Downloading...",
      description: `${docName} is being downloaded.`,
    })
  }

  const getOwnerName = (ownerId: string) => {
    if (!ownerId) return <span className='text-muted-foreground italic'>Unassigned</span>
    return users.find(u => u.id === ownerId)?.name || <span className='text-muted-foreground italic'>Unknown User</span>;
  }

  const handleSelectDoc = (docId: string, checked: boolean) => {
    setSelectedDocIds(prev => {
      if (checked) {
        return [...prev, docId];
      } else {
        return prev.filter(id => id !== docId);
      }
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedDocIds(documents.map(d => d.id));
    } else {
      setSelectedDocIds([]);
    }
  };

  const handleBulkReassign = () => {
    if (onReassign && assignToUserId && selectedDocIds.length > 0) {
      selectedDocIds.forEach(docId => {
        onReassign(docId, assignToUserId);
      });
      setSelectedDocIds([]);
      setAssignToUserId(null);
    }
  }

  const handleConfirmBulkDelete = () => {
    if (onBulkDelete && selectedDocIds.length > 0) {
      onBulkDelete(selectedDocIds);
    }
    setSelectedDocIds([]);
    setIsBulkDeleteDialogOpen(false);
  }

  const numSelected = selectedDocIds.length;
  const numDocuments = documents.length;

  if (documents.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-4">No documents found.</p>
  }

  return (
    <div>
      {(onReassign || onBulkDelete) && numSelected > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg justify-between">
          <div className='flex items-center gap-2'>
            <span className="text-sm font-medium text-muted-foreground">{numSelected} selected</span>
            {onReassign && (
              <>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Re-assign to:</span>
                <Select onValueChange={setAssignToUserId} value={assignToUserId || ''}>
                  <SelectTrigger className="w-[200px] bg-background">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleBulkReassign} disabled={!assignToUserId}>
                  <Send className="mr-2 h-4 w-4" />
                  Assign
                </Button>
              </>
            )}
          </div>
          {onBulkDelete && (
            <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({numSelected})
            </Button>
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {(onReassign || onBulkDelete) && !isDeletedList && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={numSelected === numDocuments && numDocuments > 0 ? true : numSelected > 0 ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all documents"
                />
              </TableHead>
            )}
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
            <TableRow key={doc.id} data-state={selectedDocIds.includes(doc.id) && "selected"}>
              {(onReassign || onBulkDelete) && !isDeletedList && (
                <TableCell>
                  <Checkbox
                    checked={selectedDocIds.includes(doc.id)}
                    onCheckedChange={(checked) => handleSelectDoc(doc.id, !!checked)}
                    aria-label={`Select ${doc.name}`}
                  />
                </TableCell>
              )}
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
                {isDeletedList ? (
                  <div className="flex items-center justify-end gap-2">
                    {onRestore &&
                      <Button variant="outline" size="sm" onClick={() => onRestore(doc.id)}>
                        <Undo className="mr-2 h-4 w-4" /> Restore
                      </Button>
                    }
                    {onPermanentDelete &&
                      <PermanentDeleteDialog
                        itemName={doc.name}
                        itemType="document"
                        onDelete={() => onPermanentDelete(doc.id)}
                      >
                        <Button variant="destructive" size="sm">
                          <Trash className="mr-2 h-4 w-4" /> Permanent Delete
                        </Button>
                      </PermanentDeleteDialog>
                    }
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc.name)}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                    {onDelete && (
                      <Button variant="destructive" size="sm" onClick={() => onDelete(doc.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    )}
                  </div>
                )}
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isDeletedList ? (
                        <>
                          {onRestore &&
                            <DropdownMenuItem onClick={() => onRestore(doc.id)}>
                              <Undo className="mr-2 h-4 w-4" /> Restore
                            </DropdownMenuItem>
                          }
                          {onPermanentDelete &&
                            <PermanentDeleteDialog
                              itemName={doc.name}
                              itemType="document"
                              onDelete={() => onPermanentDelete(doc.id)}
                            >
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" /> Permanent Delete
                              </DropdownMenuItem>
                            </PermanentDeleteDialog>
                          }
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => handleDownload(doc.name)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          {onDelete && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(doc.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the selected {numSelected} document(s) to the deleted items list. You can restore them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
              Delete {numSelected} Document(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
});
DocumentList.displayName = 'DocumentList';