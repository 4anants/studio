'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { StageOne } from './stage-one';
import { StageTwo } from './stage-two';
import { StageThree } from './stage-three';
import { FileRow } from './types';

interface BulkUploadDialogProps {
    onBulkUploadComplete?: (count: number, ids?: string[]) => void;
    users?: any[]; // Allow passing users even if we don't use them strictly in StageTwo yet (it fetches)
}

export function BulkUploadDialog({ onBulkUploadComplete, users }: BulkUploadDialogProps) {
    const [open, setOpen] = useState(false);
    const [stage, setStage] = useState<1 | 2 | 3>(1);

    // Global Config (Stage 1)
    const [globalConfig, setGlobalConfig] = useState({
        docType: 'Salary Slip',
        month: new Date().getMonth().toString(), // 0-11
        year: new Date().getFullYear().toString()
    });

    // Files Data (Stage 2)
    const [fileRows, setFileRows] = useState<FileRow[]>([]);

    const handleStageOneComplete = (files: File[], config: typeof globalConfig) => {
        setGlobalConfig(config);
        const initialRows: FileRow[] = files.map((file, index) => ({
            id: `file-${index}-${Date.now()}`,
            file,
            originalName: file.name,
            status: 'pending',
            selected: true,
            detectedName: '',
            employeeId: '',
            docType: config.docType,
            month: config.month,
            year: config.year
        }));

        setFileRows(initialRows);
        setStage(2);
    };

    const handleStageTwoComplete = (updatedRows: FileRow[]) => {
        setFileRows(updatedRows);
        setStage(3);
    };

    const handleRetry = (rows: FileRow[]) => {
        const rowsForRetry = rows.map(r =>
            r.status === 'error'
                ? { ...r, status: 'pending' as const, errorMessage: undefined }
                : r
        );
        setFileRows(rowsForRetry);
        setStage(2);
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            // If we are in Stage 3 and finished, we assume success for the batch that passed.
            // But actually, onBulkUploadComplete should probably be triggered explicitly when user clicks 'Done'.
            // However, if they close the dialog, we might want to refresh anyway if we are in Stage 3.
            if (stage === 3) {
                const successRows = fileRows.filter(r => r.status === 'success');
                const successCount = successRows.length;
                if (successCount > 0 && onBulkUploadComplete) {
                    const ids = successRows.map(r => r.createdDocumentId).filter((id): id is string => !!id);
                    onBulkUploadComplete(successCount, ids);
                }
            }

            // Reset on close
            setTimeout(() => {
                setStage(1);
                setFileRows([]);
            }, 300);
        }
        setOpen(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Upload
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] sm:max-w-6xl flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">Bulk Document Upload</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        Stage {stage} of 3: {stage === 1 ? 'Setup' : stage === 2 ? 'Review & Match' : 'Uploading'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative">
                    {stage === 1 && (
                        <StageOne
                            defaultConfig={globalConfig}
                            onNext={handleStageOneComplete}
                        />
                    )}
                    {stage === 2 && (
                        <StageTwo
                            rows={fileRows}
                            onBack={() => setStage(1)}
                            onNext={handleStageTwoComplete}
                            defaultConfig={globalConfig}
                        />
                    )}
                    {stage === 3 && (
                        <StageThree
                            rows={fileRows}
                            onClose={() => handleClose(false)} // This manually triggers close logic above
                            onRetry={handleRetry}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
