'use client'
import { useState, useEffect } from 'react';
import type { User } from "@/lib/mock-data";
import { companies } from "@/lib/mock-data";
import Image from "next/image";
import { AseLogo } from './ase-logo';

export function IdCard({ employee }: { employee: User }) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
  }, []);

  const company = companies.find(c => c.name === employee.company);

  return (
    <div className="bg-white rounded-2xl shadow-lg w-[320px] h-[512px] mx-auto font-sans flex flex-col overflow-hidden relative isolate">
        {/* Header Section */}
        <div className="bg-primary text-primary-foreground h-[180px] w-full flex-shrink-0 relative">
            <div className="p-6 flex items-center gap-3">
                 {logoSrc ? (
                    <Image src={logoSrc} alt="Company Logo" width={40} height={40} className="object-contain rounded-sm" />
                ) : (
                    <div className='bg-white rounded-md p-1'>
                        <AseLogo className="h-8 w-8" />
                    </div>
                )}
                <div>
                    <p className="font-bold text-lg leading-tight">{company?.shortName}</p>
                    <p className="text-xs opacity-80 max-w-[200px] leading-tight">{company?.name}</p>
                </div>
            </div>
        </div>

        {/* Photo */}
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 z-20">
            <Image
                src={`https://picsum.photos/seed/${employee.avatar}/160/160`}
                width={160}
                height={160}
                alt={employee.name}
                className="rounded-full border-8 border-white bg-white shadow-lg"
                data-ai-hint="person portrait" 
            />
        </div>
        
        {/* White Body Section */}
        <div className="bg-white flex-grow w-full flex flex-col justify-center items-center text-center px-4 pt-24 pb-4">
             <div className="flex-grow flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold text-gray-800">{employee.name}</h1>
                <p className="text-lg text-gray-500 font-medium mt-1">{employee.department || 'N/A'}</p>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Employee Code</p>
                    <p className="text-xl font-semibold text-gray-700">{employee.id}</p>
                </div>
            </div>
        </div>
        
        {/* Footer Bar */}
        <div className="h-4 bg-primary w-full flex-shrink-0" />
    </div>
  );
}
