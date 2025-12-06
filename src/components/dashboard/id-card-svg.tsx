
import type { User } from "@/lib/mock-data";
import { companies, locations } from "@/lib/mock-data";

// Helper function to fetch an image and convert it to a data URI
async function imageToDataURI(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("imageToDataURI Error:", error);
        // Return a fallback or empty string if fetching fails
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    }
}


const defaultLogoSvg = `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 0L95.5 25.5V74.5L50 100L4.5 74.5V25.5L50 0Z" fill="#004a99"/>
  <path d="M26 63.5L50 50L74 63.5M50 75V50" stroke="#fecb00" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M26 36.5L50 25L74 36.5" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export async function IdCardSvg({ employee }: { employee: User }): Promise<string> {
    const company = companies.find(c => c.name === employee.company);
    const companyAddress = employee.location ? locations[employee.location] : 'N/A';
    
    // --- Image URLs ---
    const avatarUrl = (employee.avatar && employee.avatar.startsWith('data:image')) 
        ? employee.avatar 
        : `https://picsum.photos/seed/${employee.avatar}/320/270`;
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`tel:${employee.emergencyContact || employee.mobile || ''}`)}&size=80x80&bgcolor=ffffff&color=000000&qzone=1`;

    // --- Fetch images and convert to Data URIs ---
    // Note: We use a placeholder for the company logo as it's from localStorage.
    // In a real app, this would ideally be a public URL or fetched differently.
    const [avatarData, qrCodeData] = await Promise.all([
        imageToDataURI(avatarUrl),
        imageToDataURI(qrCodeUrl),
    ]);

    const statusColors: Record<User['status'], string> = {
        active: '#16a34a', // green-600
        inactive: '#dc2626', // red-600
        pending: '#f59e0b', // yellow-500
        deleted: '#dc2626', // red-600
    };
    const statusColor = statusColors[employee.status] || '#6b7280'; // gray-500

    // Using Inter font which is linked in the main layout
    return `
<svg width="320" height="540" viewBox="0 0 320 540" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
    .font { font-family: 'Inter', sans-serif; }
    .heavy { font-weight: 700; }
    .medium { font-weight: 500; }
    .text-gray-800 { fill: #1f2937; }
    .text-gray-500 { fill: #6b7280; }
    .text-white { fill: #ffffff; }
    .text-sm { font-size: 14px; }
    .text-xs { font-size: 12px; }
  </style>

  <!-- Background and Border -->
  <rect width="320" height="540" fill="#fff"/>
  <rect x="0.5" y="0.5" width="319" height="539" rx="8" ry="8" fill="none" stroke="#e5e7eb" stroke-width="1"/>
  
  <!-- Main Photo -->
  <defs>
    <clipPath id="clip-photo">
      <rect width="320" height="270" />
    </clipPath>
  </defs>
  <image href="${avatarData}" width="320" height="270" clip-path="url(#clip-photo)" preserveAspectRatio="xMidYMid slice"/>

  <!-- Logo -->
  <circle cx="36" cy="36" r="22" fill="rgba(255,255,255,0.8)"/>
  <foreignObject x="16" y="16" width="40" height="40">
    <body xmlns="http://www.w3.org/1999/xhtml">
        ${defaultLogoSvg}
    </body>
  </foreignObject>

  <!-- Info Section -->
  <g transform="translate(0, 270)">
    <text x="160" y="45" text-anchor="middle" class="font heavy text-gray-800" font-size="24">${employee.name}</text>
    <text x="160" y="68" text-anchor="middle" class="font medium text-gray-500 text-sm">${employee.designation || 'N/A'}</text>

    <!-- Details Grid -->
    <g transform="translate(20, 100)">
        <!-- Labels -->
        <text x="0" y="15" class="font medium text-gray-500 text-sm">Emp. Code</text>
        <text x="0" y="50" class="font medium text-gray-500 text-sm">Status</text>
        <text x="0" y="85" class="font medium text-gray-500 text-sm">Blood Group</text>
        
        <!-- Values -->
        <text x="280" y="15" text-anchor="end" class="font heavy text-gray-800 text-sm">${employee.id}</text>
        <text x="280" y="50" text-anchor="end" class="font heavy text-sm" fill="${statusColor}">${employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}</text>
        <g transform="translate(250, 75)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5-2 1.6-3 3.5-3 5.5a7 7 0 0 0 7 7z"/>
            </svg>
            <text x="20" y="12" text-anchor="end" class="font heavy text-gray-800 text-sm">${employee.bloodGroup || 'N/A'}</text>
        </g>
    </g>
    
    <!-- QR Code -->
    <image href="${qrCodeData}" x="120" y="95" width="80" height="80"/>
  </g>

  <!-- Footer -->
  <rect y="470" width="320" height="70" fill="#1f2937"/>
  <text x="160" y="500" text-anchor="middle" class="font heavy text-white text-sm">${company?.name || 'Company Name'}</text>
  <text x="160" y="520" text-anchor="middle" class="font medium text-white text-xs">${companyAddress}</text>

</svg>
`;
}
