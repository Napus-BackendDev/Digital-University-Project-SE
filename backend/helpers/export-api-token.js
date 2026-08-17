const crypto = require('crypto');

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function isValidToken(token) {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

module.exports = { generateToken, hashToken, isValidToken };
