
'use client'
import { useState, useEffect } from 'react';
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";
import Image from "next/image";
import { Droplet, User as UserIcon } from "lucide-react";

const AseLogo = ({ className }: { className?: string }) => (
    <svg
      width="64"
      height="64"
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
    <div className="bg-white rounded-lg shadow-md max-w-sm mx-auto font-sans text-gray-800">
        <div className="bg-primary text-primary-foreground rounded-t-lg p-4 flex justify-between items-center">
            {logoSrc ? (
                 <Image src={logoSrc} alt="Company Logo" width={50} height={50} className="rounded-md object-contain" />
            ) : (
                <AseLogo className="h-12 w-12" />
            )}
            <h2 className="text-xl font-bold text-right leading-tight">{company?.shortName || company?.name}</h2>
        </div>
        <div className="p-4 flex flex-col items-center">
            <Image
                src={`https://picsum.photos/seed/${employee.avatar}/150/150`}
                width={150}
                height={150}
                alt={employee.name}
                className="rounded-full border-4 border-primary shadow-lg -mt-16"
                data-ai-hint="person portrait" 
            />
            <h1 className="text-2xl font-bold mt-4 text-center">{employee.name}</h1>
            <p className="text-md text-muted-foreground">{employee.designation || 'Employee'}</p>

            <div className="w-full mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Employee ID</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{employee.id}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500 flex items-center gap-2"><UserIcon size={14}/> Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}</span>
                </div>
                {employee.bloodGroup && (
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-500 flex items-center gap-2"><Droplet size={14}/> Blood Group</span>
                        <span className="font-semibold text-lg text-red-600">{employee.bloodGroup}</span>
                    </div>
                )}
            </div>
        </div>
        <div className="bg-gray-100 rounded-b-lg p-3 mt-4 text-xs text-center text-gray-500">
            <p className="font-bold">{employee.company || "Your Company"}</p>
            {address && <p>{address}</p>}
        </div>
    </div>
  );
}
