const fs = require('fs');
const path = require('path');

const dirToProcess = path.join(__dirname);
const remoteUrl = 'https://120.27.239.244:3001:3001/img/';

function walk(dir, callback) {
  fs.readdir(dir, (err, list) => {
    if (err) return;
    list.forEach(file => {
      const filePath = path.join(dir, file);
      if (file === 'node_modules' || file === '.git' || file === 'img' || file === '.claude' || file === 'backend' || file === 'admin' || file === 'doc') {
        return;
      }
      fs.stat(filePath, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(filePath, callback);
        } else {
          if (filePath.endsWith('.js') || filePath.endsWith('.wxml') || filePath.endsWith('.wxss') || filePath.endsWith('.json')) {
            callback(filePath);
          }
        }
      });
    });
  });
}

walk(dirToProcess, (filePath) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return;
    let modified = false;
    let newData = data.replace(/['"]\/img\/(.*?)['"]/g, (match, p1) => {
      modified = true;
      const quote = match[0]; // ' or "
      return quote + remoteUrl + p1 + quote;
    });

    // Also handle relative imports if any: e.g. ../../img/
    newData = newData.replace(/['"](\.\.\/)+img\/(.*?)['"]/g, (match, p1, p2) => {
      modified = true;
      const quote = match[0];
      return quote + remoteUrl + p2 + quote;
    });

    if (modified) {
      fs.writeFile(filePath, newData, 'utf8', err => {
        if (!err) console.log(`Updated ${filePath}`);
      });
    }
  });
});
