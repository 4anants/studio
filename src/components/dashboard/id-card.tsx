
'use client';
import { useState, useEffect } from 'react';
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";
import Image from "next/image";
import { AseLogo } from "./ase-logo";
import { Droplet } from 'lucide-react';

export function IdCard({ employee }: { employee: User }) {
  const company = companies.find(c => c.name === employee.company);
  const companyAddress = employee.location ? locations[employee.location] : 'N/A';

  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
  }, []);

  const getAvatarSrc = (user: User) => {
    if (user.avatar && user.avatar.startsWith('data:image')) return user.avatar;
    return `https://picsum.photos/seed/${user.avatar}/200/200`;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg w-[340px] h-[540px] mx-auto font-sans flex flex-col overflow-hidden relative border">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
            {isClient && logoSrc ? (
                 <div className="w-12 h-12 relative rounded-full overflow-hidden bg-white flex items-center justify-center">
                    <Image src={logoSrc} alt="Company Logo" layout="fill" className="object-contain" />
                </div>
            ) : (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center p-1">
                    <AseLogo />
                </div>
            )}
            <div>
                <h2 className="font-bold text-lg leading-tight">{company?.name || "Company Name"}</h2>
            </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center flex-grow">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white -mt-20 shadow-lg">
                <Image
                    src={getAvatarSrc(employee)}
                    width={160}
                    height={160}
                    alt={employee.name}
                    className="object-cover object-center"
                    data-ai-hint="person portrait"
                />
            </div>
            
            <div className="text-center mt-4">
                <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                <p className="text-md text-gray-500 font-medium">{employee.department || 'N/A'}</p>
            </div>
            
            <div className="mt-6 w-full text-sm space-y-3 text-left">
                <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Employee Code:</span>
                    <span className="font-semibold text-gray-800">{employee.id}</span>
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
        <div className="bg-muted text-muted-foreground text-center p-3">
             <p className="font-bold text-sm">{company?.name || "Company Name"}</p>
             <p className="text-xs">{companyAddress}</p>
        </div>
    </div>
  );
}
