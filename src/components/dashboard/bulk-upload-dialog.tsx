
'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
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
import { UploadCloud, FileCheck2, Loader2, Files, X, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { classifyDocuments } from '@/ai/flows/classify-documents-flow';
import type { User, Document } from '@/lib/mock-data'
import { documentTypesList } from '@/lib/mock-data';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { ClassifyDocumentsOutput, ClassifyDocumentsInput } from '@/ai/flows/classify-documents-types';
import { Switch } from '../ui/switch';
import { useToast } from '@/hooks/use-toast';


type UploadedFile = {
  file: File;
  dataUri: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'partial-success';
  selected: boolean;
  result?: {
    employeeId?: string;
    employeeName?: string;
    documentType?: string;
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
  const [useFastMode, setUseFastMode] = useState(true);
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

  const processWithAI = async (filesToProcess: { filename: string; dataUri: string }[]) => {
    if (filesToProcess.length === 0) return [];

    const employeeList = users.map((u) => ({ id: u.id, name: u.name }));
  
    const CHUNK_SIZE = 10;
    const chunks: ClassifyDocumentsInput[] = [];
    for (let i = 0; i < filesToProcess.length; i += CHUNK_SIZE) {
      chunks.push({
          documents: filesToProcess.slice(i, i + CHUNK_SIZE),
          employees: employeeList,
      });
    }
  
    const allResults: ClassifyDocumentsOutput = [];
    const promises = chunks.map(chunk => classifyDocuments(chunk));
  
    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(result => allResults.push(...result));
  
    return allResults;
  };
  
  const processWithFastMode = () => {
    const userMap = new Map<string, User>();
    users.forEach(u => {
        userMap.set(u.id.toLowerCase(), u);
        userMap.set(u.name.toLowerCase(), u);
    });

    const findBestMatch = (filename: string, dictionary: string[]): string | undefined => {
        return dictionary
            .filter(item => filename.includes(item))
            .sort((a, b) => b.length - a.length)[0]; // Get the longest match
    };

    const results: ClassifyDocumentsOutput = uploadedFiles.map(f => {
        const filename = f.file.name.toLowerCase();
        let foundUser: User | undefined;
        let foundDocType: string | undefined;

        const bestUserMatchKey = findBestMatch(filename, Array.from(userMap.keys()));
        if (bestUserMatchKey) {
            foundUser = userMap.get(bestUserMatchKey);
        }

        const bestDocTypeMatch = findBestMatch(filename, documentTypesList.map(t => t.toLowerCase()));
        if (bestDocTypeMatch) {
            foundDocType = documentTypesList.find(t => t.toLowerCase() === bestDocTypeMatch);
        }
        
        return {
            originalFilename: f.file.name,
            employeeId: foundUser?.id,
            documentType: foundDocType,
            error: !foundUser && !foundDocType ? `Could not determine employee or document type.` : undefined,
        };
    });
    return results;
};

  const handleProcessFiles = async () => {
    setIsProcessing(true);
    setIsComplete(false);

    setUploadedFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'processing' }))
    );
    
    try {
        let allResults: ClassifyDocumentsOutput;
        let filesForAi: {filename: string, dataUri: string}[] = [];

        if (useFastMode) {
          allResults = processWithFastMode();
          const filesMap = new Map(uploadedFiles.map(f => [f.file.name, f]));
          
          allResults.forEach(result => {
              if (!result.employeeId || !result.documentType) {
                  const file = filesMap.get(result.originalFilename);
                   if (file) {
                      filesForAi.push({ filename: file.file.name, dataUri: file.dataUri });
                  }
              }
          });
          
          if (filesForAi.length > 0) {
            const aiResults = await processWithAI(filesForAi);
            aiResults.forEach(aiResult => {
                const index = allResults.findIndex(r => r.originalFilename === aiResult.originalFilename);
                if (index > -1) {
                    allResults[index] = { ...allResults[index], ...aiResult };
                }
            });
          }

        } else {
          filesForAi = uploadedFiles.map(f => ({filename: f.file.name, dataUri: f.dataUri}));
          allResults = await processWithAI(filesForAi);
        }

      setUploadedFiles((prev) => {
        return prev.map((file) => {
          const result = allResults.find(
            (r) => r.originalFilename === file.file.name
          );
          if (result && result.employeeId && result.documentType) {
            const employee = users.find((u) => u.id === result.employeeId);
            return {
              ...file,
              status: 'success',
              selected: true,
              result: {
                employeeId: result.employeeId,
                employeeName: employee?.name || 'Unknown',
                documentType: result.documentType,
              },
            };
          } else if (result && (result.employeeId || result.documentType)) {
             const employee = users.find((u) => u.id === result.employeeId);
             return {
                ...file,
                status: 'partial-success',
                selected: false,
                result: {
                    employeeId: result.employeeId,
                    employeeName: employee?.name,
                    documentType: result.documentType,
                },
                error: `Needs confirmation. Employee: ${employee?.name || '??'}, Type: ${result.documentType || '??'}`
             }
          }
          return {
            ...file,
            status: 'error',
            selected: false, // Don't select errored uploads
            error: result?.error || 'AI could not classify this document.',
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
    const newDocs: Omit<Document, 'id' | 'size' | 'uploadDate' | 'fileType'>[] = uploadedFiles
        .filter(f => f.status === 'success' && f.result && f.selected)
        .map(f => ({
            name: f.file.name,
            ownerId: f.result!.employeeId!,
            type: f.result!.documentType!,
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when dialog is closed
      setUploadedFiles([]);
      setIsProcessing(false);
      setIsComplete(false);
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
            Drop document files below. The system will analyze their content to automatically classify and assign them.
          </DialogDescription>
        </DialogHeader>
        
        {!isProcessing && !isComplete && (
          <>
            <div className="flex items-center space-x-2 my-4">
              <Switch id="fast-mode-switch" checked={useFastMode} onCheckedChange={setUseFastMode} />
              <Label htmlFor="fast-mode-switch" className='flex items-center gap-2'>
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Fast Mode (from filename)</span>
              </Label>
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
                                onCheckedChange={(checked) => handleToggleSelect(index)}
                                id={`select-file-${index}`}
                                className="pointer-events-none"
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
                                        Assigned to: <span className="font-semibold text-foreground">{uploadedFile.result.employeeName} (Code: {uploadedFile.result.employeeId})</span>, Type: <span className="font-semibold text-foreground">{uploadedFile.result.documentType}</span>
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
