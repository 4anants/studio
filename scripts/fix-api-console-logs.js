#!/usr/bin/env node

/**
 * Security Fix Script for API Routes
 * Replaces console.log/error with secure logger in API routes
 */

const fs = require('fs');
const path = require('path');

const apiFiles = [
    'src/app/api/users/route.ts',
    'src/app/api/users/reset-password/route.ts',
    'src/app/api/users/profile/route.ts',
    'src/app/api/users/bulk-update/route.ts',
    'src/app/api/settings/route.ts',
    'src/app/api/document-types/route.ts',
    'src/app/api/migrate-location/route.ts',
    'src/app/api/migrate-companies/route.ts',
    'src/app/api/migrate-announcements/route.ts',
    'src/app/api/holidays/route.ts',
    'src/app/api/file/route.ts',
    'src/app/api/departments/route.ts',
    'src/app/api/document-pin/route.ts',
    'src/app/api/document-pin/reset/route.ts',
    'src/app/api/documents/route.ts',
    'src/app/api/companies/route.ts',
    'src/app/api/cleanup/route.ts',
];

function processFile(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Check if logger is already imported
    const hasLoggerImport = content.includes("from '@/lib/logger'") || content.includes('from "@/lib/logger"');

    // Add logger import if not present and file has console statements
    if (!hasLoggerImport && (content.includes('console.log') || content.includes('console.error'))) {
        // Find the last import statement
        const importRegex = /^import .+ from .+;$/gm;
        const imports = content.match(importRegex);

        if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = content.lastIndexOf(lastImport);
            const insertPosition = lastImportIndex + lastImport.length;

            content = content.slice(0, insertPosition) +
                "\nimport { logger } from '@/lib/logger';" +
                content.slice(insertPosition);
            modified = true;
        }
    }

    // Replace console statements
    const originalContent = content;
    content = content.replace(/console\.log\(/g, 'logger.log(');
    content = content.replace(/console\.error\(/g, 'logger.error(');
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    content = content.replace(/console\.info\(/g, 'logger.info(');

    if (content !== originalContent) {
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        return true;
    } else {
        console.log(`⏭️  Skipped: ${filePath}`);
        return false;
    }
}

console.log('🔒 Starting Security Fix: API Routes\n');

let fixedCount = 0;
apiFiles.forEach(file => {
    if (processFile(file)) {
        fixedCount++;
    }
});

console.log(`\n✅ Complete! Fixed ${fixedCount} API files`);
