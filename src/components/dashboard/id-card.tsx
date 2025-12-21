
'use client';
import type { User } from "@/lib/types";
import { locations, companies } from "@/lib/constants";
import { Droplet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AseLogo } from "./ase-logo";
import { useState, useEffect, forwardRef } from "react";
import Image from "next/image";
import { getAvatarSrc } from "@/lib/utils";

export const IdCard = forwardRef<HTMLDivElement, { employee: User, company?: any, customConfig?: any }>(({ employee, company: propCompany, customConfig }, ref) => {
    const company = propCompany || companies.find(c => c.name === employee.company);
    const companyAddress = company?.address || (employee.location && locations[employee.location as keyof typeof locations]) ? locations[employee.location as keyof typeof locations] : 'N/A';
    const [logoSrc, setLogoSrc] = useState<string | null>(null);

    const [savedConfig, setSavedConfig] = useState<any>(null);

    useEffect(() => {
        const loadConfig = () => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('idCardConfig');
                if (saved) {
                    try {
                        setSavedConfig(JSON.parse(saved));
                    } catch (e) {
                        console.error("Error parsing saved ID card config", e);
                    }
                } else {
                    setSavedConfig(null);
                }
            }
        };

        const storedLogo = localStorage.getItem('companyLogo');
        if (storedLogo) {
            setLogoSrc(storedLogo);
        }

        loadConfig();

        // Listen for custom event from designer
        const handleConfigSaved = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                setSavedConfig(customEvent.detail);
            }
        };

        window.addEventListener('idCardConfigSaved', handleConfigSaved);
        window.addEventListener('storage', loadConfig); // For logo changes

        return () => {
            window.removeEventListener('idCardConfigSaved', handleConfigSaved);
            window.removeEventListener('storage', loadConfig);
        };
    }, []);

    const contact = employee.emergencyContact || employee.mobile || '';
    // Remove existing +91 if present to avoid +91+91, or just check
    const cleanContact = contact.replace(/^\+91/, '');
    const formattedContact = `+91${cleanContact}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`tel:${formattedContact}`)}&size=80x80&bgcolor=ffffff&color=000000&qzone=1`;

    // Dynamic styles based on config or defaults (defaults handled by CSS classes if config is missing, but simpler to just use config if provided)
    const activeConfig = customConfig || savedConfig; // Prefer prop (preview mode), fallback to saved (print mode)
    // Better strategy: If customConfig exists, use it. If not, use the classes we just fine-tuned.
    // Actually, to support the designer, we should apply inline styles that OVERRIDE the classes.

    const s = (val: number | undefined) => val ? `${val}px` : undefined;
    const t = (offset: { x: number, y: number } | undefined) => offset ? `translate(${offset.x}px, ${offset.y}px)` : undefined;

    return (
        <div ref={ref}
            className={cn(
                "bg-white rounded-lg shadow-lg w-[54mm] h-[85.6mm] mx-auto font-sans flex flex-col overflow-hidden relative border text-black print:shadow-none print:border-gray-200",
                activeConfig ? "" : "p-1.5" // Default padding if no config
            )}
            style={{ padding: activeConfig ? `${activeConfig.padding * 4}px` : undefined }} // 1 unit = 4px in tailwind logic usually, but here let's just use px or rem. Tailwind p-1.5 is 0.375rem = 6px.
        >
            {/* Top half: Photo */}
            <div
                className="flex-shrink-0 relative"
                style={{
                    height: activeConfig ? `${activeConfig.photoHeight}mm` : '42mm',
                    transform: t(activeConfig?.photoOffset)
                }}
            >
                <Image
                    src={getAvatarSrc(employee, 200)}
                    alt={employee.name ? employee.name : 'Employee Photo'}
                    width={200}
                    height={200}
                    className="absolute inset-0 w-full h-full object-cover transition-transform"
                    style={{
                        transform: `scale(${employee.photo_scale || 1}) translate(${employee.photo_x_offset || 0}px, ${employee.photo_y_offset || 0}px)`
                    }}
                    crossOrigin="anonymous"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                <div className="absolute top-1.5 left-1.5 h-6 w-6 bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden shadow-sm">
                    {company?.logo ? (
                        <img src={company.logo} alt="Company Logo" className="object-contain h-full w-full" crossOrigin="anonymous" />
                    ) : (
                        <AseLogo />
                    )}
                </div>
            </div>

            {/* Bottom half: Information */}
            <div className="flex flex-col flex-grow bg-white relative min-h-0 overflow-hidden" style={{ padding: activeConfig ? '2px' : '6px' }}>
                <div className="text-center mb-1">
                    <h1
                        className={cn(
                            "font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis px-1 uppercase leading-tight text-[11px]",
                            !activeConfig && ((employee.displayName || employee.name).length > 20 ? "text-[10px]" : "text-[11px]")
                        )}
                        style={{
                            fontSize: s(activeConfig?.nameSize),
                            transform: t(activeConfig?.nameOffset),
                            display: 'block' // Ensure block so transform works predictably if needed
                        }}
                    >
                        {employee.displayName || employee.name}
                    </h1>
                    <p
                        className="text-gray-700 font-bold uppercase inline-block px-1 tracking-wide text-[7px] leading-tight"
                        style={{
                            fontSize: s(activeConfig?.deptSize),
                            transform: t(activeConfig?.deptOffset)
                        }}
                    >
                        {employee.department || 'DEPT'}
                    </p>
                </div>

                <div
                    className="grid grid-cols-3 gap-0.5 items-center w-full flex-grow mt-0.5"
                    style={{ transform: t(activeConfig?.detailsOffset) }}
                >
                    {/* Left Column: Labels */}
                    <div className="col-span-1 space-y-1.5 text-left pl-1">
                        {['Code', 'Status', 'Blood'].map(label => (
                            <div key={label}
                                className="font-semibold text-gray-600 uppercase tracking-wider text-[6px]"
                                style={{ fontSize: s(activeConfig?.labelSize) }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Center Column: QR Code */}
                    <div className="col-span-1 flex justify-center items-center h-full">
                        <Image
                            src={qrCodeUrl}
                            alt="QR"
                            width={activeConfig ? activeConfig.qrSize : 32}
                            height={activeConfig ? activeConfig.qrSize : 32}
                            className="bg-white"
                            crossOrigin="anonymous"
                            unoptimized
                        />
                    </div>

                    {/* Right Column: Values */}
                    <div className="col-span-1 space-y-1.5 text-right pr-1">
                        <div className="font-bold text-gray-900 text-[9px]" style={{ fontSize: s(activeConfig?.valueSize) }}>
                            {employee.id}
                        </div>
                        <div
                            className={cn(
                                "font-bold text-[9px]",
                                employee.status === 'active' && 'text-green-700',
                                employee.status === 'inactive' && 'text-red-700',
                                employee.status === 'pending' && 'text-yellow-700',
                                employee.status === 'deleted' && 'text-red-700',
                            )}
                            style={{ fontSize: s(activeConfig?.valueSize) }}
                        >
                            {(employee.status || 'Active').charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-gray-900 flex items-center gap-0.5 justify-end text-[9px]" style={{ fontSize: s(activeConfig?.valueSize) }}>
                            <Droplet className="text-red-600 fill-current" style={{ width: s(activeConfig?.valueSize || 9), height: s(activeConfig?.valueSize || 9) }} />
                            {employee.bloodGroup || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className="bg-gray-900 text-white text-center flex flex-col justify-center items-center flex-shrink-0 py-1"
                style={{
                    minHeight: '14mm',
                    transform: t(activeConfig?.footerOffset)
                }}
            >
                <p
                    className="font-bold uppercase w-full truncate px-1 tracking-wide text-[10px]"
                    style={{
                        fontSize: s(activeConfig?.companySize),
                        transform: t(activeConfig?.companyOffset),
                        display: 'block'
                    }}
                >
                    {company?.name || "Company Name"}
                </p>
                <p
                    className="font-medium leading-tight w-full px-2 line-clamp-2 text-gray-300 mt-0.5 text-[6px]"
                    style={{
                        fontSize: s(activeConfig?.addressSize),
                        transform: t(activeConfig?.addressOffset),
                        display: 'block'
                    }}
                >
                    {companyAddress}
                </p>
            </div>
        </div>
    );
});

IdCard.displayName = 'IdCard';
