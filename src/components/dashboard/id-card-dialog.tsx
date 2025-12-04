'use client';

import { useState, useRef } from 'react';
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
import { IdCard, FileLock2, Printer } from 'lucide-react';
import type { User } from '@/lib/mock-data';
import Image from 'next/image';

interface IdCardDialogProps {
  user: User;
  children: React.ReactNode;
}

export function IdCardDialog({ user, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print ID Card</title>');
        // Inject Tailwind styles
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('');
            } catch (e) {
              console.warn('Could not read stylesheet for printing:', e);
              return '';
            }
          })
          .join('');
        printWindow.document.write(`<style>${styles}</style>`);
        printWindow.document.write('</head><body class="bg-muted">');
        printWindow.document.write('<div class="p-8">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
             printWindow.print();
             printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-0">
        <div ref={cardRef} className="id-card-print-area">
             <div className="bg-background rounded-t-lg p-6">
                <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <IdCard /> Employee ID Card
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-6 flex flex-col items-center text-center">
                    <Image
                        src={`https://picsum.photos/seed/${user.avatar}/128/128`}
                        width={128}
                        height={128}
                        className="rounded-full border-4 border-primary"
                        alt={user.name}
                        data-ai-hint="person portrait"
                    />
                    <h2 className="mt-4 text-2xl font-bold text-primary">{user.name}</h2>
                    <p className="text-muted-foreground">{user.designation || 'Employee'}</p>
                </div>
                <div className="mt-6 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Employee ID:</span>
                        <span className="font-mono text-foreground">{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Department:</span>
                        <span className="font-medium text-foreground">{user.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Joining Date:</span>
                        <span className="font-medium text-foreground">{user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
             </div>
             <div className="bg-primary text-primary-foreground rounded-b-lg p-4 flex items-center justify-center gap-2">
                <FileLock2 className="h-6 w-6" />
                <span className="font-bold text-lg">AE INTRAWEB</span>
             </div>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button onClick={handlePrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Print ID Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
