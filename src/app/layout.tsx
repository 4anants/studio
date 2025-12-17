
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { CompanyName } from '@/lib/constants';
import './print.css';
import { SessionProvider } from '@/components/session-provider';
import { DynamicFavicon } from '@/components/dynamic-favicon';

import { query } from '@/lib/db';

// Simple cache for metadata to reduce DB queries
let metadataCache: { data: Metadata; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  // Check cache first
  if (metadataCache && Date.now() - metadataCache.timestamp < CACHE_TTL) {
    return metadataCache.data;
  }

  let title = CompanyName;
  let icon = '/icon.svg';

  try {
    // Fetch settings from DB
    const rows = await query<any[]>('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?, ?)', ['siteName', 'companyLogo']);

    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    if (settings['siteName']) {
      title = settings['siteName'];
    }
    if (settings['companyLogo']) {
      icon = settings['companyLogo'];
    }

  } catch (error) {
    console.error('Error fetching metadata settings:', error);
    // Return default metadata on error
  }

  const metadata: Metadata = {
    title: title,
    description: 'Your secure internal document repository.',
    icons: {
      icon: icon,
      shortcut: icon,
      apple: icon,
    },
  };

  // Update cache
  metadataCache = { data: metadata, timestamp: Date.now() };

  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <SessionProvider>
          <DynamicFavicon />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
