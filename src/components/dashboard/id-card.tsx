
'use client';
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";
import Image from "next/image";
import { Droplet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AseLogo } from "./ase-logo";
import { useState, useEffect, forwardRef } from "react";

export const IdCard = forwardRef<HTMLDivElement, { employee: User }>(({ employee }, ref) => {
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

  const qrCodeUrl = employee.emergencyContact 
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`tel:${employee.emergencyContact}`)}&size=80x80&bgcolor=ffffff&color=000000&qzone=1`
    : '';
  
  return (
    <div ref={ref} className="bg-white rounded-lg shadow-lg w-[320px] h-[540px] mx-auto font-sans flex flex-col overflow-hidden relative border">
        {/* Top half: Photo */}
        <div className="flex-shrink-0 h-[270px] relative">
            <Image
                src={getAvatarSrc(employee)}
                layout="fill"
                alt={employee.name}
                className="object-cover object-center"
                data-ai-hint="person portrait"
                crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            <div className="absolute top-4 left-4 h-12 w-12 bg-white/80 backdrop-blur-sm rounded-full p-2">
                 {logoSrc ? (
                    <Image src={logoSrc} alt="Company Logo" width={40} height={40} className="rounded-full object-contain" />
                ) : (
                    <AseLogo />
                )}
            </div>
        </div>

        {/* Bottom half: Information */}
        <div className="p-5 flex flex-col flex-grow bg-white h-[226px]">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                <p className="text-md text-gray-500 font-medium">{employee.department || 'N/A'}</p>
            </div>
            
            <div className="grid grid-cols-3 items-center w-full text-sm flex-grow">
                {/* Details Column */}
                <div className="col-span-2 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Employee Code</span>
                        <span className="font-semibold text-gray-800">{employee.id}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Status</span>
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
                        <span className="font-medium text-gray-500">Blood Group</span>
                         <span className="font-semibold text-gray-800 flex items-center gap-1">
                            <Droplet className="h-4 w-4 text-red-500"/> {employee.bloodGroup || 'N/A'}
                        </span>
                    </div>
                </div>

                {/* QR Code Column */}
                <div className="col-span-1 flex justify-end items-center h-full">
                    {qrCodeUrl && (
                        <Image
                            src={qrCodeUrl}
                            alt="Emergency Contact QR Code"
                            width={80}
                            height={80}
                        />
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 text-gray-600 text-center p-3 flex-shrink-0 border-t h-[44px]">
             <p className="font-bold text-sm text-gray-800">{company?.name || "Company Name"}</p>
        </div>
    </div>
  );
});

IdCard.displayName = 'IdCard';
