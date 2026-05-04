const fs = require('fs');

const content = fs.readFileSync('components/accounts/ppp-savings-panel.tsx', 'utf-8');
if (content.includes('aria-expanded')) {
    console.log('aria-expanded found in ppp-savings-panel.tsx');
} else {
    console.log('aria-expanded missing in ppp-savings-panel.tsx');
}
