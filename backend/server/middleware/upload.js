const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const formId = req.body.form;
        const responder = req.body.responder;
        const uploadPath = path.join("uploads", formId, responder);

        fs.mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) return cb(err, uploadPath);
            cb(null, uploadPath);
        });
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});
module.exports = upload;
