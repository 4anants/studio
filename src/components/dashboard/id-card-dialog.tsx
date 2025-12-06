
'use client'
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
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
import { Download, Printer, Loader2 } from "lucide-react";

interface IdCardDialogProps {
  employee: User;
  children: React.ReactNode;
}

export function IdCardDialog({ employee, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);

  const captureCard = async (): Promise<string | null> => {
    const element = idCardRef.current;
    if (!element) return null;

    try {
        const canvas = await html2canvas(element, {
            useCORS: true,
            scale: 3, 
            backgroundColor: '#ffffff',
        });
        return canvas.toDataURL("image/png");
    } catch (error) {
        console.error("Error capturing card:", error);
        return null;
    }
  };


  const handlePrint = async () => {
    setIsProcessing(true);
    const dataUrl = await captureCard();
    if (dataUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print ID Card</title></head>
            <body style="margin: 0; text-align: center;">
              <img src="${dataUrl}" style="max-width: 100%;" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    setIsProcessing(false);
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    const dataUrl = await captureCard();
    if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `id-card-${employee.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    setIsProcessing(false);
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
            <IdCard employee={employee} ref={idCardRef} />
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Close</Button>
            <Button variant="outline" onClick={handleDownload} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download
            </Button>
            <Button onClick={handlePrint} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Print
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
