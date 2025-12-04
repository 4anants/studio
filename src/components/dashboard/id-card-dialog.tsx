
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
import { Printer } from 'lucide-react';
import type { User, CompanyName, LocationKey } from '@/lib/mock-data';
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
                <path d="M5,70 L50,5 L95,70" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />
                <line x1="25" y1="45" x2="75" y2="45" stroke="currentColor" strokeWidth="8" />
                 <g transform="translate(32, 48) scale(0.5)">
                    <text x="0" y="30" fontFamily="sans-serif" fontSize="48" fontWeight="bold" fill="currentColor">s</text>
                    <text x="22" y="30" fontFamily="sans-serif" fontSize="48" fontWeight="bold" fill="currentColor">e</text>
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
  const [line1, line2, line3] = address.split(',').map(s => s.trim());


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate ID Card</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="flex justify-center mt-4">
                    <Button onClick={handlePrint} className="w-full" disabled={!selectedCompany || !selectedLocation}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print ID Card
                    </Button>
                </div>
            </div>

            <div className="flex justify-center items-center">
                <div 
                    ref={cardRef} 
                    className="id-card-print-area w-[320px] h-[512px] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-lg"
                    style={{ fontFamily: "'Segoe UI', sans-serif" }}
                >
                    {/* Header */}
                    <div className="flex flex-col items-center pt-4 px-4">
                       {LogoComponent && <LogoComponent />}
                    </div>

                    {/* Body */}
                    <div className="flex-grow grid grid-cols-2 gap-2 p-2">
                        <div className="flex flex-col items-center justify-center text-center">
                            <p className="font-bold text-lg leading-tight text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{user.designation || 'N/A'}</p>
                            <div className="text-xs text-gray-600 mt-2 space-y-1">
                                <p>Emp Code: {user.id}</p>
                                <p>Blood Group: <span className="font-bold text-red-600">{user.bloodGroup || 'N/A'}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <Image
                                src={`https://picsum.photos/seed/${user.avatar}/200/200`}
                                width={120}
                                height={145}
                                className="rounded-md border-2 border-gray-300 object-cover"
                                style={{ aspectRatio: '4/5' }}
                                alt={user.name}
                                data-ai-hint="person passport"
                            />
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-gray-800 text-white text-center text-[10px] p-2 leading-tight">
                        {selectedCompany && <p className="font-bold">{selectedCompany}</p>}
                        {address && (
                            <>
                                <p>{line1},</p>
                                <p>{line2}, {line3}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
