
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { IdCard, Printer } from 'lucide-react';
import type { User, Company, CompanyName, LocationKey } from '@/lib/mock-data';
import { companies, locations } from '@/lib/mock-data';
import Image from 'next/image';

interface IdCardDialogProps {
  user: User;
  children: React.ReactNode;
}

const companyLogos = {
    'ASE ENGINEERS PRIVATE LIMITED': () => (
        <div className="flex items-end gap-2" style={{ color: '#334b6c' }}>
            <svg width="60" height="45" viewBox="0 0 100 75" className="-mb-1">
                {/* The main 'A' like shape */}
                <path d="M5,70 L50,5 L95,70" stroke="#334b6c" strokeWidth="10" fill="none" strokeLinecap="round" />
                {/* The small vertical bar on the right leg of 'A' */}
                <path d="M68,55 L68,65" stroke="#334b6c" strokeWidth="6" fill="none" />
                <path d="M65,60 L71,60" stroke="#334b6c" strokeWidth="6" fill="none" />
                 {/* The 'se' part */}
                <g transform="translate(18, 40) scale(0.6)">
                    <text x="0" y="30" fontFamily="serif" fontSize="48" fontWeight="bold" fill="#334b6c">s</text>
                    <text x="20" y="30" fontFamily="serif" fontSize="48" fontWeight="bold" fill="#334b6c">e</text>
                     {/* The swoosh over 'se' */}
                    <path d="M-5 5 C 20 -15, 40 -15, 60 10" stroke="#334b6c" strokeWidth="7" fill="none" />
                </g>
            </svg>
            <div className="flex flex-col">
                <span className="text-3xl font-serif tracking-[0.2em]">A S E</span>
                <span className="text-sm font-semibold tracking-wider -mt-1">ENGINEERS PL</span>
            </div>
        </div>
    ),
    'ALLIANCE MEP PRIVATE LIMITED': () => (
        <div className="flex items-center gap-2">
            <svg width="30" height="30" viewBox="0 0 100 100">
                 <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="#3498db" />
                 <path d="M30 50 L50 30 L70 50 L50 70 Z" fill="white" />
            </svg>
            <span className="font-bold text-lg text-[#2c3e50]">ALLIANCE MEP</span>
        </div>
    ),
    'POTOMAC CONSULTING SERVICES PRIVATE LIMITED': () => (
        <div className="flex items-center gap-2">
            <svg width="30" height="30" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e74c3c" strokeWidth="8" />
                <path d="M30 30 L70 70 M70 30 L30 70" fill="none" stroke="#e74c3c" strokeWidth="8" />
            </svg>
            <span className="font-bold text-lg text-[#2c3e50]">POTOMAC</span>
        </div>
    ),
};


export function IdCardDialog({ user, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [selectedCompany, setSelectedCompany] = useState<CompanyName | undefined>(user.company);
  const [selectedLocation, setSelectedLocation] = useState<LocationKey | undefined>(user.location);
  
  useEffect(() => {
    if (open) {
        setSelectedCompany(user.company);
        setSelectedLocation(user.location);
    }
  }, [open, user.company, user.location]);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print ID Card</title>');
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
        printWindow.document.write('<div class="p-4 flex justify-center items-center h-full bg-gray-100">');
        printWindow.document.write(printContent.outerHTML);
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
  
  const LogoComponent = selectedCompany ? companyLogos[selectedCompany] : null;
  const address = selectedLocation ? locations[selectedLocation] : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate ID Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="company">Company</Label>
                    <Select value={selectedCompany} onValueChange={(val: CompanyName) => setSelectedCompany(val)}>
                        <SelectTrigger id="company">
                            <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                            {companies.map(c => <SelectItem key={c.name} value={c.name}>{c.shortName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="location">Location</Label>
                     <Select value={selectedLocation} onValueChange={(val: LocationKey) => setSelectedLocation(val)}>
                        <SelectTrigger id="location">
                            <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(locations).map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
             </div>

            <div className="flex justify-center">
                 <div ref={cardRef} className="id-card-print-area w-[320px] h-[512px] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between p-4 shadow-md">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                       {LogoComponent && <LogoComponent />}
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
                        {selectedCompany && <p className="font-bold">{selectedCompany}</p>}
                        {address.split(',').map((line, i) => <p key={i}>{line.trim()}</p>)}
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button onClick={handlePrint} className="w-full" disabled={!selectedCompany || !selectedLocation}>
            <Printer className="mr-2 h-4 w-4" />
            Print ID Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
