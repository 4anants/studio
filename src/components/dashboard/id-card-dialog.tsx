
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
import { IdCardSvg } from "./id-card-svg";

interface IdCardDialogProps {
  employee: User;
  children: React.ReactNode;
}

export function IdCardDialog({ employee, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateAndProcessImage = async (): Promise<string | null> => {
    setIsProcessing(true);
    toast({ title: "Generating I-Card...", description: "Please wait a moment." });

    try {
        const svgString = await IdCardSvg({ employee });
        if (!svgString) {
            throw new Error("SVG generation failed.");
        }

        const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            // Dimensions for the I-card
            const width = 320 * 2; // double resolution for quality
            const height = 540 * 2;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error("Could not get canvas context");
            }

            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                const pngUrl = canvas.toDataURL('image/png');
                resolve(pngUrl);
            };

            img.onerror = (e) => {
                console.error("Error loading SVG into image:", e);
                throw new Error("Failed to load SVG as an image for conversion.");
            };
            img.src = dataUrl;
        });
    } catch (error) {
        console.error("Error generating card image:", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "Could not generate the I-Card image.",
        });
        setIsProcessing(false);
        return null;
    }
  };


  const handleDownload = async () => {
    const imageUrl = await generateAndProcessImage();

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
    const imageUrl = await generateAndProcessImage();

    if (imageUrl) {
      const printWindow = window.open('', '_blank', 'height=810,width=480'); // Adjusted to typical aspect ratio
      if (!printWindow) {
        toast({
            variant: "destructive",
            title: "Print Failed",
            description: "Could not open print window. Please disable pop-up blockers.",
        });
        setIsProcessing(false);
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head><title>Print I-Card - ${employee.name}</title>
            <style>
              @page { size: 3.375in 2.125in; margin: 0; } /* Credit card size */
              body { margin: 0; display: flex; align-items: center; justify-content: center; }
              img { width: 100%; height: 100%; object-fit: contain; }
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
             <IdCard employee={employee} />
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
