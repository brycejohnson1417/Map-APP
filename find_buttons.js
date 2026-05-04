const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(searchFiles(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = searchFiles('./components').concat(searchFiles('./app'));

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const buttonMatches = content.match(/<button[\s\S]*?<\/button>/g);
    if (buttonMatches) {
        buttonMatches.forEach(btn => {
            // Check if it has aria-label
            if (!btn.includes('aria-label')) {
                // Check if it only contains an icon (no letters)
                const innerMatch = btn.match(/>([\s\S]*?)<\/button>/);
                if (innerMatch) {
                    const innerText = innerMatch[1].replace(/<[^>]+>/g, '').trim();
                    if (innerText === '' || innerText === '&times;') {
                        console.log(`Potential icon-only button without aria-label in ${file}:`);
                        console.log(btn.substring(0, 200) + (btn.length > 200 ? '...' : ''));
                        console.log('---');
                    }
                }
            }
        });
    }
});
