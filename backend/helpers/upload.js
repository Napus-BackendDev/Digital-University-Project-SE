const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed file extensions from environment or defaults
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_FILE_EXTENSIONS || '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv').split(',');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '3') * 1024 * 1024;

const parseMaybeJson = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (err) {
        return value;
    }
};

const sanitizeSegment = (value, fallback) => {
    if (value && typeof value === 'object') {
        value = value._id || value.id || value;
    }
    const raw = value === undefined || value === null || value === '' ? fallback : String(value);
    // Remove characters that might break filesystem paths
    return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
};

const getMergedBody = (req) => {
    const body = req.body || {};
    const payload = parseMaybeJson(body.payload);

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        return { ...body, ...payload };
    }

    return body;
};

const resolveUploadRelativeDir = (req) => {
    const mergedBody = getMergedBody(req);
    const formId = sanitizeSegment(mergedBody.form || mergedBody.form_id, 'unknown-form');
    const responderId = sanitizeSegment(mergedBody.responder || mergedBody.responder_id, 'anonymous');
    const baseUrl = req.baseUrl || '';

    if (baseUrl.includes('/response')) {
        return path.join('uploads', 'forms', formId, 'responses', responderId);
    }

    if (baseUrl.includes('/question')) {
        return path.join('uploads', 'forms', formId, 'questions');
    }

    return path.join('uploads', 'misc');
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const relativeDir = resolveUploadRelativeDir(req);
        const uploadPath = path.join(__dirname, '../public', relativeDir);

        fs.mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) return cb(err, uploadPath);
            cb(null, uploadPath);
        });
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Validate file extension
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            const error = new Error(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`);
            error.code = 'INVALID_FILE_TYPE';
            return cb(error);
        }
        
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: { 
        fileSize: MAX_FILE_SIZE,
        files: 10 // Max 10 files per request
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(new Error(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
        }
        
        // Additional MIME type check
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv',
            'application/csv'
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error(`MIME type ${file.mimetype} not allowed`), false);
        }
        
        cb(null, true);
    }
});

const getUploadUrl = function (file) {
    if (!file) return null;

    const filePath = file.path || '';
    const normalized = String(filePath).split(path.sep).join('/');
    const marker = '/public/';
    const markerIndex = normalized.lastIndexOf(marker);

    if (markerIndex !== -1) {
        return normalized.slice(markerIndex + '/public'.length);
    }

    if (file.filename) {
        return `/uploads/${file.filename}`;
    }

    return null;
};

module.exports = {
    upload
    ,getUploadUrl
};
