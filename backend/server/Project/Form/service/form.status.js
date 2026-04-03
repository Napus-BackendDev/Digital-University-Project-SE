const getComputedStatus = function (schedule = {}) {
  const now = new Date();
  const startAt = schedule && schedule.startAt ? new Date(schedule.startAt) : null;
  const endAt = schedule && schedule.endAt ? new Date(schedule.endAt) : null;

  if (!startAt || !endAt) return 'draft';
  if (now < startAt) return 'scheduled';
  if (now > endAt) return 'closed';
  return 'open';
};

const canResponderViewForm = function ({ isPrivileged, status, hasSubmitted }) {
  if (isPrivileged) return true;
  if (status === 'open') return true;
  if (status === 'closed' && hasSubmitted) return true;
  return false;
};

module.exports = {
  getComputedStatus,
  canResponderViewForm,
};
