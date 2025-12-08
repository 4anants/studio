
'use client'

import { FirebaseProvider } from "./provider";
import { useEffect, useState } from "react";

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return <FirebaseProvider>{children}</FirebaseProvider>
}
