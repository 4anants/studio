'use client'
import { useState, useEffect } from 'react';
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";
import Image from "next/image";
import { Droplet, User as UserIcon, QrCode, Mail, Phone } from "lucide-react";
import { cn } from '@/lib/utils';

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

const PlaceholderQrCode = ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 0H0V32H32V0ZM28 4H4V28H28V4Z"
        fill="currentColor"
      />
      <path d="M12 12H20V20H12V12Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 96H32V128H0V96ZM4 100V124H28V100H4Z"
        fill="currentColor"
      />
      <path d="M20 108H12V116H20V108Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M96 0H128V32H96V0ZM100 4V28H124V4H100Z"
        fill="currentColor"
      />
      <path d="M108 12H116V20H108V12Z" fill="currentColor" />
      <path d="M60 4H68V12H60V4Z" fill="currentColor" />
      <path d="M60 24H68V44H60V24Z" fill="currentColor" />
      <path d="M52 12H60V20H52V12Z" fill="currentColor" />
      <path d="M44 4H52V12H44V4Z" fill="currentColor" />
      <path d="M44 20H52V28H44V20Z" fill="currentColor" />
      <path d="M84 4H92V12H84V4Z" fill="currentColor" />
      <path d="M76 12H84V20H76V12Z" fill="currentColor" />
      <path d="M60 52H68V60H60V52Z" fill="currentColor" />
      <path d="M52 60H60V68H52V60Z" fill="currentColor" />
      <path d="M44 52H52V60H44V52Z" fill="currentColor" />
      <path d="M100 52H108V60H100V52Z" fill="currentColor" />
      <path d="M108 60H116V68H108V60Z" fill="currentColor" />
      <path d="M116 52H124V60H116V52Z" fill="currentColor" />
      <path d="M100 44H108V52H100V44Z" fill="currentColor" />
      <path d="M92 52H100V60H92V52Z" fill="currentColor" />
      <path d="M84 44H92V52H84V44Z" fill="currentColor" />
      <path d="M76 52H84V60H76V52Z" fill="currentColor" />
      <path d="M36 60H44V68H36V60Z" fill="currentColor" />
      <path d="M60 84H68V92H60V84Z" fill="currentColor" />
      <path d="M52 92H60V100H52V92Z" fill="currentColor" />
      <path d="M44 84H52V92H44V84Z" fill="currentColor" />
      <path d="M36 92H44V100H36V92Z" fill="currentColor" />
      <path d="M100 84H108V92H100V84Z" fill="currentColor" />
      <path d="M108 92H116V100H108V92Z" fill="currentColor" />
      <path d="M116 84H124V92H116V84Z" fill="currentColor" />
      <path d="M100 76H108V84H100V76Z" fill="currentColor" />
      <path d="M92 84H100V92H92V92Z" fill="currentColor" />
      <path d="M84 76H92V84H84V76Z" fill="currentColor" />
      <path d="M76 84H84V92H76V84Z" fill="currentColor" />
      <path d="M68 92H76V100H68V92Z" fill="currentColor" />
      <path d="M60 100H68V108H60V100Z" fill="currentColor" />
      <path d="M92 116H100V124H92V116Z" fill="currentColor" />
      <path d="M100 108H108V116H100V108Z" fill="currentColor" />
      <path d="M108 116H116V124H108V116Z" fill="currentColor" />
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
  const address = employee.location ? locations[employee.location] : '';

  return (
    <div className="bg-white rounded-lg shadow-md w-[320px] h-[512px] mx-auto font-sans text-gray-800 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-primary -z-0" 
            style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0% 100%)'
            }}
        />
        <div className="absolute bottom-0 left-0 w-full h-1/4 bg-primary/80 -z-0" 
            style={{
                clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 100%)'
            }}
        />
        
        <div className="relative z-10 flex flex-col h-full p-6">
            {/* Header */}
            <header className='flex items-center justify-between'>
                 {logoSrc ? (
                    <Image src={logoSrc} alt="Company Logo" width={60} height={60} className="rounded-md object-contain" />
                ) : (
                    <AseLogo className="h-16 w-16" />
                )}
                 <div className="text-right">
                    <h2 className="text-xl font-bold leading-tight text-white">{company?.shortName || company?.name}</h2>
                </div>
            </header>

            {/* Body */}
            <main className="flex-grow flex flex-col items-center justify-center text-center -mt-8">
                <Image
                    src={`https://picsum.photos/seed/${employee.avatar}/160/160`}
                    width={128}
                    height={128}
                    alt={employee.name}
                    className="rounded-full border-4 border-white bg-white shadow-lg"
                    data-ai-hint="person portrait" 
                />
                <h1 className="text-2xl font-bold mt-4 text-gray-800">{employee.name}</h1>
                <p className="text-md text-primary font-medium">{employee.department || 'N/A'}</p>
                
                <div className="mt-6 space-y-2 text-sm text-left w-full">
                    {employee.mobile && (
                         <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-primary"/>
                            <span>{employee.mobile}</span>
                        </div>
                    )}
                     {employee.email && (
                         <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-primary"/>
                            <span>{employee.email}</span>
                        </div>
                    )}
                     {address && (
                         <div className="flex items-start gap-3">
                            <UserIcon className="w-4 h-4 text-primary mt-1"/>
                            <span>{address}</span>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className='flex items-end justify-between mt-auto'>
                <div className='text-left'>
                    <p className='text-xs text-gray-500'>Employee Code</p>
                    <p className='font-bold text-lg text-primary'>{employee.id}</p>
                </div>
                <PlaceholderQrCode className="w-16 h-16 text-gray-700" />
            </footer>
        </div>
    </div>
  );
}
