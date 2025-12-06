'use client'
import { useState, useEffect } from 'react';
import type { User } from "@/lib/mock-data";
import { companies } from "@/lib/mock-data";
import Image from "next/image";

const AseLogo = ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M50 0L95.5 25.5V74.5L50 100L4.5 74.5V25.5L50 0Z"
        fill="#004a99"
      />
      <path
        d="M26 63.5L50 50L74 63.5M50 75V50"
        stroke="#fecb00"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 36.5L50 25L74 36.5"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

const CardBackground = () => (
    <svg width="100%" height="100%" viewBox="0 0 320 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full">
        <path d="M0 0H320V256H0V0Z" fill="hsl(var(--primary))" />
        <path d="M-60 256C-60 148.983 -23.017 62 48 62C119.017 62 156 148.983 156 256C156 363.017 119.017 450 48 450C-23.017 450 -60 363.017 -60 256Z" fill="hsl(var(--primary)/0.8)" />
        <path d="M200 256C200 114.61 249.21 0 320 0V512C249.21 512 200 397.39 200 256Z" fill="hsl(var(--primary)/0.6)" />
    </svg>
);


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
    <div className="bg-white rounded-lg shadow-md w-[320px] h-[512px] mx-auto font-sans text-gray-800 flex flex-col overflow-hidden relative">
        {/* Background */}
        <div className="absolute top-0 left-0 w-full h-3/5 bg-primary -z-0">
             <CardBackground />
        </div>
        <div className="absolute top-1/2 left-0 w-full h-1/2 bg-white -z-0"/>

        {/* Lanyard hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-primary rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full items-center">
            {/* Photo Section */}
            <div className="mt-20">
                <Image
                    src={`https://picsum.photos/seed/${employee.avatar}/160/160`}
                    width={160}
                    height={160}
                    alt={employee.name}
                    className="rounded-full border-4 border-white bg-white shadow-lg"
                    data-ai-hint="person portrait" 
                />
            </div>
            
            {/* Details Section */}
            <div className="bg-white w-full flex-grow flex flex-col justify-between text-center p-6 -mt-1">
                <div className="mt-4">
                    <h1 className="text-3xl font-bold text-gray-800">{employee.name}</h1>
                    <p className="text-lg text-gray-500 font-medium">{employee.department || 'N/A'}</p>
                </div>
                
                <div className='w-full flex items-center justify-between text-xs text-gray-400 font-medium'>
                    <div className="flex items-center gap-2">
                        {logoSrc ? (
                            <Image src={logoSrc} alt="Company Logo" width={24} height={24} className="object-contain" />
                        ) : (
                            <AseLogo className="h-6 w-6" />
                        )}
                        <span>{company?.shortName || company?.name}</span>
                    </div>
                    <span>ID: {employee.id}</span>
                </div>
            </div>
        </div>
    </div>
  );
}
