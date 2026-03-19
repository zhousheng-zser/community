const fs = require('fs');
const path = require('path');

const keepFiles = [
  'home-0.png', 'home-1.png', 
  'shop-0.png', 'shop-1.png', 
  'order-0.png', 'order-1.png', 
  'user-0.png', 'user-1.png'
];

function deleteUnused(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      deleteUnused(fullPath);
      try {
        fs.rmdirSync(fullPath); // remove empty dir
      } catch (e) {}
    } else {
      if (dir === path.join(__dirname, 'img') && keepFiles.includes(file)) {
        console.log('Keeping', fullPath);
      } else {
        fs.unlinkSync(fullPath);
        console.log('Deleted', fullPath);
      }
    }
  });
}

deleteUnused(path.join(__dirname, 'img'));
