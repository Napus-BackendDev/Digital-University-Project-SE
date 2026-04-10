// Helper: Safely extracts text from a role object, searching for words like 'admin' or 'edit'.
const getRoleTitleText = function (role) {
  if (!role || !role.title) return '';
  if (Array.isArray(role.title)) {
    return role.title.map((t) => String(t?.value || '')).join(' ').toLowerCase();
  }
  return String(role.title || '').toLowerCase();
};

const isAdminUser = function (user) {
  return getRoleTitleText(user?.role).includes('admin');
};

const normalizeNullableId = (value) => {
  if (!value || value === 'null' || value === 'undefined') return null;
  const raw = typeof value === 'object' ? (value._id || value.id || value.value) : value;
  return raw ? String(raw) : null;
};

// TODO: Remove this mock once real auth middleware reliably injects `request.user`
const getDemoAuthUser = (request) => {
  if (request.user) return request.user;
  
  const userId = request.body?.userId || request.query?.userId || request.body?.user || request.params?.userId;
  if (!userId || userId === 'undefined' || userId === 'null') return null;

  const isAdmin = request.body?.isAdmin === true || request.query?.isAdmin === 'true';
  const organizationId = request.body?.organizationId || request.query?.organizationId || null;

  return {
    _id: userId,
    organizationId: organizationId !== 'undefined' && organizationId !== 'null' ? organizationId : null,
    role: isAdmin ? { code: 'admin', title: 'admin' } : { code: 'user', title: 'user' }
  };
};

module.exports = {
  getRoleTitleText,
  isAdminUser,
  normalizeNullableId,
  getDemoAuthUser
};
