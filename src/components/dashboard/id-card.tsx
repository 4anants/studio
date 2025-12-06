
'use client';
import { useState, useEffect } from "react";
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";
import Image from "next/image";
import { Droplet } from 'lucide-react';

export function IdCard({ employee }: { employee: User }) {
  const company = companies.find(c => c.name === employee.company);
  const companyAddress = employee.location ? locations[employee.location] : 'N/A';

  const getAvatarSrc = (user: User) => {
    if (user.avatar && user.avatar.startsWith('data:image')) return user.avatar;
    return `https://picsum.photos/seed/${user.avatar}/400/400`;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg w-[320px] h-[540px] mx-auto font-sans flex flex-col overflow-hidden relative border">
        {/* Top half: Photo */}
        <div className="flex-shrink-0 h-1/2 relative">
            <Image
                src={getAvatarSrc(employee)}
                layout="fill"
                alt={employee.name}
                className="object-cover object-center"
                data-ai-hint="person portrait"
            />
        </div>

        {/* Bottom half: Information */}
        <div className="p-5 flex flex-col flex-grow bg-white">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                <p className="text-md text-gray-500 font-medium">{employee.department || 'N/A'}</p>
            </div>
            
            <div className="w-full text-sm space-y-3 text-left flex-grow">
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
        <div className="bg-muted text-muted-foreground text-center p-3 flex-shrink-0">
             <p className="font-bold text-sm">{company?.name || "Company Name"}</p>
             <p className="text-xs">{companyAddress}</p>
        </div>
    </div>
  );
}
