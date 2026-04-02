const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});
module.exports = upload;
