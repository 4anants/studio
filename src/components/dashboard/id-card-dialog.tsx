
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
import { cn } from "@/lib/utils";

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
            useCORS: true, // Needed for external images
            scale: 3, // Increase scale for higher resolution
            logging: false,
        });
        return canvas.toDataURL("image/png", 1.0);
    } catch (error) {
        console.error("Error capturing card:", error);
        return null;
    }
  };

  const handlePrint = () => {
    const cardElement = idCardRef.current;
    if (!cardElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to print the ID card.');
        return;
    }

    const cardHtml = cardElement.innerHTML;
    const originalTitle = document.title;

    printWindow.document.write(`
        <html>
            <head>
                <title>Print ID Card - ${employee.name}</title>
                <style>
                    body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; }
                    .card-container { width: 320px; height: 540px; }
                </style>
            </head>
            <body>
                <div class="card-container">
                    ${cardHtml}
                </div>
                <script>
                    // Ensure all images are loaded before printing
                    const images = document.querySelectorAll('img');
                    const promises = Array.from(images).map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                    });
                    Promise.all(promises).then(() => {
                        window.print();
                        window.close();
                    });
                </script>
            </body>
        </html>
    `);
    printWindow.document.title = originalTitle;
    printWindow.document.close();
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
      <DialogContent className={cn("sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle>Employee ID Card</DialogTitle>
          <DialogDescription>
            Review the employee ID card. You can print or download it from here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
            <IdCard employee={employee} ref={idCardRef} />
        </div>

        <DialogFooter className="dialog-footer">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Close</Button>
            <Button variant="outline" onClick={handleDownload} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download
            </Button>
            <Button onClick={handlePrint} disabled={isProcessing}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
