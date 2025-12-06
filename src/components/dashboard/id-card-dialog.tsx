
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
import { Download, Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';

interface IdCardDialogProps {
  employee: User;
  children: React.ReactNode;
}

export function IdCardDialog({ employee, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);


  const captureCard = async (): Promise<string | null> => {
    if (!cardRef.current) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find the card element to capture.",
        });
        return null;
    }

    try {
        const canvas = await html2canvas(cardRef.current, {
            useCORS: true, // Important for external images
            scale: 2, // Higher scale for better quality
            backgroundColor: null, // Use transparent background
        });
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error("Error capturing card with html2canvas:", error);
        toast({
            variant: "destructive",
            title: "Capture Failed",
            description: "Could not generate the I-Card image.",
        });
        return null;
    }
  };


  const handleDownload = async () => {
    setIsProcessing(true);
    toast({ title: "Generating I-Card...", description: "Please wait while we create the image." });

    const imageUrl = await captureCard();

    if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `id-card-${employee.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Success!", description: "I-Card image downloaded." });
    }

    setIsProcessing(false);
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    toast({ title: "Preparing I-Card for printing...", description: "Please wait a moment." });

    const imageUrl = await captureCard();

    if (imageUrl) {
      const printWindow = window.open('', '_blank', 'height=600,width=800');
      if (!printWindow) {
        toast({
            variant: "destructive",
            title: "Print Failed",
            description: "Could not open print window. Please disable your pop-up blocker.",
        });
        setIsProcessing(false);
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head><title>Print I-Card</title>
            <style>
              @page { size: auto; margin: 0mm; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" onload="window.print(); setTimeout(() => window.close(), 100);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    // Add a small delay to allow the print dialog to open before resetting the state
    setTimeout(() => setIsProcessing(false), 1000);
  }


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
             <IdCard ref={cardRef} employee={employee} />
        </div>

        <DialogFooter className="dialog-footer">
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
