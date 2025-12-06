
'use client';
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";
import Image from "next/image";
import { Droplet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AseLogo } from "./ase-logo";
import { useState, useEffect } from "react";

export function IdCard({ employee }: { employee: User }) {
  const company = companies.find(c => c.name === employee.company);
  const companyAddress = employee.location ? locations[employee.location] : 'N/A';
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
  }, []);

  const getAvatarSrc = (user: User) => {
    if (user.avatar && user.avatar.startsWith('data:image')) return user.avatar;
    return `https://picsum.photos/seed/${user.avatar}/400/400`;
  }

  const generateVCard = (employee: User) => {
    let vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${employee.name}`;
    if (employee.emergencyContact1) {
        vCard += `\nTEL;TYPE=HOME,VOICE:+91${employee.emergencyContact1}`;
    }
    if (employee.emergencyContact2) {
        vCard += `\nTEL;TYPE=WORK,VOICE:+91${employee.emergencyContact2}`;
    }
    vCard += `\nEND:VCARD`;
    return encodeURIComponent(vCard);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${generateVCard(employee)}&size=80x80&bgcolor=ffffff&color=000000&qzone=0`;
  
  return (
    <div className="bg-white rounded-lg shadow-lg w-[320px] h-[540px] mx-auto font-sans flex flex-col overflow-hidden relative border">
        {/* Top half: Photo */}
        <div className="flex-shrink-0 h-1/2 relative">
            <Image
                src={getAvatarSrc(employee)}
                layout="fill"
                alt={employee.name}
                className="object-cover object-center"
                data-ai-hint="person portrait"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            <div className="absolute top-4 left-4 h-12 w-12 bg-white/80 backdrop-blur-sm rounded-full p-2">
                 {logoSrc ? (
                    <Image src={logoSrc} alt="Company Logo" width={40} height={40} className="rounded-full object-contain" />
                ) : (
                    <AseLogo />
                )}
            </div>
             <div className="absolute top-4 right-4 p-1 bg-white rounded-md">
                <Image
                    src={qrCodeUrl}
                    alt="Emergency Contact QR Code"
                    width={80}
                    height={80}
                />
            </div>
        </div>

        {/* Bottom half: Information */}
        <div className="p-5 flex flex-col flex-grow bg-white">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                <p className="text-md text-gray-500 font-medium">{employee.department || 'N/A'}</p>
            </div>
            
            <div className="w-full text-sm space-y-3 text-left flex-grow">
                <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Employee Code:</span>
                    <span className="font-semibold text-gray-800">{employee.id}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Status:</span>
                    <span className={cn(
                        "font-semibold",
                        employee.status === 'active' && 'text-green-600',
                        employee.status === 'inactive' && 'text-red-600',
                        employee.status === 'pending' && 'text-yellow-600',
                        employee.status === 'deleted' && 'text-red-600',
                    )}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500">Blood Group:</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                        <Droplet className="h-4 w-4 text-red-500"/> {employee.bloodGroup || 'N/A'}
                    </span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-muted text-muted-foreground text-center p-3 flex-shrink-0">
             <p className="font-bold text-sm">{company?.name || "Company Name"}</p>
             <p className="text-xs">{companyAddress}</p>
        </div>
    </div>
  );
}
