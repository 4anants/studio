'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { IdCard } from "./id-card";
import { Printer } from "lucide-react";
import type { User, Company } from "@/lib/types";

interface BulkIdCardPrintDialogProps {
    users: User[];
    companies: Company[];
    children?: React.ReactNode;
}

export function BulkIdCardPrintDialog({ users, companies, children }: BulkIdCardPrintDialogProps) {
    const [open, setOpen] = useState(false);

    const handlePrint = () => {
        // Portal Strategy
        const portal = document.createElement('div');
        portal.id = 'print-portal';

        // Create a container for the grid
        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 3 columns for smaller cards
        container.style.gap = '10mm';
        container.style.justifyItems = 'center';
        container.style.padding = '10mm';
        container.style.width = '100%';

        // We need to render the React components to HTML string or mount them
        // Since we can't easily "mount" React components into a detached DOM node for printing without a root,
        // we will clone the PREVIEW content which is already rendered in the dialog!

        // Strategy: Render the grid IN THE DIALOG (visible to user), then clone THAT.
        const previewContent = document.getElementById('bulk-print-preview-content');
        if (previewContent) {
            // Clone the entire grid container
            const clone = previewContent.cloneNode(true) as HTMLElement;

            // Remove 'max-h' constraints if any, ensure it flows
            clone.style.maxHeight = 'none';
            clone.style.overflow = 'visible';

            portal.appendChild(clone);
            document.body.appendChild(portal);

            window.print();

            document.body.removeChild(portal);
        } else {
            alert("Could not load print content");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Selected ({users.length})
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk ID Card Print</DialogTitle>
                    <DialogDescription>
                        Preview {users.length} selected ID cards. Use A4 paper setting.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-[300px] p-4 bg-muted/20 border rounded-md">
                    {/* This ID is targeted by the print logic */}
                    <div id="bulk-print-preview-content" className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
                        {users.map((user) => {
                            // Find company for user
                            const userCompany = companies.find(c => c.name === user.company || c.id === user.companyId);
                            return (
                                <div key={user.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                    <IdCard employee={user} company={userCompany} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="default" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print Now
                    </Button>
                    <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
