'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/login-form';
import Image from 'next/image';
import { CompanyName } from '@/lib/constants';

const AseLogo = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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

export default function LoginPage() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [siteName, setSiteName] = useState(CompanyName);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
    const storedSiteName = localStorage.getItem('siteName');
    if (storedSiteName) {
      setSiteName(storedSiteName);
      document.title = storedSiteName;
    } else {
      document.title = CompanyName;
    }

    const handleStorageChange = () => {
      const storedSiteName = localStorage.getItem('siteName');
      if (storedSiteName) {
        setSiteName(storedSiteName);
        document.title = storedSiteName;
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    }

  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="group relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg">
            {isClient && logoSrc ? (
              <Image
                src={logoSrc}
                alt={siteName || "Company Logo"}
                width={80}
                height={80}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <AseLogo />
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {siteName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your secure internal document repository.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

