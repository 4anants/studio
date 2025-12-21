'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/login-form';
import Image from 'next/image';
import { CompanyName } from '@/lib/constants';
import { logger } from '@/lib/logger';

const AseLogo = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-xl"
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
  const [secretClicks, setSecretClicks] = useState(0);
  const [showLocalLogin, setShowLocalLogin] = useState(false);

  const handleSecretTrigger = () => {
    const newCount = secretClicks + 1;
    setSecretClicks(newCount);
    if (newCount >= 5) {
      setShowLocalLogin(true);
    }
  };

  useEffect(() => {
    setIsClient(true);

    // Initial load from localStorage if available
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

    // Fetch latest settings from server to ensure fresh data
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.companyLogo) {
            setLogoSrc(data.companyLogo);
            localStorage.setItem('companyLogo', data.companyLogo);
          }
          if (data.siteName) {
            setSiteName(data.siteName);
            document.title = data.siteName;
            localStorage.setItem('siteName', data.siteName);
          }
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        logger.error("Failed to fetch settings on login page", error);
      }
    };
    fetchSettings();

    const handleStorageChange = () => {
      const storedSiteName = localStorage.getItem('siteName');
      if (storedSiteName) {
        setSiteName(storedSiteName);
        document.title = storedSiteName;
      }
      const storedLogo = localStorage.getItem('companyLogo');
      if (storedLogo) {
        setLogoSrc(storedLogo);
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    }

  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-4">

      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 w-full h-full">
        {/* Gradient Blob 1 */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/30 blur-[100px] animate-pulse" />
        {/* Gradient Blob 2 */}
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/30 blur-[100px] animate-pulse delay-1000" />
        {/* Gradient Blob 3 */}
        <div className="absolute top-[30%] left-[50%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-pink-500/20 blur-[80px]" />

        {/* Overlay Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      </div>

      {/* Main Content Container */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8 px-10">

          <div className="text-center mb-8">
            <div className="group relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              {/* Logo Glow */}
              <div className="absolute inset-0 bg-indigo-500/40 blur-2xl rounded-full group-hover:bg-indigo-400/60 transition-all duration-500" />

              <div className="relative z-10 p-2" onClick={handleSecretTrigger}>
                {isClient && logoSrc ? (
                  <div className="h-24 w-24 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 bg-black/20 cursor-pointer active:scale-95 transition-transform">
                    <Image
                      src={logoSrc}
                      alt={siteName || "Company Logo"}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="transform transition-transform duration-500 group-hover:scale-110 cursor-pointer" onClick={handleSecretTrigger}>
                    <AseLogo />
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
              {siteName}
            </h1>
            <p className="mt-3 text-slate-400 font-medium text-sm">
              Your secure internal document repository
            </p>
          </div>

          <div className="login-form-wrapper dark">
            <LoginForm enableLocalLogin={showLocalLogin} />
          </div>

        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Authorized access only. Protected by FileSafe™.
          </p>
        </div>
      </div>
    </main>
  );
}
