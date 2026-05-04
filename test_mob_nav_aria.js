const fs = require('fs');
const content = fs.readFileSync('components/layout/mobile-navigation-menu.tsx', 'utf-8');
if (content.includes('aria-expanded')) {
    console.log('aria-expanded found in mobile-navigation-menu.tsx');
} else {
    console.log('aria-expanded missing in mobile-navigation-menu.tsx');
}
