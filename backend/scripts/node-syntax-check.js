#!/usr/bin/env node
/**
 * 无 ESLint 时的轻量校验：对 backend/src 下全部 .js 执行 node --check
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const files = walk(root);
if (files.length === 0) {
  console.error('node-syntax-check: no files under', root);
  process.exit(1);
}
for (const f of files) {
  execSync(`node --check "${f}"`, { stdio: 'inherit' });
}
console.log(`[lint] OK ${files.length} files (node --check)`);
