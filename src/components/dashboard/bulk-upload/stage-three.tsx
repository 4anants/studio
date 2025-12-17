'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileRow } from './types';
import { CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageThreeProps {
    rows: FileRow[];
    onClose: () => void;
    onRetry: (failedRows: FileRow[]) => void;
}

export function StageThree({ rows: initialRows, onClose, onRetry }: StageThreeProps) {
    const [rows, setRows] = useState<FileRow[]>(initialRows);
    const [overallProgress, setOverallProgress] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        const uploadFiles = async () => {
            let completed = 0;

            // Upload one by one
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                // Skip if already success (in case of re-mount logic, though usually fresh) or not selected?
                // Rows passed here are "to be processed".

                // Client-Side Validation
                if (!row.employeeId) {
                    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', errorMessage: 'No Employee Selected' } : r));
                    completed++;
                    setCompletedCount(completed);
                    setOverallProgress(Math.round((completed / rows.length) * 100));
                    continue;
                }

                // Update status to uploading
                setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'uploading' } : r));

                try {
                    const formData = new FormData();
                    formData.append('file', row.file);
                    formData.append('userId', row.employeeId);
                    formData.append('docType', row.docType);
                    formData.append('month', row.month);
                    formData.append('year', row.year);
                    formData.append('detectedName', row.detectedName);

                    const res = await fetch('/api/admin/bulk-upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!res.ok) throw new Error('Upload failed');

                    const data = await res.json();
                    const createdId = data.id;

                    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'success', createdDocumentId: createdId } : r));
                } catch (error) {
                    console.error(`Error uploading ${row.originalName}:`, error);
                    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', errorMessage: 'Upload Failed' } : r));
                } finally {
                    completed++;
                    setCompletedCount(completed);
                    setOverallProgress(Math.round((completed / rows.length) * 100));
                }
            }
            setIsFinished(true);
        };

        uploadFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run on mount

    const failedRows = rows.filter(r => r.status === 'error');
    const successCount = rows.filter(r => r.status === 'success').length;
    const failCount = failedRows.length;

    const handleDownloadReport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Original Filename,Employee Match,Status,Error Message\n"
            + rows.map(r => `"${r.originalName}","${r.detectedName}","${r.status}","${r.errorMessage || ''}"`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `upload_report_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-full flex flex-col p-6 max-w-3xl mx-auto w-full">
            <div className="mb-6 text-center space-y-4">
                <h3 className="text-xl font-semibold">
                    {!isFinished ? 'Uploading Documents...' : 'Upload Completed'}
                </h3>
                <Progress value={overallProgress} className="h-4" />
                <div className="flex justify-center gap-6 text-sm">
                    <span className="text-muted-foreground">Total: {rows.length}</span>
                    <span className="text-green-600">Success: {successCount}</span>
                    <span className="text-destructive">Failed: {failCount}</span>
                </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 mb-6 bg-muted/10">
                <div className="space-y-3">
                    {rows.map(row => (
                        <div key={row.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/20">
                            <div className="flex items-center gap-3">
                                {row.status === 'pending' && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                                {row.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                {row.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                {row.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}

                                <div className="flex flex-col">
                                    <span className={cn("font-medium", row.status === 'success' && "text-muted-foreground")}>
                                        {row.originalName}
                                    </span>
                                    {row.employeeName && <span className="text-xs text-muted-foreground">User: {row.employeeName}</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                {row.status === 'uploading' && <span className="text-xs text-blue-500">Uploading...</span>}
                                {row.status === 'success' && <span className="text-xs text-green-600 font-medium">Uploaded</span>}
                                {row.status === 'error' && <span className="text-xs text-destructive font-medium">{row.errorMessage || 'Error'}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {isFinished && (
                <div className="flex flex-col gap-4">
                    {failCount > 0 && (
                        <div className="flex items-center justify-between bg-destructive/10 p-4 rounded-md border border-destructive/20 text-destructive text-sm">
                            <span className="flex items-center"><XCircle className="w-4 h-4 mr-2" /> {failCount} items failed to upload.</span>
                            <Button
                                size="sm"
                                onClick={() => onRetry(rows)}
                                className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0"
                            >
                                Review & Retry Failed
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-center gap-4 pt-4 border-t">
                        <Button onClick={handleDownloadReport} className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                        </Button>
                        <Button onClick={onClose} className="min-w-[120px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                            {failCount > 0 ? 'Close & Exit' : 'Done'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
