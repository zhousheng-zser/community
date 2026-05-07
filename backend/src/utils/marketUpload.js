const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageSize = require('image-size');

const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_SET = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
]);

const uploadDir = path.join(__dirname, '..', '..', 'data', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${req.file?.fieldname || file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

function marketFileFilter(_req, file, cb) {
    if (ALLOWED_MIME_SET.has(file.mimetype)) {
        cb(null, true);
        return;
    }
    const err = new Error('不支持的文件格式，仅支持 jpg/jpeg/png/webp');
    err.code = 'UNSUPPORTED_FILE_TYPE';
    cb(err, false);
}

const marketUploader = multer({
    storage,
    fileFilter: marketFileFilter,
    limits: { fileSize: UPLOAD_MAX_BYTES }
});

function withUploadHeader(res) {
    res.set('X-Upload-Max-Bytes', String(UPLOAD_MAX_BYTES));
}

function mapUploadError(err, res) {
    withUploadHeader(res);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                code: 40013,
                msg: '文件过大，最大允许 2MB',
                data: { max_bytes: UPLOAD_MAX_BYTES }
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                code: 40015,
                msg: '缺少上传文件',
                data: null
            });
        }
    }

    if (err && err.code === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({
            code: 40014,
            msg: '不支持的文件格式，仅支持 jpg/jpeg/png/webp',
            data: null
        });
    }

    return res.status(500).json({
        code: 50021,
        msg: '上传失败，请稍后重试',
        data: null
    });
}

function uploadMarketImage(req, res, next) {
    marketUploader.single('file')(req, res, (err) => {
        if (err) return mapUploadError(err, res);
        withUploadHeader(res);
        if (!req.file) {
            return res.status(400).json({
                code: 40015,
                msg: '缺少上传文件',
                data: null
            });
        }
        return next();
    });
}

function getImageMeta(filePath) {
    try {
        const meta = imageSize(filePath);
        return {
            width: meta?.width || null,
            height: meta?.height || null
        };
    } catch (_) {
        return { width: null, height: null };
    }
}

module.exports = {
    uploadMarketImage,
    UPLOAD_MAX_BYTES,
    getImageMeta
};
