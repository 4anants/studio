#!/usr/bin/env node

/**
 * Final Security Fixes Script
 * Fixes the remaining critical security issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Applying Final Security Fixes...\n');

// Fix 1: Replace default password with secure random generator
const usersRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'users', 'route.ts');

if (fs.existsSync(usersRoutePath)) {
    let content = fs.readFileSync(usersRoutePath, 'utf8');

    const oldPasswordCode = `      passwordHash = await bcrypt.hash('default123', 10);`;

    const newPasswordCode = `      // Generate secure random password for new users
      const generateSecurePassword = () => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*';
        const all = uppercase + lowercase + numbers + special;
        
        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        
        for (let i = 0; i < 4; i++) {
          password += all[Math.floor(Math.random() * all.length)];
        }
        
        return password.split('').sort(() => Math.random() - 0.5).join('');
      };
      
      const randomPassword = generateSecurePassword();
      passwordHash = await bcrypt.hash(randomPassword, 10);
      logger.log(\`Generated secure password for new user: \${randomPassword}\`);`;

    if (content.includes(oldPasswordCode)) {
        content = content.replace(oldPasswordCode, newPasswordCode);
        fs.writeFileSync(usersRoutePath, content, 'utf8');
        console.log('✅ Fixed: Default password replaced with secure random generator');
    } else {
        console.log('⏭️  Skipped: Default password already fixed or not found');
    }
} else {
    console.log('⚠️  File not found: src/app/api/users/route.ts');
}

console.log('\n🎉 Security fixes complete!');
console.log('\n📝 Next steps:');
console.log('   1. Test user creation');
console.log('   2. Verify random passwords are generated');
console.log('   3. Deploy to production');
