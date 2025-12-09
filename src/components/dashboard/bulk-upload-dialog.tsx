
'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileCheck2, Loader2, Files, X, CheckCircle, AlertCircle, Tag, Calendar, Undo } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { User, Document } from '@/lib/mock-data'
import { documentTypesList } from '@/lib/mock-data';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


type UploadedFile = {
  file: File;
  dataUri: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  selected: boolean;
  result?: {
    employeeId?: string;
    employeeName?: string;
    documentType?: string;
  };
  error?: string;
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

interface BulkUploadDialogProps {
    onBulkUploadComplete: (documents: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[], originalFiles: File[]) => void;
    users: User[];
}

export function BulkUploadDialog({ onBulkUploadComplete, users }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: Promise<UploadedFile>[] = acceptedFiles.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onabort = () => reject('file reading was aborted');
        reader.onerror = () => reject('file reading has failed');
        reader.onload = () => {
          const dataUri = reader.result as string;
          resolve({ file, dataUri, status: 'pending', selected: true });
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(newFiles).then(files => {
      setUploadedFiles(prev => [...prev, ...files]);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({ 
    onDrop, 
    noClick: true,
    noKeyboard: true 
  });
  
  const processWithFilename = () => {
    const results = uploadedFiles.map(f => {
        let filename = f.file.name.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ');
        if (selectedDocType === 'Salary Slip') {
            filename += ` salary slip for ${monthNames[parseInt(selectedMonth)]} ${selectedYear}`;
        }


        let bestMatch: { user: User; score: number } | null = null;

        users.forEach(user => {
            const userName = user.name.toLowerCase();
            // Exact match
            if (filename.includes(userName)) {
                if (!bestMatch || userName.length > bestMatch.user.name.length) {
                    bestMatch = { user, score: 100 };
                }
                return;
            }

            // Partial match logic
            const nameParts = userName.split(' ');
            if (nameParts.length > 1) {
                const firstName = nameParts[0];
                const lastName = nameParts[nameParts.length - 1];
                
                // Check for "firstname lastname"
                if (filename.includes(`${firstName} ${lastName}`)) {
                    const score = (`${firstName} ${lastName}`).length;
                    if (!bestMatch || score > bestMatch.score) {
                        bestMatch = { user, score };
                    }
                }
                // Check for "firstname" only
                 if (filename.includes(firstName)) {
                    const score = firstName.length;
                    if (!bestMatch || score > bestMatch.score) {
                        bestMatch = { user, score: score / 2 }; // Lower score for partial
                    }
                }
            }
        });
        
        return {
            originalFilename: f.file.name,
            employeeId: bestMatch?.user.id,
            employeeName: bestMatch?.user.name,
            documentType: selectedDocType,
            error: !bestMatch ? `Could not determine employee from filename.` : undefined,
        };
    });
    return results;
  };

  const handleProcessFiles = async () => {
    if (!selectedDocType) {
        toast({
            variant: 'destructive',
            title: 'Document Type Required',
            description: 'Please select a document type before processing.'
        });
        return;
    }
    setIsProcessing(true);
    setIsComplete(false);

    setUploadedFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'processing' }))
    );
    
    // Simulate a short delay for user feedback, as local processing is very fast
    await new Promise(resolve => setTimeout(resolve, 300));
        
    try {
        const results = processWithFilename();

        setUploadedFiles((prev) => {
            return prev.map((file) => {
            const result = results.find(
                (r) => r.originalFilename === file.file.name
            );
            if (result && result.employeeId) {
                return {
                ...file,
                status: 'success',
                selected: true,
                result: {
                    employeeId: result.employeeId,
                    employeeName: result.employeeName,
                    documentType: result.documentType,
                },
                };
            }
            return {
                ...file,
                status: 'error',
                selected: false, // Don't select errored uploads
                error: result?.error || 'Could not classify this document.',
            };
            });
        });
    } catch (e: any) {
        console.error(e);
        toast({
            variant: 'destructive',
            title: 'Processing Failed',
            description: e.message || 'An unexpected error occurred during processing.'
        });
        setUploadedFiles((prev) =>
            prev.map((f) => ({
            ...f,
            status: 'error',
            error: 'An unexpected error occurred during batch processing.',
            selected: false,
            }))
        );
    }

    setIsProcessing(false);
    setIsComplete(true);
  };

  const handleFinish = () => {
    const successfulUploads = uploadedFiles.filter(f => f.status === 'success' && f.result && f.selected);

    if (successfulUploads.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Documents to Add',
            description: 'Please select at least one successfully processed document to add.'
        });
        return;
    }

    const newDocs: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[] = successfulUploads
        .map(f => ({
            name: f.file.name,
            ownerId: f.result!.employeeId!,
            type: f.result!.documentType!,
        }));
    
    const originalFiles = successfulUploads.map(f => f.file);
    
    startTransition(() => {
        onBulkUploadComplete(newDocs, originalFiles);
    });

    setOpen(false);
    // Reset state after a delay
    setTimeout(() => {
        setIsComplete(false);
        setUploadedFiles([]);
    }, 500);
  }
  
  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when dialog is closed
      setUploadedFiles([]);
      setIsProcessing(false);
      setIsComplete(false);
      setSelectedDocType('');
    }
    setOpen(isOpen);
  };

  const handleToggleSelect = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].status === 'success') {
        newFiles[index] = { ...newFiles[index], selected: !newFiles[index].selected };
      }
      return newFiles;
    });
  };

  const successfullyProcessedFiles = uploadedFiles.filter(f => f.status === 'success');
  const numSelected = successfullyProcessedFiles.filter(f => f.selected).length;
  const numSuccessful = successfullyProcessedFiles.length;

  const handleToggleSelectAll = (checked: boolean | 'indeterminate') => {
    setUploadedFiles(prev =>
      prev.map(file =>
        file.status === 'success' ? { ...file, selected: !!checked } : file
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Files className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Centralized Bulk Upload</DialogTitle>
          <DialogDescription>
            Select a document type, then drop files below. The system will read the employee's name from the filename.
          </DialogDescription>
        </DialogHeader>
        
        {!isProcessing && !isComplete && (
          <>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 my-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="doc-type-select" className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-500"/>
                    <span>Classify as</span>
                </Label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                    <SelectTrigger id="doc-type-select" className="w-[200px]">
                        <SelectValue placeholder="Select a document type" />
                    </SelectTrigger>
                    <SelectContent>
                        {documentTypesList.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
               {selectedDocType === 'Salary Slip' && (
                 <div className="flex items-center space-x-2">
                    <Label htmlFor="month-select" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500"/>
                        <span>For Period</span>
                    </Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                         <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map((month, i) => <SelectItem key={month} value={String(i)}>{month}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
              )}
            </div>
            <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-12 w-12" />
                    <p>Drag & drop files here, or</p>
                    <Button type="button" variant="outline" size="sm" onClick={openFileDialog}>Browse Files</Button>
                </div>
            </div>
          </>
        )}

        {uploadedFiles.length > 0 && (
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-4">
                 {isComplete && numSuccessful > 0 && (
                  <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                    <Checkbox
                      id="select-all-processed"
                      checked={numSelected === numSuccessful && numSuccessful > 0 ? true : numSelected > 0 ? 'indeterminate' : false}
                      onCheckedChange={handleToggleSelectAll}
                    />
                    <Label htmlFor="select-all-processed" className="text-sm font-medium">
                        {numSelected} of {numSuccessful} document(s) selected
                    </Label>
                  </div>
                )}
                {uploadedFiles.map((uploadedFile, index) => {
                    const isSuccess = isComplete && uploadedFile.status === 'success';
                    return (
                        <div 
                            key={`${uploadedFile.file.name}-${index}`} 
                            className={cn("flex items-center justify-between rounded-lg bg-muted/50 p-3",
                                isSuccess && "cursor-pointer hover:bg-muted"
                            )}
                            onClick={isSuccess ? () => handleToggleSelect(index) : undefined}
                        >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {isSuccess ? (
                            <Checkbox
                                checked={uploadedFile.selected}
                                onCheckedChange={() => { /* Handled by row click */ }}
                                onClick={(e) => e.stopPropagation()}
                                id={`select-file-${index}`}
                                />
                            ) : uploadedFile.status === 'pending' ? <Loader2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                            : uploadedFile.status === 'processing' ? <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-primary" />
                            : uploadedFile.status === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                            : <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                            }

                            <div className="flex-grow overflow-hidden">
                                <p className="truncate font-medium text-sm">{uploadedFile.file.name}</p>
                                {uploadedFile.status === 'success' && uploadedFile.result && (
                                    <p className="text-xs text-muted-foreground">
                                        Assigned to: <span className="font-semibold text-foreground">{uploadedFile.result.employeeName} ({uploadedFile.result.employeeId})</span>, Type: <span className="font-semibold text-foreground">{uploadedFile.result.documentType}</span>
                                    </p>
                                )}
                                {(uploadedFile.status === 'error' || uploadedFile.status === 'partial-success') && (
                                    <p className="text-xs text-destructive">{uploadedFile.error}</p>
                                )}
                            </div>
                        </div>
                        {!isProcessing && !isComplete && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeFile(uploadedFile.file); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        </div>
                    );
                })}
            </div>
        )}

        <DialogFooter>
          {isComplete ? (
            <Button type="button" onClick={handleFinish} disabled={isPending || numSelected === 0}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2" />}
              Finish & Add {numSelected} Document(s)
            </Button>
          ) : (
             <Button type="button" onClick={handleProcessFiles} disabled={isProcessing || uploadedFiles.length === 0 || !selectedDocType}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process {uploadedFiles.length} File(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
