
'use client'
import type { User } from "@/lib/mock-data";
import { companies, AseLogo as AseLogoData } from "@/lib/mock-data";
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
    <div className="bg-white rounded-2xl shadow-lg w-[320px] h-[512px] mx-auto font-sans flex flex-col overflow-hidden relative">
      {/* Top section */}
      <div className="w-full h-2/5 bg-primary flex flex-col justify-between items-center p-4 text-primary-foreground relative">
          <div className="flex items-center gap-2">
               {isClient && logoSrc ? (
                    <Image src={logoSrc} alt="Company Logo" width={32} height={32} className="object-contain" />
                ) : (
                    <AseLogo className="w-8 h-8" />
                )}
              <span className="font-semibold text-lg">{company?.name || "Company Name"}</span>
          </div>
          <div className="absolute -bottom-16 w-32 h-32 rounded-full border-4 border-white bg-gray-200">
            <Image
                src={getAvatarSrc(employee)}
                width={128}
                height={128}
                alt={employee.name}
                className="object-cover object-center w-full h-full rounded-full"
                data-ai-hint="person portrait"
            />
          </div>
      </div>
      {/* Bottom section */}
      <div className="w-full h-3/5 bg-white flex flex-col items-center justify-start pt-20 px-4 text-center">
         <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
         <p className="text-md text-gray-500 font-medium mt-1">{employee.department || 'N/A'}</p>
         <p className="text-sm text-gray-400 font-medium mt-4">Employee Code: {employee.id}</p>
      </div>
       <div className="w-full h-2 bg-primary absolute bottom-0" />
    </div>
  );
}
