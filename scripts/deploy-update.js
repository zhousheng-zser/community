// This script updates the backend to register new routes and fix model associations
const fs = require('fs');

// 1. Fix CouponIssue association
const couponIssuePath = __dirname + '/../src/models/CouponIssue.js';
if (fs.existsSync(couponIssuePath)) {
    let c = fs.readFileSync(couponIssuePath, 'utf8');
    c = c.replace(
        /static associate\(\) \{\}/,
        "static associate(models) {\n      this.belongsTo(models.CouponTemplate, { foreignKey: 'template_id', as: 'CouponTemplate' });\n    }"
    );
    fs.writeFileSync(couponIssuePath, c);
    console.log('Updated CouponIssue model');
}

// 2. Register routes in index.js
const indexPath = __dirname + '/../src/index.js';
let idx = fs.readFileSync(indexPath, 'utf8');

// Add new route imports and registrations after the last existing route
const newImports = `
const chatRoutes = require('./routes/chatRoutes');
const couponRoutes = require('./routes/couponRoutes');
const benefitCoinRoutes = require('./routes/benefitCoinRoutes');
const promoterRoutes = require('./routes/promoterRoutes');
const miniProgramRoutes = require('./routes/miniProgramRoutes');
`;

const newRegistrations = `
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/benefit-coin', benefitCoinRoutes);
app.use('/api/v1/promoter', promoterRoutes);
app.use('/api/v1/mini-programs', miniProgramRoutes);

// File upload endpoint
const upload = require('./utils/upload');
app.post('/api/v1/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ code: 1, msg: '没有上传文件' });
    const url = '/uploads/' + req.file.filename;
    res.json({ code: 0, msg: '上传成功', data: { url, filename: req.file.filename, size: req.file.size } });
});
`;

// Check if already registered
if (idx.includes("require('./routes/chatRoutes')")) {
    console.log('Routes already registered, skipping');
} else {
    // Find the position after the last app.use for routes
    const lastRouteReg = idx.lastIndexOf("app.use('/api/v1/");
    const lastSectionEnd = idx.indexOf('\n', lastRouteReg);
    // Insert before any line that doesn't start with app.use after the last route
    idx = idx.slice(0, lastSectionEnd + 1) + idx.slice(lastSectionEnd + 1);

    // Add imports at the end of the import section
    const importSection = idx.indexOf("const ");
    // Find a good insertion point - after the last require in the import area
    const lines = idx.split('\n');
    let insertIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("const ") && lines[i].includes("require('./routes/")) {
            insertIdx = i + 1;
        }
    }

    if (insertIdx > 0) {
        lines.splice(insertIdx, 0, ...newImports.trim().split('\n'));
        idx = lines.join('\n');
    }

    // Add registrations at the end of file (before any final export or if block)
    const finalNewline = idx.lastIndexOf('\n');
    idx = idx.slice(0, finalNewline + 1) + newRegistrations.trim() + '\n';

    fs.writeFileSync(indexPath, idx);
    console.log('Updated index.js with new routes');
}

console.log('Done');
