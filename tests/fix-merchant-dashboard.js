const fs = require('fs');
const path = '/home/cw/a/community-backend/backend/src/controllers/merchantPortalController.js';
let content = fs.readFileSync(path, 'utf8');
const OLD = '`market_goods`.`stock` <= `market_goods`.`safe_stock`';
const NEW = 'stock <= safe_stock';
const count = (content.match(new RegExp(OLD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
content = content.replace(new RegExp(OLD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW);
fs.writeFileSync(path, content);
console.log('Replaced', count, 'occurrences');
