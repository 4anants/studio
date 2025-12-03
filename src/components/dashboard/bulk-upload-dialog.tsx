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
import { Progress } from '@/components/ui/progress';
import { UploadCloud, FileCheck2, Loader2, Files, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { classifyDocuments } from '@/ai/flows/classify-documents-flow';
import type { User, Document } from '@/lib/mock-data'

type UploadedFile = {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: {
    employeeId: string;
    employeeName: string;
    documentType: string;
  };
  error?: string;
};

interface BulkUploadDialogProps {
    onBulkUploadComplete: (documents: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[]) => void;
    users: User[];
}

export function BulkUploadDialog({ onBulkUploadComplete, users }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({ file, status: 'pending' }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

  const handleProcessFiles = async () => {
    setIsProcessing(true);
    setIsComplete(false);
    
    setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'processing' })));

    const employeeList = users.map(u => ({ id: u.id, name: u.name }));
    const fileNames = uploadedFiles.map(f => f.file.name);

    try {
        const results = await classifyDocuments({
            documents: fileNames,
            employees: employeeList
        });

        setUploadedFiles(prev => {
            return prev.map((file) => {
                const result = results.find(r => r.originalFilename === file.file.name);
                if (result && result.employeeId && result.documentType) {
                    const employee = users.find(u => u.id === result.employeeId);
                    return {
                        ...file,
                        status: 'success',
                        result: {
                            employeeId: result.employeeId,
                            employeeName: employee?.name || 'Unknown',
                            documentType: result.documentType,
                        }
                    }
                }
                return {
                    ...file,
                    status: 'error',
                    error: result?.error || 'Could not classify document.',
                }
            })
        });

    } catch (e) {
        console.error(e);
        setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error', error: 'An unexpected error occurred.'})))
    }

    setIsProcessing(false);
    setIsComplete(true);
  };

  const handleFinish = () => {
    const newDocs: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[] = uploadedFiles
        .filter(f => f.status === 'success' && f.result)
        .map(f => ({
            name: f.file.name,
            ownerId: f.result!.employeeId,
            type: f.result!.documentType as any,
        }));
    
    startTransition(() => {
        onBulkUploadComplete(newDocs);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Drop document files below. The system will automatically classify them and assign them to the correct employee.
          </DialogDescription>
        </DialogHeader>
        
        <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <UploadCloud className="h-12 w-12" />
                <p>Drag & drop files here, or</p>
                <Button type="button" variant="outline" size="sm" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"][style*="display: none"]')?.click()}>Browse Files</Button>
            </div>
        </div>

        {uploadedFiles.length > 0 && (
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-4">
                <h4 className="font-semibold">Files to Upload</h4>
                {uploadedFiles.map(({ file, status, result, error }, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                       <div className="flex items-center gap-3 overflow-hidden">
                         {status === 'pending' && <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-muted-foreground" />}
                         {status === 'processing' && <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-primary" />}
                         {status === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />}
                         {status === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />}

                         <div className="flex-grow overflow-hidden">
                            <p className="truncate font-medium text-sm">{file.name}</p>
                            {status === 'success' && result && (
                                <p className="text-xs text-muted-foreground">
                                    Assigned to: <span className="font-semibold text-foreground">{result.employeeName}</span>, Type: <span className="font-semibold text-foreground">{result.documentType}</span>
                                </p>
                            )}
                             {status === 'error' && (
                                <p className="text-xs text-destructive">{error}</p>
                            )}
                         </div>
                       </div>
                       {!isProcessing && !isComplete && (
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                             <X className="h-4 w-4" />
                         </Button>
                       )}
                    </div>
                ))}
            </div>
        )}

        <DialogFooter>
          {isComplete ? (
            <Button type="button" onClick={handleFinish} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2" />}
              Finish & Add Documents
            </Button>
          ) : (
             <Button type="button" onClick={handleProcessFiles} disabled={isProcessing || uploadedFiles.length === 0}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process {uploadedFiles.length} File(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
