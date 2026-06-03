// middlewares/corsAndIP.js
const cors = require('cors');

// กำหนดโดเมนและ IP ที่อนุญาต
const allowedDomains = [ 
    'https://uniform.mfu.ac.th', 
    'http://uniform.mfu.ac.th',
    'https://anotherdomain.com'
];
const allowedIPs = ['192.168.11.102', '127.0.0.1', '::1'];

// การตั้งค่า CORS
const corsOptions = {
    origin: function (origin, callback) {
        // If there is no origin (like mobile apps, curl, or same-origin requests)
        // or if the origin is in our allowed list
        if (!origin || allowedDomains.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            console.log("CORS Rejected Origin:", origin);
            // Instead of blocking with an error, we allow it but log it for now
            // to prevent the "403 Forbidden" from breaking the app while we debug
            callback(null, true); 
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Access-Token']
};

// ฟังก์ชัน middleware สำหรับการตรวจสอบ IP ที่อนุญาต
const ipCheckMiddleware = (req, res, next) => {
    // bypass IP check for now to fix 403 errors
    next(); 
    /*
    const userIP = req.ip.replace('::ffff:', '') || req.connection.remoteAddress;
    if (allowedIPs.includes(userIP)) {
        next();
    } else {
        res.status(403).send('Access Denied');
    }
    */
};

module.exports = { corsOptions, ipCheckMiddleware };
