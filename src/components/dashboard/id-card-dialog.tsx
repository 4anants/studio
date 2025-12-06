
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

  const handlePrint = () => {
    const cardElement = idCardRef.current;
    if (!cardElement) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      alert("Could not open print window. Please disable your pop-up blocker.");
      return;
    }

    const cardHtml = cardElement.innerHTML;
    const stylesheets = Array.from(document.styleSheets)
      .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
      .join('');
    
    const tailwindStyles = Array.from(document.querySelectorAll('style'))
      .map(style => style.innerHTML)
      .join('</style><style>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print ID Card</title>
          ${stylesheets}
          <style>${tailwindStyles}</style>
          <style>
            body { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              margin: 0;
              height: 100vh;
              overflow: hidden;
            }
            @page {
              size: auto;
              margin: 0mm;
            }
          </style>
        </head>
        <body>
          ${cardHtml}
          <script>
            // Ensure images (like QR code) are loaded before printing
            const images = document.querySelectorAll('img');
            const promises = [];
            images.forEach(img => {
              if (!img.complete) {
                promises.push(new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve; // Continue even if an image fails
                }));
              }
            });

            Promise.all(promises).then(() => {
              window.focus(); // Required for some browsers
              window.print();
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async () => {
    const element = idCardRef.current;
    if (!element) return;
    
    setIsProcessing(true);

    try {
        const canvas = await html2canvas(element, {
            useCORS: true, 
            scale: 3, // Higher scale for better quality
            logging: false,
             onclone: (doc) => {
                const images = doc.getElementsByTagName('img');
                for (let i = 0; i < images.length; i++) {
                    images[i].crossOrigin = 'anonymous';
                }
            }
        });
        
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `id-card-${employee.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error capturing card:", error);
    } finally {
        setIsProcessing(false);
    }
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
