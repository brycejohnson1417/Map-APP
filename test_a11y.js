const fs = require('fs');

const content = fs.readFileSync('components/fraternitees/fraternitees-portal.tsx', 'utf-8');
if (content.includes('role="switch"')) {
    console.log('Switch buttons found.');
}
