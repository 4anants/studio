
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
        // Temporarily apply a class to ensure all elements are visible for capture
        element.classList.add('capturing');
        await new Promise(resolve => setTimeout(resolve, 100)); // allow styles to apply

        const canvas = await html2canvas(element, {
            useCORS: true, 
            scale: 3, 
            logging: false,
            onclone: (doc) => {
              // This is crucial for external images like QR codes
              const images = doc.getElementsByTagName('img');
              for (let i = 0; i < images.length; i++) {
                images[i].crossOrigin = 'anonymous';
              }
            }
        });
        
        element.classList.remove('capturing');
        return canvas.toDataURL("image/png", 1.0);
    } catch (error) {
        console.error("Error capturing card:", error);
        element.classList.remove('capturing');
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
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
            {/* This div is what will be printed */}
            <div className="printing">
                <IdCard employee={employee} ref={idCardRef} />
            </div>
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
