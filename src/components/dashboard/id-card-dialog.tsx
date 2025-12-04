
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Printer, Download } from 'lucide-react';
import type { User, CompanyName, LocationKey } from '@/lib/mock-data';
import { companies, locations } from '@/lib/mock-data';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

interface IdCardDialogProps {
  user: User;
  children: React.ReactNode;
}

const companyLogos = {
    'ASE ENGINEERS PRIVATE LIMITED': () => (
        <div style={{width: 150, height: 45, position: 'relative'}}>
            <Image
                src="data:image/webp;base64,UklGRmYDAABXRUJQVlA4IFoDAADwCQCdASo8ACsAPm0ylUekIqGYp7MYQB2JaW7ftwDs4Pz9d4j+Q/3P8x+1f7B/r/+l/e/jL/s/3/+Q9AD/S/uV/rf33/6f7ZfuB+wD/Q/tB/sP7j/bv3J/4H+f9wH+R/oAf3P+z/9r/If//3AP8p/q3+Z/nP/M/cz/wf9z/y/2N/sv+38gX+L/uv/B/zP/F/mP83/7f+z/9v+C9yD/k/7L/n/4D/u/+b/2f91////+8h/5v/59wD//+gB/6f+N/6n+M/6H/B/zP+F/7f+H9QD/N/1H/S/x//B/3v/N/7H/s/8n7gH+S/pv+m/m/+S/v/+h/3f/H/2v/R/y3/R/5L91P89/rP/L/x/9z/3f+p/nP///3v+z/9f/h/kP/R/7P/m/4f/g/4P/u/9//wfyJ/sv+3/yP9t/zv9p/yX9o/3f+3/9P+29v/8i/vv+d/3v+D/23/O/23/S/6//g/////9kP7gP/////sB+oH////+mH+4H7/P/////+73/5/f9/gP///9f/1f8D/////+oH/yP/+Z/zM6p/y/89/3/8D/pP+d/yv9b/4/9h/y/+V/5/9v/5/7/H//+/h+RHn7eB+IAnm/2G/cT/I/yf/p/4v/b/8z/lf/z/5/91/////U//7fD9yP/p/u//7f/P2A/+//x/+p/dv/g+wD/cf8L/kf4X/W/7//j/8j/tf+D/zP/X/2P/f/7v////96C/5f/7P+jP9N93y1AAGZ0zY7A5A5J22Kz0pYg28y43k8z48K4mI6L82q7L3q2rO2wB/5YmQ49zGcaTq0O6jD2DudYlB+b1Vn82Y7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7-JqS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS8zY7qS"
                alt="ASE logo"
                layout="fill"
                objectFit="contain"
            />
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
  const [isZoomed, setIsZoomed] = useState(false);
  const { toast } = useToast();

  const [selectedCompany, setSelectedCompany] = useState<CompanyName | undefined>(user.company);
  const [selectedLocation, setSelectedLocation] = useState<LocationKey | undefined>(user.location);
  
  useEffect(() => {
    if (open) {
        setSelectedCompany(user.company);
        setSelectedLocation(user.location);
        setIsZoomed(false);
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
        printWindow.document.write(`<style>${styles} @page { size: 54mm 86mm; margin: 0; } body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .id-card-print-area { box-shadow: none !important; border: none !important; transform: scale(1) !important; }</style>`);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div style="display:flex; justify-content:center; align-items:center; width:100vw; height:100vh;">');
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

  const handleDownload = useCallback(() => {
    if (cardRef.current === null) {
      return
    }
    
    toast({
        title: 'Generating Image...',
        description: 'Your ID card is being prepared for download.',
    });

    toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `ID-Card-${user.name.replace(/\s+/g, '-')}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error(err)
        toast({
            variant: 'destructive',
            title: 'Download Failed',
            description: 'Could not generate an image of the ID card.',
        });
      })
  }, [cardRef, user.name, toast]);
  
  const LogoComponent = selectedCompany ? companyLogos[selectedCompany] : null;
  const companyDetails = selectedCompany ? companies.find(c => c.name === selectedCompany) : null;
  
  const getAddressLines = (locationKey?: LocationKey) => {
    if (!locationKey) return { line1: '', line2: '' };
    
    if (locationKey === 'AMD') {
        return {
            line1: 'B-813, K P Epitome, Near Makarba Lake,',
            line2: 'Makarba, Ahmedabad - 380051.'
        }
    }
     if (locationKey === 'HYD') {
        return {
            line1: '8-1-305/306, 4th Floor, Anand Silicon Chip,',
            line2: 'Shaikpet, Hyderabad - 500008.'
        }
    }
    // Fallback for other locations
    return {
      line1: 'B-813, K P Epitome, Near Makarba Lake,',
      line2: 'Makarba, Ahmedabad - 380051.'
    };
  }

  const { line1: addressLine1, line2: addressLine2 } = getAddressLines(selectedLocation);
  
  const positionX = 20;

  const CardComponent = ({ className }: { className?: string; }) => (
    <div
      className={cn(
        "id-card-print-area bg-white shadow-lg overflow-hidden",
        className
      )}
      style={{
        width: '204px',
        height: '324px',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center justify-center pt-3 px-2 flex-shrink-0">
          {LogoComponent && <LogoComponent />}
        </div>
        <div
          className="flex-grow flex items-center relative pr-5"
          style={{ paddingLeft: `${positionX}px` }}
        >
          <div className="w-2/5 flex-shrink-0 flex justify-center">
            <Image
              src={`https://picsum.photos/seed/${user.avatar}/150/200`}
              width={75}
              height={94}
              className="border border-gray-300"
              alt={user.name}
              data-ai-hint="person passport"
            />
          </div>
          <div className="w-3/5 h-full flex items-center justify-center">
            <div
              className="flex flex-col justify-center items-center text-center whitespace-nowrap origin-center"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <p className="font-bold text-lg leading-tight" style={{ color: '#009966' }}>{user.name}</p>
              <p className="text-xs leading-tight mt-1">{user.designation || 'N/A'}</p>
              <p className="text-xs leading-tight">Employee Code : {user.id}</p>
              <p className="text-xs leading-tight">Blood Group : <span className="font-bold">{user.bloodGroup || 'N/A'}</span></p>
            </div>
          </div>
        </div>
        <div className="text-white text-center p-2 flex-shrink-0" style={{ backgroundColor: '#334b6c' }}>
          {companyDetails && (
              <p className="font-bold text-xs mb-0.5">
                  {companyDetails.name}
              </p>
          )}
          {addressLine1 && (
            <div className="text-[8px] leading-snug space-y-0.5">
              <p>{addressLine1}</p>
              <p>{addressLine2}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );


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

                <div className="flex justify-center items-center gap-4 mt-4 pt-8">
                    <Button onClick={handlePrint} className="w-full" disabled={!selectedCompany || !selectedLocation}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print ID Card
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="w-full" disabled={!selectedCompany || !selectedLocation}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
                 <div className="text-sm text-muted-foreground text-center">Click the card to zoom.</div>
            </div>

            <div className="flex justify-center items-center p-4 bg-gray-100 rounded-lg relative min-h-[360px]">
                {/* Hidden card for printing and downloading */}
                <div className="absolute opacity-0 pointer-events-none -z-10" aria-hidden>
                    <div ref={cardRef}>
                        <CardComponent />
                    </div>
                </div>
                
                {/* Visible card for interaction */}
                 <div className="cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                    <CardComponent />
                </div>
            </div>
        </div>

        {isZoomed && (
            <div 
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center cursor-zoom-out"
                onClick={() => setIsZoomed(false)}
            >
                <div
                    className="scale-[2.5] cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <CardComponent />
                </div>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

    