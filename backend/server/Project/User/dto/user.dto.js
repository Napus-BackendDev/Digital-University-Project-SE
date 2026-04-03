'use strict';

const SENSITIVE_USER_FIELDS = new Set([
  'password',
  'refreshToken',
  'accessToken',
  'googleId',
  '__v',
]);

const toPlainObject = function (value) {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  if (typeof value.toJSON === 'function') return value.toJSON();
  return JSON.parse(JSON.stringify(value));
};

const sanitizeObject = function (obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = { ...obj };
  Object.keys(clean).forEach((key) => {
    if (SENSITIVE_USER_FIELDS.has(key)) delete clean[key];
  });
  return clean;
};

const mapUserDto = function (user) {
  if (!user) return user;
  return sanitizeObject(toPlainObject(user));
};

const mapUserListDto = function (users) {
  if (!Array.isArray(users)) return users;
  return users.map((user) => mapUserDto(user));
};

module.exports = {
  mapUserDto,
  mapUserListDto,
};
