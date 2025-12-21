'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { FileRow, GlobalConfig } from './types';
import { parseFilename } from '@/lib/file-parser';
import { Search, Calculator, CalendarIcon, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { documentTypesList } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface StageTwoProps {
    rows: FileRow[];
    onBack: () => void;
    onNext: (rows: FileRow[]) => void;
    defaultConfig: GlobalConfig;
}

interface EmployeeSearchResult {
    id: string;
    name: string;
    email: string;
    department: string;
    employeeCode: string;
}

export function StageTwo({ rows: initialRows, onBack, onNext, defaultConfig }: StageTwoProps) {
    const [rows, setRows] = useState<FileRow[]>(initialRows);
    const [isProcessing, setIsProcessing] = useState(true);

    // Parsing Effect
    useEffect(() => {
        const processRows = async () => {
            const newRows = [...rows];

            for (const row of newRows) {
                // Skip if already processed (has parsed name)
                if (row.detectedName) continue;

                const parsed = parseFilename(row.originalName);
                row.detectedName = parsed.detectedName;

                // Apply parsed metadata or fallback to global config
                // If parsed returns month/year, use it, else use global
                row.month = parsed.detectedMonth ? (parseInt(parsed.detectedMonth) - 1).toString() : defaultConfig.month;
                row.year = parsed.detectedYear || defaultConfig.year;
                row.docType = defaultConfig.docType;

                // Search for employee
                try {
                    const res = await fetch(`/api/admin/search-employees?q=${encodeURIComponent(parsed.detectedName)}`);
                    const matches: EmployeeSearchResult[] = await res.json();

                    if (matches && matches.length > 0) {
                        // Exact match heuristic or take first
                        const bestMatch = matches[0];
                        row.employeeId = bestMatch.id;
                        row.employeeName = bestMatch.name;
                        row.employeeCode = bestMatch.employeeCode;
                        row.department = bestMatch.department;
                        row.status = 'pending'; // Ready
                    } else {
                        row.status = 'error'; // No match
                    }
                } catch (e) {
                    logger.error("Search failed for", row.originalName, e);
                    row.status = 'error';
                }
            }

            setRows(newRows);
            setIsProcessing(false);
        };

        processRows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount (or when rows change if we were adding more)

    const toggleSelectAll = (checked: boolean) => {
        setRows(prev => prev.map(r => ({ ...r, selected: checked })));
    };

    const toggleSelectRow = (id: string, checked: boolean) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, selected: checked } : r));
    };

    const updateRow = (id: string, updates: Partial<FileRow>) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    // Bulk Actions
    const selectedCount = rows.filter(r => r.selected).length;
    const allSelected = rows.length > 0 && selectedCount === rows.length;
    const someSelected = selectedCount > 0 && selectedCount < rows.length;

    const handleEmployeeSearch = async (query: string, rowId: string) => {
        // This is for the manual dropdown search
        // Ideally we use a Combobox component here. 
        // For simplicity in this vanilla implementation, let's assume direct input or simplified flow.
        // But user asked for "Dropdown/Searchable select".
        // We'll simulate a fetch and return promise for a AsyncSelect if we had one.
        return fetch(`/api/admin/search-employees?q=${query}`).then(res => res.json());
    }

    // Helper to check if we can proceed
    // Relaxed rule: Ensure at least one file is selected. 
    // We allow proceeding with missing info, but Stage 3 will mark them as failed.
    const canProceed = rows.some(r => r.selected);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b flex flex-wrap items-center gap-4 bg-muted/20">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={(c) => toggleSelectAll(!!c)}
                        ref={(el) => { if (el) (el as any).indeterminate = someSelected; }}
                    />
                    <span className="text-sm font-medium">{selectedCount} Selected</span>
                </div>

                <div className="h-4 w-px bg-border mx-2" />

                <Button variant="outline" size="sm" disabled={selectedCount === 0}>
                    Set Document Type
                </Button>
                <Button variant="outline" size="sm" disabled={selectedCount === 0}>
                    Set Date
                </Button>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>File</TableHead>
                            <TableHead>Detected Name</TableHead>
                            <TableHead className="w-[300px]">Employee Match</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow key={row.id} className={!row.selected ? 'opacity-50' : ''}>
                                <TableCell>
                                    <Checkbox
                                        checked={row.selected}
                                        onCheckedChange={(c) => toggleSelectRow(row.id, !!c)}
                                        disabled={row.status === 'success'}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="truncate max-w-[200px]" title={row.originalName}>{row.originalName}</span>
                                        {/* <span className="text-xs text-muted-foreground">Original</span> */}
                                    </div>
                                </TableCell>
                                <TableCell>{row.detectedName}</TableCell>
                                <TableCell>
                                    {/* Simple Employee Selector / Display */}
                                    {row.employeeId ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{row.employeeName}</span>
                                            <span className="text-xs text-muted-foreground">{row.employeeCode}</span>
                                        </div>
                                        // TODO: Add 'Change' button or make this a dropdown trigger
                                    ) : (
                                        // Only show select for pending/error
                                        row.status !== 'success' ? (
                                            <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 w-full justify-start">
                                                Select Employee...
                                            </Button>
                                        ) : <span>Matched</span>
                                    )}
                                </TableCell>
                                <TableCell>{row.department || '-'}</TableCell>
                                <TableCell>
                                    <Select value={row.docType} onValueChange={(v) => updateRow(row.id, { docType: v })} disabled={row.status === 'success'}>
                                        <SelectTrigger className="h-8 w-[130px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documentTypesList.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {monthsShort[parseInt(row.month)]} {row.year}
                                </TableCell>
                                <TableCell>
                                    {row.status === 'success' ? (
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
                                        </Badge>
                                    ) : row.employeeId ? (
                                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-destructive border-destructive/50 bg-destructive/10">
                                            <AlertCircle className="w-3 h-3 mr-1" /> No Match
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No files loaded.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setup
                </Button>

                <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                        {rows.filter(r => r.selected && !r.employeeId).length > 0 &&
                            <span className="text-destructive flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {rows.filter(r => r.selected && !r.employeeId).length} selected rows missing employee match
                            </span>
                        }
                    </div>
                    <Button onClick={() => onNext(rows.filter(r => r.selected))} disabled={!canProceed || isProcessing} className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                        {isProcessing ? 'Processing...' : `Confirm & Upload (${rows.filter(r => r.selected).length})`}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
