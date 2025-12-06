'use client'
import type { User } from "@/lib/mock-data";
import { companies } from "@/lib/mock-data";
import Image from "next/image";

const BackgroundPattern = () => (
    <svg 
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 320 340" 
        preserveAspectRatio="none"
    >
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 0.8}} />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 0.7}} />
                <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 1}} />
            </linearGradient>
        </defs>
        <rect width="320" height="340" fill="hsl(var(--primary) / 0.9)" />
        <path d="M-50,350 C100,200 220,400 350,250 L350,350 L-50,350 Z" fill="url(#grad2)" opacity="0.4"/>
        <path d="M350,0 C200,150 100,-50 -50,100 L-50,0 Z" fill="url(#grad1)" opacity="0.5" />
    </svg>
);


export function IdCard({ employee }: { employee: User }) {
  const company = companies.find(c => c.name === employee.company);

  return (
    <div className="bg-white rounded-2xl shadow-lg w-[320px] h-[512px] mx-auto font-sans flex flex-col overflow-hidden relative">
        {/* Top Section with Photo and Background */}
        <div className="w-full h-[340px] flex-shrink-0 relative">
            <BackgroundPattern />
            {/* Lanyard hole */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/20 border-2 border-white/50" />
            
            <div className="absolute bottom-0 inset-x-0 h-full flex items-end justify-center">
                <Image
                    src={`https://picsum.photos/seed/${employee.avatar}/280/380`}
                    width={280}
                    height={380}
                    alt={employee.name}
                    className="object-cover object-top"
                    data-ai-hint="person portrait" 
                />
            </div>
        </div>
        
        {/* Bottom Section with Details */}
        <div className="bg-gray-50 flex-grow w-full flex flex-col justify-between p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800" style={{color: 'hsl(var(--primary))'}}>{employee.name}</h1>
                <p className="text-lg text-gray-500 font-medium mt-1">{employee.department || 'N/A'}</p>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                <span className="font-bold">{company?.shortName || "COMPANY"}</span>
                <span>ID. {employee.id}</span>
                <span>www.company.com</span>
            </div>
        </div>
    </div>
  );
}
