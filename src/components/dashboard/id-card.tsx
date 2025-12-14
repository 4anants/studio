
'use client';
import type { User } from "@/lib/types";
import { locations, companies } from "@/lib/constants";
import { Droplet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AseLogo } from "./ase-logo";
import { useState, useEffect, forwardRef } from "react";
import Image from "next/image";
import { getAvatarSrc } from "@/lib/utils";

export const IdCard = forwardRef<HTMLDivElement, { employee: User, company?: any }>(({ employee, company: propCompany }, ref) => {
    const company = propCompany || companies.find(c => c.name === employee.company);
    const companyAddress = company?.address || (employee.location && locations[employee.location as keyof typeof locations]) ? locations[employee.location as keyof typeof locations] : 'N/A';
    const [logoSrc, setLogoSrc] = useState<string | null>(null);

    useEffect(() => {
        const storedLogo = localStorage.getItem('companyLogo');
        if (storedLogo) {
            setLogoSrc(storedLogo);
        }
    }, []);

    const contact = employee.emergencyContact || employee.mobile || '';
    // Remove existing +91 if present to avoid +91+91, or just check
    const cleanContact = contact.replace(/^\+91/, '');
    const formattedContact = `+91${cleanContact}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`tel:${formattedContact}`)}&size=80x80&bgcolor=ffffff&color=000000&qzone=1`;

    return (
        <div ref={ref} className="bg-white rounded-lg shadow-lg w-[320px] h-[540px] mx-auto font-sans flex flex-col overflow-hidden relative border text-black">
            {/* Top half: Photo */}
            <div className="flex-shrink-0 h-[270px] relative">
                <Image
                    src={getAvatarSrc(employee, 320)}
                    alt={employee.name ? employee.name : 'Employee Photo'}
                    width={320}
                    height={270}
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4 h-14 w-14 bg-white rounded-full p-1 flex items-center justify-center overflow-hidden shadow-sm">
                    {company?.logo ? (
                        <img src={company.logo} alt="Company Logo" className="object-contain h-full w-full" crossOrigin="anonymous" />
                    ) : (
                        <AseLogo />
                    )}
                </div>
            </div>

            {/* Bottom half: Information */}
            <div className="p-5 flex flex-col flex-grow bg-white">
                <div className="text-center mb-4">
                    <h1 className={cn(
                        "font-bold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis px-2 uppercase leading-tight",
                        (employee.displayName || employee.name).length > 30 ? "text-[10px] tracking-tighter" :
                            (employee.displayName || employee.name).length > 25 ? "text-xs tracking-tight" :
                                (employee.displayName || employee.name).length > 20 ? "text-sm" :
                                    (employee.displayName || employee.name).length > 15 ? "text-lg" : "text-xl"
                    )}>{employee.displayName || employee.name}</h1>
                    <p className="text-md text-gray-500 font-medium uppercase mt-1 inline-block px-2 py-0.5">{employee.department || 'DEPT'}</p>
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
                            {(employee.status || 'active').charAt(0).toUpperCase() + (employee.status || 'active').slice(1)}
                        </div>
                        <div className="font-semibold text-gray-800 flex items-center gap-1 justify-end">
                            <Droplet className="h-4 w-4 text-red-500" /> {employee.bloodGroup || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {/* Footer */}
            <div
                className="bg-gray-800 text-white text-center flex flex-col justify-center items-center flex-shrink-0"
                style={{
                    paddingTop: '1px',
                    paddingBottom: '32px',
                    minHeight: '84px'
                }}
            >
                <p
                    className="font-bold uppercase w-full truncate px-1 text-[18px]"
                    style={{
                        marginBottom: '1px'
                    }}
                >
                    {company?.name || "Company Name"}
                </p>
                <p
                    className="font-medium leading-normal w-full px-1 line-clamp-2 text-gray-300 text-[12px]"
                >
                    {companyAddress}
                </p>
            </div>
        </div>
    );
});

IdCard.displayName = 'IdCard';
