'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/login-form';
import { FileLock2, UploadCloud } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="group relative mx-auto mb-4 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-primary">
            <input
              type="file"
              id="logo-upload"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              accept="image/*"
              onChange={handleLogoChange}
            />
            {logoSrc ? (
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
            <div className="absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>
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
