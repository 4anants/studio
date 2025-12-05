'use client'

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
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
import { UploadCloud, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { type User } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface BulkUserImportDialogProps {
  onImport: (users: User[]) => void;
  children: React.ReactNode;
}

const requiredHeaders = ['id', 'name', 'email', 'role', 'status'];

type ParsedUser = Partial<User> & {
    _row: number;
    _errors: string[];
}

export function BulkUserImportDialog({ onImport, children }: BulkUserImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileParse = (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
            toast({
                variant: 'destructive',
                title: 'CSV Parsing Error',
                description: results.errors.map(e => e.message).join(', '),
            });
            setIsLoading(false);
            return;
        }

        const headers = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid CSV Format',
                description: `The following required columns are missing: ${missingHeaders.join(', ')}`,
            });
            setIsLoading(false);
            setFileName(null);
            return;
        }

        const validatedUsers = results.data.map((row, index) => {
            const user: ParsedUser = { _row: index + 2, _errors: [] };
            
            // Basic validation
            if (!row.id) user._errors.push('ID is missing.');
            if (!row.name) user._errors.push('Name is missing.');
            if (!row.email || !/\S+@\S+\.\S+/.test(row.email)) user._errors.push('A valid email is required.');
            if (!['admin', 'employee'].includes(row.role)) user._errors.push('Role must be "admin" or "employee".');
            if (!['active', 'inactive', 'pending', 'deleted'].includes(row.status)) user._errors.push('Status is invalid.');

            // If no errors, map the data
            if(user._errors.length === 0) {
                Object.assign(user, {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    personalEmail: row.personalEmail,
                    mobile: row.mobile,
                    password: row.password, // Note: importing passwords might be a security risk.
                    dateOfBirth: row.dateOfBirth,
                    joiningDate: row.joiningDate,
                    resignationDate: row.resignationDate,
                    designation: row.designation,
                    status: row.status as User['status'],
                    department: row.department,
                    bloodGroup: row.bloodGroup,
                    company: row.company,
                    location: row.location,
                    role: row.role as User['role'],
                    avatar: row.avatar || String(Date.now() + index),
                });
            } else {
                Object.assign(user, row);
            }
            return user;
        });

        setParsedUsers(validatedUsers);
        setIsLoading(false);
      },
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileParse(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });
  
  const handleImport = () => {
    const validUsers = parsedUsers
        .filter(u => u._errors.length === 0)
        .map(({ _row, _errors, ...user }) => user as User);
    
    if (validUsers.length > 0) {
        onImport(validUsers);
    }
    
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setParsedUsers([]);
    setFileName(null);
    setIsLoading(false);
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetState();
    }
    setOpen(isOpen);
  }
  
  const hasErrors = parsedUsers.some(u => u._errors.length > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users /> Bulk User Import</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple users at once.
            Required columns: {requiredHeaders.join(', ')}.
          </DialogDescription>
        </DialogHeader>

        {!fileName ? (
            <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-12 w-12" />
                    {isLoading ? <p>Processing...</p> : <p>Drag & drop a CSV file here, or click to browse</p>}
                </div>
            </div>
        ) : (
            <div>
                <h3 className="font-semibold mb-2">Import Preview for: <span className="font-normal text-muted-foreground">{fileName}</span></h3>
                {isLoading ? (
                     <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Analyzing CSV...</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Errors</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedUsers.map((user, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {user._errors.length > 0 ? 
                                                <AlertCircle className="h-5 w-5 text-destructive" /> : 
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            }
                                        </TableCell>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell className="text-destructive text-xs">
                                            {user._errors.join(', ')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isLoading || parsedUsers.length === 0 || hasErrors}>
            Import {parsedUsers.filter(u => u._errors.length === 0).length} Valid User(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
