const fs = require('fs');
const p = '/home/cw/a/community-backend/backend/src/index.js';
let c = fs.readFileSync(p, 'utf8');

// Find and replace the merged line
const lines = c.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// New modules: chat') && lines[i].includes('app.use')) {
        newLines.push('// New modules: chat, coupons, benefit-coin, promoter, mini-programs');
        newLines.push("app.use('/api/v1/chat', require('./routes/chatRoutes'));");
        newLines.push("app.use('/api/v1/coupons', require('./routes/couponRoutes'));");
        newLines.push("app.use('/api/v1/benefit-coin', require('./routes/benefitCoinRoutes'));");
        newLines.push("app.use('/api/v1/promoter', require('./routes/promoterRoutes'));");
        newLines.push("app.use('/api/v1/mini-programs', require('./routes/miniProgramRoutes'));");
    } else {
        newLines.push(lines[i]);
    }
}
fs.writeFileSync(p, newLines.join('\n'));
console.log('Fixed index.js');

// Also fix CouponIssue association
const cp = '/home/cw/a/community-backend/backend/src/models/CouponIssue.js';
let cc = fs.readFileSync(cp, 'utf8');
cc = cc.replace(
    /static associate\(\) \{\}/,
    "static associate(models) {\n      this.belongsTo(models.CouponTemplate, { foreignKey: 'template_id', as: 'CouponTemplate' });\n    }"
);
fs.writeFileSync(cp, cc);
console.log('Fixed CouponIssue model');
