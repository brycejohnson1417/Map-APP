const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.jsx')) {
        callback(dirPath);
      }
    }
  });
}

const regex = /<button[^>]*>[\s\n]*<[A-Z][a-zA-Z0-9]*\s*(className="[^"]*")?\s*(\/>|>[^<]*<\/[A-Z][a-zA-Z0-9]*>)[\s\n]*<\/button>/g;

walkDir('./components', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!match[0].includes('aria-label')) {
      console.log(`File: ${filePath}\nMatch:\n${match[0]}\n`);
    }
  }
});
