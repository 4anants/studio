'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { GlobalConfig } from './types';
import { documentTypesList } from '@/lib/constants';

interface StageOneProps {
    defaultConfig: GlobalConfig;
    onNext: (files: File[], config: GlobalConfig) => void;
}

export function StageOne({ defaultConfig, onNext }: StageOneProps) {
    const [config, setConfig] = useState(defaultConfig);
    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 1 + i).toString());

    return (
        <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={config.docType} onValueChange={(v) => setConfig(prev => ({ ...prev, docType: v }))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {documentTypesList.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={config.month} onValueChange={(v) => setConfig(prev => ({ ...prev, month: v }))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={config.year} onValueChange={(v) => setConfig(prev => ({ ...prev, year: v }))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
                <input {...getInputProps()} />
                <div className="round-full bg-muted p-4 rounded-full mb-4">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Drop files here or click to browse</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Accepts PDF, Images, ZIP. (ZIP files will be extracted in the next step - <b>Not actually implemented yet!</b>)
                </p>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-2 border rounded bg-background text-sm">
                                <div className="flex items-center gap-2 truncate">
                                    <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(i)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-auto flex justify-end pt-6">
                <Button size="lg" onClick={() => onNext(files, config)} disabled={files.length === 0}>
                    Proceed to Review
                </Button>
            </div>
        </div>
    );
}
