'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/login-form';
import { FileLock2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="group relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            {isClient && logoSrc ? (
              <Image
                src={logoSrc}
                alt="Custom Logo"
                width={80}
                height={80}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <FileLock2 className="h-8 w-8 text-primary-foreground" />
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-primary">
            AE INTRAWEB
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
