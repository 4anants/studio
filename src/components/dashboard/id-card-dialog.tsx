
'use client'
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { IdCard } from "./id-card";
import type { User } from "@/lib/mock-data";
import { Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";

interface IdCardDialogProps {
  employee: User;
  children: React.ReactNode;
}

export function IdCardDialog({ employee, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    const node = idCardRef.current;
    if (node) {
      html2canvas(node, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      }).then((canvas) => {
        const dataUrl = canvas.toDataURL("image/png");
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
          printWindow.document.write('<html><head><title>Print ID Card</title>');
          printWindow.document.write('<style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; } img { max-width: 100%; max-height: 100%; object-fit: contain; }</style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write(`<img src="${dataUrl}" />`);
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      });
    }
  };

  const handleDownload = () => {
    const node = idCardRef.current;
    if (node) {
        html2canvas(node, { 
            scale: 3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
        }).then((canvas) => {
            const link = document.createElement('a');
            link.download = `id-card-${employee.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Employee ID Card</DialogTitle>
          <DialogDescription>
            Review the employee ID card. You can print or download it from here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
            <div ref={idCardRef}>
                <IdCard employee={employee} />
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
