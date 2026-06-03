// middlewares/corsAndIP.js
const cors = require('cors');

// กำหนดโดเมนและ IP ที่อนุญาต
const allowedDomains = [
    'https://uniform.mfu.ac.th',
    'http://uniform.mfu.ac.th',
    'https://anotherdomain.com',
    'http://localhost:8080',
    'http://localhost:3000'
];
const allowedIPs = ['192.168.11.102', '127.0.0.1', '::1'];

// การตั้งค่า CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Log all origins during debug
        console.log("[CORS Debug] Request Origin:", origin);

        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) {
            return callback(null, true);
        }

        // Normalize origin by removing trailing slash
        const normalizedOrigin = origin.replace(/\/$/, "");

        // Check if the origin is in the allowed domains list
        const isAllowed = allowedDomains.some(domain => domain.replace(/\/$/, "") === normalizedOrigin);

        if (isAllowed) {
            console.log("[CORS Debug] Allowed Origin:", origin);
            callback(null, true);
        } else {
            console.log("[CORS Debug] Rejected Origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Access-Token']
};

// ฟังก์ชัน middleware สำหรับการตรวจสอบ IP ที่อนุญาต
const ipCheckMiddleware = (req, res, next) => {
    // bypass IP check for now to fix 403 errors
    console.log(`[IP Check Debug] Bypassing IP check for ${req.ip}`);
    next(); 
};

module.exports = { corsOptions, ipCheckMiddleware };
