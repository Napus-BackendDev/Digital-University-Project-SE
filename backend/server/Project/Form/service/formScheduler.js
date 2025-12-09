const cron = require('node-cron');
const FormModel = require('../models/form.model');

cron.schedule('* * * * *', async () => {
    const now = new Date();

    // 1) เปิดฟอร์มอัตโนมัติ (เฉพาะ auto mode)
    await FormModel.updateMany(
        {
            status: 'draft',
            "schedule.startAt": { $lte: now }
        },
        {
            $set: { status: 'open' }
        }
    );

    // 2) ปิดฟอร์มอัตโนมัติ (เฉพาะ auto mode)
    await FormModel.updateMany(
        {
            status: { $ne: 'close' },
            "schedule.endAt": { $lte: now }
        },
        {
            $set: { status: 'close' }
        }
    );
});
