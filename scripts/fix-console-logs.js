#!/usr/bin/env node

/**
 * Security Fix Script
 * Automatically replaces console.log/error with secure logger
 * Run with: node scripts/fix-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Files to process
const filesToProcess = [
    'src/app/layout.tsx',
    'src/app/error.tsx',
    'src/app/login/page.tsx',
    'src/lib/auth.ts',
    'src/components/dynamic-favicon.tsx',
    'src/components/dashboard/employee-self-edit-dialog.tsx',
    'src/components/dashboard/id-card-designer.tsx',
    'src/components/dashboard/id-card.tsx',
    'src/components/dashboard/upload-dialog.tsx',
    'src/components/dashboard/pin-verify-dialog.tsx',
    'src/components/dashboard/import-export-buttons.tsx',
    'src/components/dashboard/bulk-upload/stage-three.tsx',
    'src/components/dashboard/bulk-upload/stage-two.tsx',
    'src/firebase/provider.tsx',
    'src/firebase/firestore/use-doc.ts',
    'src/firebase/firestore/use-collection.ts',
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

    // Replace console.log with logger.log
    const originalContent = content;
    content = content.replace(/console\.log\(/g, 'logger.log(');
    content = content.replace(/console\.error\(/g, 'logger.error(');
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    content = content.replace(/console\.info\(/g, 'logger.info(');
    content = content.replace(/console\.debug\(/g, 'logger.debug(');

    if (content !== originalContent) {
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        return true;
    } else {
        console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
        return false;
    }
}

console.log('🔒 Starting Security Fix: Console Logs\n');

let fixedCount = 0;
let skippedCount = 0;

filesToProcess.forEach(file => {
    if (processFile(file)) {
        fixedCount++;
    } else {
        skippedCount++;
    }
});

console.log(`\n✅ Complete!`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`\n🔒 All console logs are now secure!`);
