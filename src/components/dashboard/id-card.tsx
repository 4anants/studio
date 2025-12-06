
'use client';
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";
import { Droplet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AseLogo } from "./ase-logo";
import { useState, useEffect, forwardRef } from "react";
import Image from "next/image";

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

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`tel:${employee.emergencyContact || employee.mobile || ''}`)}&size=80x80&bgcolor=ffffff&color=000000&qzone=1`;

  const getAvatarSrc = (user: User) => {
    if (user.avatar && user.avatar.startsWith('data:image')) {
      return user.avatar;
    }
    return `https://picsum.photos/seed/${user.avatar}/320/270`;
  };
  
  const avatarSrc = getAvatarSrc(employee);

  return (
    <div ref={ref} className="bg-white rounded-lg shadow-lg w-[320px] h-[540px] mx-auto font-sans flex flex-col overflow-hidden relative border">
        {/* Top half: Photo */}
        <div className="flex-shrink-0 h-[270px] relative">
            <Image
                src={avatarSrc}
                alt={employee.name}
                width={320}
                height={270}
                className="absolute inset-0 w-full h-full object-cover"
                crossOrigin="anonymous"
                unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            <div className="absolute top-4 left-4 h-12 w-12 bg-white/80 backdrop-blur-sm rounded-full p-2 flex items-center justify-center">
                 {logoSrc ? (
                    <img src={logoSrc} alt="Company Logo" className="rounded-full object-contain h-full w-full" crossOrigin="anonymous" />
                ) : (
                    <AseLogo />
                )}
            </div>
        </div>

        {/* Bottom half: Information */}
        <div className="p-5 flex flex-col flex-grow bg-white">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                <p className="text-md text-gray-500 font-medium">{employee.designation || 'N/A'}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-x-2 items-center w-full text-sm flex-grow">
                {/* Left Column: Labels */}
                <div className="col-span-1 space-y-3 text-left">
                    <div className="font-medium text-gray-500">Emp. Code</div>
                    <div className="font-medium text-gray-500">Status</div>
                    <div className="font-medium text-gray-500">Blood Group</div>
                </div>

                 {/* Center Column: QR Code */}
                 <div className="col-span-1 flex justify-center items-center h-full">
                    <Image
                        src={qrCodeUrl}
                        alt="Emergency Contact QR Code"
                        width={80}
                        height={80}
                        crossOrigin="anonymous"
                        unoptimized
                    />
                </div>

                {/* Right Column: Values */}
                <div className="col-span-1 space-y-3 text-right">
                     <div className="font-semibold text-gray-800">{employee.id}</div>
                     <div className={cn(
                        "font-semibold",
                        employee.status === 'active' && 'text-green-600',
                        employee.status === 'inactive' && 'text-red-600',
                        employee.status === 'pending' && 'text-yellow-600',
                        employee.status === 'deleted' && 'text-red-600',
                    )}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </div>
                     <div className="font-semibold text-gray-800 flex items-center gap-1 justify-end">
                        <Droplet className="h-4 w-4 text-red-500"/> {employee.bloodGroup || 'N/A'}
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white text-center p-2 flex flex-col justify-center items-center flex-shrink-0 h-[70px]">
            <p className="font-semibold text-sm">{company?.name || "Company Name"}</p>
            <p className="text-xs font-medium">{companyAddress}</p>
        </div>
    </div>
  );
});

IdCard.displayName = 'IdCard';
