const fs = require('fs');
const path = require('path');

const replacements = {
  '/img/placeholders/home_cleaning.png': 'https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png',
  '/img/placeholders/sale_banner.png': 'https://120.27.239.244:3001/uploads/file-1773395942500-585304598.png',
  '/img/placeholders/avatar_worker.png': 'https://120.27.239.244:3001/uploads/file-1773395942842-959042242.png',
  '/img/placeholders/avatar_worker_1772546547875.png': 'https://120.27.239.244:3001/uploads/file-1773395942842-959042242.png',
  '/img/head.jpg': 'https://120.27.239.244:3001/uploads/file-1773395943186-905167166.jpg'
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'miniprogram_npm'].includes(file)) continue;
      walk(fullPath);
    } else if (fullPath.endsWith('.wxml') || fullPath.endsWith('.js') || fullPath.endsWith('.wxss')) {
      // Skip the script itself and images.js to avoid circular replacement or breaking logic
      if (fullPath.includes('fix_missing_images.js') || fullPath.includes('utils' + path.sep + 'images.js')) continue;

      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [key, value] of Object.entries(replacements)) {
        if (content.includes(key)) {
          content = content.split(key).join(value);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

console.log('Starting global placeholder replacement...');
walk(__dirname);
console.log('Done.');
