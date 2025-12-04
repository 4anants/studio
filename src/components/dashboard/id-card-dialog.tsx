'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IdCard, Printer } from 'lucide-react';
import type { User } from '@/lib/mock-data';
import Image from 'next/image';

interface IdCardDialogProps {
  user: User;
  children: React.ReactNode;
}

const AseLogo = () => (
    <div className="flex items-center gap-1 text-2xl font-bold" style={{ color: '#2c3e50' }}>
        <svg width="40" height="40" viewBox="0 0 100 100">
            <path d="M50 10 L90 90 L10 90 Z" fill="none" stroke="#2c3e50" strokeWidth="8" transform="rotate(18 50 50)"/>
            <path d="M30 70 C 40 50, 60 50, 70 70" fill="none" stroke="#2c3e50" strokeWidth="8" />
            <path d="M50 10 L10 90" fill="none" stroke="#2c3e50" strokeWidth="8" />
        </svg>
        <span className="tracking-widest">A S E</span>
    </div>
)


export function IdCardDialog({ user, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print ID Card</title>');
        // Inject Tailwind styles
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('');
            } catch (e) {
              console.warn('Could not read stylesheet for printing:', e);
              return '';
            }
          })
          .join('');
        printWindow.document.write(`<style>${styles}</style>`);
        printWindow.document.write('</head><body">');
        printWindow.document.write('<div class="p-4 flex justify-center items-center h-full">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
             printWindow.print();
             printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm p-0">
        <div ref={cardRef} className="id-card-print-area w-[320px] h-[512px] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between p-4">
            {/* Header */}
            <div className="flex flex-col items-center">
                 <div className="flex items-center gap-1 text-2xl font-bold" style={{ color: '#2c3e50' }}>
                    <svg width="30" height="30" viewBox="0 0 100 100">
                        <path d="M60 10 L100 90 L20 90 Z" fill="none" stroke="#334b6c" strokeWidth="10" transform="rotate(10 60 50)"/>
                        <path d="M40 70 C 50 50, 70 50, 80 70" fill="none" stroke="#334b6c" strokeWidth="9" />
                        <path d="M60 10 L20 90" fill="none" stroke="#334b6c" strokeWidth="10" />
                        <path d="M22 68 C 30 75, 40 75, 48 68" fill="none" stroke="#334b6c" strokeWidth="8" />
                        <path d="M25 68 C 30 60, 40 60, 45 68" fill="none" stroke="white" strokeWidth="6" />
                    </svg>
                    <div className="flex flex-col -ml-2">
                        <span className="tracking-[0.2em] text-2xl" style={{color: '#334b6c'}}>A S E</span>
                        <span className="text-xs tracking-wider font-semibold" style={{color: '#334b6c'}}>ENGINEERS PL</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-grow flex items-center gap-2">
                <div className="w-1/2 flex justify-center">
                     <Image
                        src={`https://picsum.photos/seed/${user.avatar}/200/200`}
                        width={120}
                        height={120}
                        className="rounded-md border-2 border-gray-300"
                        alt={user.name}
                        data-ai-hint="person portrait"
                    />
                </div>
                <div className="w-1/2 h-full flex items-center justify-center">
                    <div className="relative h-full flex items-center justify-center">
                        <div style={{ writingMode: 'vertical-rl' }} className="transform rotate-180 whitespace-nowrap text-right space-y-2">
                            <p className="font-bold text-xl text-green-600">{user.name}</p>
                            <p className="text-sm">{user.department || 'N/A'}</p>
                            <p className="text-sm">Employee Code : {user.id}</p>
                            <p className="text-sm">Blood Group : <span className="text-red-600 font-bold">{user.bloodGroup || 'N/A'}</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-800">
                <p className="font-bold">ASE ENGINEERS PRIVATE LIMITED</p>
                <p>B - 813, K P Epitome, Near Makarba Lake,</p>
                <p>Makarba, Ahmedabad - 380051.</p>
            </div>
        </div>
        <DialogFooter className="p-6 pt-2">
          <Button onClick={handlePrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Print ID Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
