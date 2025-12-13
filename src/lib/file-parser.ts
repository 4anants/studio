export interface ParsedFileInfo {
    originalName: string;
    detectedName: string;
    detectedMonth?: string;
    detectedYear?: string;
    cleanName: string;
}

const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthsLong = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function parseFilename(filename: string): ParsedFileInfo {
    // Remove extension
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;

    // Split by underscore or spaces
    const parts = nameWithoutExt.split(/[_\s]+/);

    // Basic heuristic: 
    // Last part is likely date (e.g. Jan2025, 2024, etc)
    // Everything before is name

    const nameParts = [...parts];
    let datePart = '';

    // Check if last part looks like a date
    const lastPart = parts[parts.length - 1];
    if (/\d{4}/.test(lastPart)) { // Contains year
        datePart = lastPart;
        nameParts.pop(); // Remove it from name
    }

    const cleanName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

    // Try to extract Month/Year from datePart
    let detectedMonth: string | undefined;
    let detectedYear: string | undefined;

    if (datePart) {
        const yearMatch = datePart.match(/\d{4}/);
        if (yearMatch) detectedYear = yearMatch[0];

        const lowerDate = datePart.toLowerCase();
        // Check full months first
        let monthIndex = monthsLong.findIndex(m => lowerDate.includes(m));
        if (monthIndex === -1) {
            // Check short months
            monthIndex = monthsShort.findIndex(m => lowerDate.includes(m));
        }

        if (monthIndex !== -1) {
            detectedMonth = (monthIndex + 1).toString(); // Return 1-12
        }
    }

    return {
        originalName: filename,
        detectedName: cleanName,
        detectedMonth,
        detectedYear,
        cleanName: cleanName // Start search with this
    };
}
