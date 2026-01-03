'use strict';

const STATUS = Object.freeze({
  DRAFT: 'draft',
  OPEN: 'open',
  CLOSE: 'close',
  AUTO: 'auto',
});

const ALLOW_STATUS = Object.freeze(Object.values(STATUS));

// กำหนดว่าแต่ละสถานะ ไปไหนได้บ้าง
const STATUS_TRANSITIONS = Object.freeze({
  [STATUS.DRAFT]: [STATUS.OPEN, STATUS.CLOSE, STATUS.AUTO],
  [STATUS.OPEN]: [STATUS.CLOSE, STATUS.AUTO],
  [STATUS.CLOSE]: [STATUS.OPEN, STATUS.AUTO],
});

// ฟังก์ชันเช็กว่า current → next เปลี่ยนได้ไหม
function canTransition(currentStatus, nextStatus) {
  // อนุญาตถ้า status เหมือนกัน (กรณี save โดยไม่เปลี่ยน status)
  if (currentStatus === nextStatus) {
    return true;
  }
  const allowedNext = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedNext.includes(nextStatus);
}

module.exports = {
  STATUS,
  ALLOW_STATUS,
  STATUS_TRANSITIONS,
  canTransition,
};
