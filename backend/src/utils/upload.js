const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 设计自定义外部存储目录结构 (按照您的要求存放在 E:\cw2026)
const uploadDir = path.join('E:', 'cw2026', 'community', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // 图片保存在 E:\cw2026 外部目录
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名 (时间戳 + 随机数 + 后缀)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// 过滤仅支持图片类型
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制图片大小为 5MB
    }
});

module.exports = upload;
