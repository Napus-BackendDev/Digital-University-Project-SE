'use strict';

const normalizeObjectIdRef = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.value) return String(value.value);
  }
  return String(value);
};

const normalizeIdList = (values) => {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => String(item?._id || item || '').trim())
    .filter(Boolean);
};

const getNewMemberIds = ({ prev = [], next = [] }) => {
  const prevSet = new Set(normalizeIdList(prev));
  return normalizeIdList(next).filter((id) => !prevSet.has(id));
};

const getControlTypeText = (typeDoc) => {
  if (!typeDoc || !typeDoc.title) return '';
  if (Array.isArray(typeDoc.title)) {
    return typeDoc.title.map((t) => String(t?.value || '')).join(' ').toLowerCase();
  }
  return String(typeDoc.title || '').toLowerCase();
};

const toPermissionType = (value) => {
  const text = String(value || '').toLowerCase();
  return text === 'edit' ? 'edit' : 'view';
};

const getPermissionFromControlType = (typeDoc) => {
  const text = getControlTypeText(typeDoc);
  if (text.includes('edit') || text.includes('แก้ไข')) return 'edit';
  return 'view';
};

const getPermissionLabel = (permission) => {
  return toPermissionType(permission) === 'edit' ? 'Editor' : 'Viewer';
};

const buildFrontendLink = ({ formId, permission, userId, baseUrl }) => {
  const base = String(baseUrl ?? process.env.FRONTEND_URL ?? '').replace(/\/+$/, '');
  if (!base || !formId) return '';
  const permissionType = toPermissionType(permission);
  if (permissionType === 'edit') {
    const query = userId ? `?switchUser=${encodeURIComponent(String(userId))}` : '';
    return `${base}/manage/${formId}${query}`;
  }
  return `${base}/forms/${formId}?mode=preview&source=invite`;
};

module.exports = {
  normalizeObjectIdRef,
  normalizeIdList,
  getNewMemberIds,
  getControlTypeText,
  toPermissionType,
  getPermissionFromControlType,
  getPermissionLabel,
  buildFrontendLink,
};
