
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
import { Download, Printer, Droplet } from "lucide-react";
import html2canvas from "html2canvas";
import { companies, locations } from "@/lib/mock-data";
import { AseLogo } from "./ase-logo";
import Image from "next/image";

interface IdCardDialogProps {
  employee: User;
  children: React.ReactNode;
}

// A dedicated, simplified component for printing/downloading to avoid html2canvas issues.
const IdCardPrintable = ({ employee, innerRef }: { employee: User, innerRef: React.Ref<HTMLDivElement> }) => {
    const company = companies.find(c => c.name === employee.company);
    const companyAddress = employee.location ? locations[employee.location] : 'N/A';
    const getAvatarSrc = (user: User) => {
        if (user.avatar && user.avatar.startsWith('data:image')) return user.avatar;
        return `https://picsum.photos/seed/${user.avatar}/400/400`;
    }
    const qrCodeUrl = employee.emergencyContact 
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`tel:+91${employee.emergencyContact}`)}&size=60x60&bgcolor=ffffff&color=000000&qzone=0`
    : '';

    return (
        <div ref={innerRef} style={{ width: '320px', height: '540px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
            {/* Top half with photo */}
            <div style={{ height: '50%', position: 'relative' }}>
                <img src={getAvatarSrc(employee)} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous"/>
            </div>

            {/* Bottom half with info */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{employee.name}</h1>
                    <p style={{ fontSize: '16px', color: '#6b7280', fontWeight: 500, margin: 0 }}>{employee.department || 'N/A'}</p>
                </div>
                
                <div style={{ fontSize: '14px', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: '#6b7280' }}>Employee Code</span>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{employee.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: '#6b7280' }}>Status</span>
                        <span style={{ fontWeight: 600, color: employee.status === 'active' ? '#16a34a' : '#dc2626' }}>
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Blood Group</span>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>
                            {employee.bloodGroup || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: '#f9fafb', color: '#6b7280', textAlign: 'center', padding: '12px', flexShrink: 0, borderTop: '1px solid #eee' }}>
                <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{company?.name || "Company Name"}</p>
                <p style={{ fontSize: '12px', margin: 0 }}>{companyAddress}</p>
            </div>
        </div>
    );
};


export function IdCardDialog({ employee, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    const node = printableRef.current;
    if (node) {
      html2canvas(node, {
        scale: 3,
        useCORS: true,
      }).then((canvas) => {
        const dataUrl = canvas.toDataURL("image/png");
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow) {
          printWindow.document.write('<html><head><title>Print ID Card</title>');
          printWindow.document.write('<style>body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; } img { max-width: 100%; height: auto; }</style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write(`<img src="${dataUrl}" />`);
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.focus();
          printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
          };
        }
      });
    }
  };

  const handleDownload = () => {
    const node = printableRef.current;
    if (node) {
        html2canvas(node, { 
            scale: 3,
            useCORS: true,
        }).then((canvas) => {
            const link = document.createElement('a');
            link.download = `id-card-${employee.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
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
        
        {/* Hidden component for reliable printing/downloading */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <IdCardPrintable employee={employee} innerRef={printableRef} />
        </div>

        <div className="flex justify-center py-4">
            <IdCard employee={employee} />
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
