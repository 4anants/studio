
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
      // Temporarily hide all other elements on the page for printing
      const allOtherElements = document.querySelectorAll('body > *:not(.print-container)');
      allOtherElements.forEach(el => (el as HTMLElement).style.display = 'none');

      // Create a temporary container for printing
      const printContainer = document.createElement('div');
      printContainer.className = 'print-container';
      printContainer.style.position = 'fixed';
      printContainer.style.top = '0';
      printContainer.style.left = '0';
      printContainer.style.width = '100vw';
      printContainer.style.height = '100vh';
      printContainer.style.display = 'flex';
      printContainer.style.alignItems = 'center';
      printContainer.style.justifyContent = 'center';
      printContainer.style.backgroundColor = 'white';
      printContainer.style.zIndex = '9999';
      
      html2canvas(node, { 
        useCORS: true,
        scale: 3,
       }).then((canvas) => {
        const dataUrl = canvas.toDataURL("image/png");
        const img = new Image();
        img.src = dataUrl;
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.objectFit = 'contain';
        
        printContainer.appendChild(img);
        document.body.appendChild(printContainer);

        img.onload = () => {
            window.print();
            // Cleanup
            document.body.removeChild(printContainer);
            allOtherElements.forEach(el => (el as HTMLElement).style.display = '');
        };
      });
    }
  };

  const handleDownload = () => {
    const node = idCardRef.current;
    if (node) {
        html2canvas(node, { 
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff' // Explicitly set background
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
            {/* Pass the ref to the IdCard component */}
            <IdCard employee={employee} ref={idCardRef} />
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
