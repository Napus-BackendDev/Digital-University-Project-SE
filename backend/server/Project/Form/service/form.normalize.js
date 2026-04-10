/**
 * Technique: Data Normalization
 * 
 * normalizeObjectIdRef: Extract the MongoDB ObjectId string from various possible formats. 
 * The frontend might send just the ID string or a full object (like {_id: "5f...", name: "X"}).
 * This ensures the backend always stores just the string ID in the database references.
 */
const normalizeObjectIdRef = function (value) {
  if (!value) return value;
  if (typeof value === 'object') {
    if (value._id) return value._id; // Evaluates if object has _id
    if (value.value) return value.value; // Maps from {value: 'id', label: 'something'} format
  }
  return value;
};

/**
 * normalizeFormPayload: This function cleans up the request payload before Save/Update.
 * It uses the 'spread operator' ({ ...payload }) to copy existing data into 'clean', 
 * and Array.map() / Array.filter() to ensure relationships contain only IDs.
 */
const normalizeFormPayload = function (payload = {}) {
  const clean = { ...payload };

  if (Array.isArray(clean.organization)) {
    clean.organization = clean.organization.map((item) => normalizeObjectIdRef(item));
  }

  if (Array.isArray(clean.controll)) {
    clean.controll = clean.controll
      .map((item) => ({
        user: normalizeObjectIdRef(item?.user), // ?. (Optional Chaining) checks if user exists before getting properties
        type: normalizeObjectIdRef(item?.type),
      }))
      .filter((item) => item.user && item.type); // Filter removes missing users/types
  }

  if (clean.settings && typeof clean.settings === 'object' && Array.isArray(clean.settings.allowedUser)) {
    clean.settings = { ...clean.settings }; // Clone nested object to prevent unexpected mutation
    clean.settings.allowedUser = clean.settings.allowedUser
      .map((item) => normalizeObjectIdRef(item))
      .filter(Boolean); // Boolean constructor inside filter removes falsy values (null/undefined/empty)
  }

  return clean;
};

module.exports = {
    normalizeFormPayload,
    normalizeObjectIdRef
};