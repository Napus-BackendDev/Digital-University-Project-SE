const toIdString = (value) => {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'object') {
    return String(value._id || value.value || '');
  }

  return String(value);
};

const normalizeFormPayload = (payload = {}) => {
  const clean = { ...payload };

  if (Array.isArray(clean.organization)) {
    clean.organization = clean.organization.map(toIdString).filter(Boolean);
  }

  if (Array.isArray(clean.controll)) {
    clean.controll = clean.controll
      .map((item) => ({
        user: toIdString(item?.user),
        type: toIdString(item?.type),
      }))
      .filter((item) => item.user && item.type);
  }

  if (clean.settings && typeof clean.settings === 'object' && Array.isArray(clean.settings.allowedUser)) {
    clean.settings = { ...clean.settings };
    clean.settings.allowedUser = clean.settings.allowedUser.map(toIdString).filter(Boolean);
  }

  return clean;
};

module.exports = {
  toIdString,
  normalizeFormPayload,
};