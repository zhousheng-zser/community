/**
 * 把 img/ 目录复制到后端 static 目录，便于通过 /uploads/img/ 访问
 * 使用方式: node scripts/deploy-images.js
 */
const fs = require('fs');
const path = require('path');

const SRC = 'img';
const DEST = path.join('backend', 'data', 'uploads', 'img');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dest, f);
    const st = fs.statSync(s);
    if (st.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyDir(SRC, DEST);
console.log(`Images copied to ${DEST}`);
console.log('Access via: http://your-server:3001/uploads/img/...');
