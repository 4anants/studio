
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
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-card-area, .printable-card-area * {
            visibility: visible;
          }
          .printable-card-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
      `;
      document.head.appendChild(style);
      node.classList.add('printable-card-area');

      window.print();

      node.classList.remove('printable-card-area');
      document.head.removeChild(style);
    }
  };

  const handleDownload = () => {
    const node = idCardRef.current;
    if (node) {
        html2canvas(node, { 
            scale: 3, // Increase scale for higher resolution
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight
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

        <div ref={idCardRef} className="flex justify-center py-4">
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
