
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
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const node = printableAreaRef.current;
    if (node) {
        const domClone = node.cloneNode(true) as HTMLElement;
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                @page { size: auto; margin: 0; }
                body { margin: 0; }
                .printable-area {
                    margin: 0;
                    padding: 0;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .printable-area > div {
                  transform: scale(1.2); /* Optional: scale up for better print quality */
                }
            }
        `;
        document.head.appendChild(style);

        const printSection = document.createElement('div');
        printSection.id = 'print-section';
        printSection.className = 'printable-area';
        printSection.appendChild(domClone);
        document.body.insertBefore(printSection, document.body.firstChild);
        
        window.print();
        
        document.body.removeChild(printSection);
        document.head.removeChild(style);
    }
  };

  const handleDownload = () => {
    if (idCardRef.current) {
        html2canvas(idCardRef.current, { 
            scale: 3, // Increase scale for higher resolution
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
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

        {/* Visible card for display */}
        <div ref={idCardRef} className="flex justify-center">
            <IdCard employee={employee} />
        </div>

        {/* Hidden, isolated card for printing */}
        <div className="absolute -left-[9999px] top-0" ref={printableAreaRef}>
             <IdCard employee={employee} />
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
