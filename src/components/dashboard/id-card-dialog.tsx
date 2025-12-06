
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
import { Download, Printer } from "lucide-react";
import { companies, locations } from "@/lib/mock-data";

interface IdCardDialogProps {
  employee: User;
  children: React.ReactNode;
}

export function IdCardDialog({ employee, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);

  const getAvatarSrc = (user: User) => {
    if (user.avatar && user.avatar.startsWith('data:image')) return user.avatar;
    return `https://picsum.photos/seed/${user.avatar}/400/400`;
  }

  const getCompanyLogo = () => {
    if (typeof window !== 'undefined') {
        const storedLogo = localStorage.getItem('companyLogo');
        if (storedLogo) return storedLogo;
    }
    // This is a placeholder for the default logo SVG, as we can't easily pass SVG content in a URL.
    // In a real scenario, the default logo might have a public URL.
    return 'https://picsum.photos/seed/logo/40/40';
  }
  
  const generateImageUrl = () => {
      const company = companies.find(c => c.name === employee.company);
      const companyAddress = employee.location ? locations[employee.location] : 'N/A';
      
      // We will encode all the necessary data into a URL for an image generation service.
      // For this example, we'll use a placeholder service that can construct a simple card.
      // This is a simplified representation. A real service would take more parameters.
      const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${employee.name}
TEL;TYPE=CELL:${employee.emergencyContact || ''}
END:VCARD`;

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(vCard)}&size=60x60&bgcolor=ffffff&color=000000&qzone=0`

      // This is a simulation of what a real image generation service URL might look like.
      // We're using qrserver's API in a creative way to embed data, but it won't render a full I-Card.
      // This demonstrates the principle of server-side generation.
      const params = new URLSearchParams({
          name: employee.name,
          department: employee.department || 'N/A',
          employeeId: employee.id,
          status: employee.status,
          bloodGroup: employee.bloodGroup || 'N/A',
          companyName: company?.name || "Company Name",
          companyAddress: companyAddress,
          avatarUrl: getAvatarSrc(employee),
          logoUrl: getCompanyLogo(),
          qrUrl: qrUrl,
      });

      // In a real app, this would be a dedicated service endpoint.
      // For now, we'll just use a placeholder that shows the QR code.
      const telQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`tel:${employee.emergencyContact}`)}&size=200x200&qzone=1`;

      return telQrUrl;
  }
  
  const handlePrint = () => {
    const imageUrl = generateImageUrl();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print ID Card</title></head>
          <body style="margin: 0; text-align: center;">
            <img src="${imageUrl}" style="max-width: 100%;" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    const imageUrl = generateImageUrl();
    const link = document.createElement('a');
    // Note: The downloaded image will be from the service, not a direct screenshot.
    // To download from a cross-origin URL, we can fetch it as a blob.
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `id-card-${employee.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
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

        <div className="flex justify-center py-4">
            {/* The ref is no longer needed for capture */}
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
