'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function DynamicFavicon() {
    useEffect(() => {
        const updateFavicon = () => {
            const storedLogo = localStorage.getItem('companyLogo');
            if (storedLogo) {
                // Create a canvas to render the rounded favicon with gradient
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous'; // Helper if serving from external CDNs, though usually data URI here
                    img.onload = () => {
                        // Clear
                        ctx.clearRect(0, 0, 64, 64);

                        // Draw Gradient Border
                        const gradient = ctx.createLinearGradient(0, 0, 64, 0);
                        gradient.addColorStop(0, '#3b82f6'); // blue-500
                        gradient.addColorStop(0.5, '#a855f7'); // purple-500
                        gradient.addColorStop(1, '#ec4899'); // pink-500

                        ctx.beginPath();
                        ctx.arc(32, 32, 30, 0, Math.PI * 2);
                        ctx.fillStyle = gradient; // Use fill for a full background circle if we want a border effect
                        ctx.fill();

                        // Draw White Background (inner circle)
                        ctx.beginPath();
                        ctx.arc(32, 32, 26, 0, Math.PI * 2);
                        ctx.fillStyle = '#ffffff';
                        ctx.fill();

                        // Draw Circular Clipped Image
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(32, 32, 26, 0, Math.PI * 2);
                        ctx.clip();
                        // Draw image centered and covering
                        // We want cover: ratio preservation
                        const aspect = img.width / img.height;
                        let drawW = 52;
                        let drawH = 52;
                        let offX = 6;
                        let offY = 6;

                        if (aspect > 1) {
                            // wider
                            drawH = 52;
                            drawW = 52 * aspect;
                            offX = 6 - (drawW - 52) / 2;
                        } else {
                            // taller
                            drawW = 52;
                            drawH = 52 / aspect;
                            offY = 6 - (drawH - 52) / 2;
                        }
                        ctx.drawImage(img, offX, offY, drawW, drawH);
                        ctx.restore();

                        // Update Link
                        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.head.appendChild(link);
                        }
                        link.href = canvas.toDataURL();
                    };
                    img.src = storedLogo;
                }
            } else {
                let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (link) {
                    link.href = '/icon.svg';
                }
            }
        };

        // Initial check
        updateFavicon();

        // Listen for storage events (changes from other tabs)
        window.addEventListener('storage', updateFavicon);

        // Fetch settings from server to sync state globally
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    let changed = false;

                    if (data.companyLogo) {
                        if (localStorage.getItem('companyLogo') !== data.companyLogo) {
                            localStorage.setItem('companyLogo', data.companyLogo);
                            changed = true;
                        }
                    } else {
                        if (localStorage.getItem('companyLogo')) {
                            localStorage.removeItem('companyLogo');
                            changed = true;
                        }
                    }

                    if (data.siteName) {
                        if (localStorage.getItem('siteName') !== data.siteName) {
                            localStorage.setItem('siteName', data.siteName);
                            document.title = data.siteName;
                            changed = true;
                        }
                    }

                    if (changed) {
                        updateFavicon();
                        window.dispatchEvent(new Event('storage'));
                    }
                }
            } catch (error) {
                logger.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();

        return () => {
            window.removeEventListener('storage', updateFavicon);
        };
    }, []);

    return null;
}
