'use client'
import type { User } from "@/lib/mock-data";
import { companies } from "@/lib/mock-data";
import Image from "next/image";

export function IdCard({ employee }: { employee: User }) {
  const company = companies.find(c => c.name === employee.company);

  return (
    <div className="bg-white rounded-2xl shadow-lg w-[320px] h-[512px] mx-auto font-sans flex flex-col overflow-hidden relative">
        {/* Top Section with Photo */}
        <div className="w-full h-[340px] flex-shrink-0 relative">
            <Image
                src={`https://picsum.photos/seed/${employee.avatar}/320/340`}
                width={320}
                height={340}
                alt={employee.name}
                className="object-cover object-top w-full h-full"
                data-ai-hint="person portrait" 
            />
            {/* Lanyard hole */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-black/10 border-2 border-white/50" />
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
