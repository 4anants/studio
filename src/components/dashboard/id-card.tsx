
'use client'
import { useState, useEffect } from 'react';
import type { User } from "@/lib/mock-data";
import { companies } from "@/lib/mock-data";
import Image from "next/image";
import { AseLogo } from "./ase-logo";

export function IdCard({ employee }: { employee: User }) {
  const company = companies.find(c => c.name === employee.company);
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
    return `https://picsum.photos/seed/${user.avatar}/340/340`;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg w-[320px] h-[512px] mx-auto font-sans flex flex-col overflow-hidden relative">
      {/* Top section with full-bleed image */}
      <div className="w-full h-3/5 relative">
        <Image
          src={getAvatarSrc(employee)}
          layout="fill"
          alt={employee.name}
          className="object-cover object-center"
          data-ai-hint="person portrait"
        />
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            {isClient && logoSrc ? (
                <div className="w-8 h-8 relative rounded-full overflow-hidden bg-white flex items-center justify-center">
                    <Image src={logoSrc} alt="Company Logo" layout="fill" className="object-contain" />
                </div>
            ) : (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center">
                    <AseLogo className="w-6 h-6" />
                </div>
            )}
            <span className="font-semibold text-lg text-white drop-shadow-md">{company?.shortName || "Company"}</span>
          </div>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="w-full h-2/5 bg-white flex flex-col items-center justify-center text-center px-4">
         <h1 className="text-2xl font-bold text-gray-800 -mt-2">{employee.name}</h1>
         <p className="text-md text-gray-500 font-medium mt-1">{employee.department || 'N/A'}</p>
         <div className="mt-4">
            <p className="text-xs text-gray-400 font-medium">Employee Code</p>
            <p className="text-lg text-gray-700 font-semibold">{employee.id}</p>
         </div>
      </div>

       <div className="absolute bottom-0 w-full h-1.5 bg-primary" />
    </div>
  );
}
