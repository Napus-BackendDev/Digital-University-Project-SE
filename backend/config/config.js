var os = require('os');
require('dotenv').config();

module.exports = {
    debug: true,
    key: process.env.KEY,
    mongoURI: process.env.MONGODB,
    mongoDbName: process.env.MONGODB_DB || process.env.MONGO_DB_NAME,
    timeout: process.env.TIMEOUT,
    tokenLength: process.env.TOKENLENGTH,
    tokenExpired: (86400000 * process.env.TOKENEXPIRED),
    transactionExpired: (60000 *process.env.TRANSACTIONEXPIRED),
    host: {
        name: os.hostname(),
        url: process.env.BASE_SERVER_URL,
        port: process.env.PORT 
    }
}